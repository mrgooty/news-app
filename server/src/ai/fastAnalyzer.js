import crypto from 'crypto';
import fastScraper from '../services/fastScraperService.js';
import CacheManager from './cacheManager.js';
import { safeQuery } from '../db/index.js';
import log from '../utils/logger.js';

const logger = log('FastAnalyzer');

// Distilled models: ~3-5x faster than bart-large-cnn with minimal quality loss.
const SUMMARY_MODEL = 'Xenova/distilbart-cnn-6-6';
const SENTIMENT_MODEL = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

const memCache = new CacheManager({ ttl: 60 * 60 * 1000, name: 'FastAnalysisCache' });

// ---------------------------------------------------------------------------
// Lazy singleton pipelines. Nothing loads at boot; first request pays the
// warm-up once, everything after runs hot. Both models load concurrently.
// ---------------------------------------------------------------------------
let summarizerPromise = null;
let sentimentPromise = null;

function getSummarizer() {
  if (!summarizerPromise) {
    summarizerPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('summarization', SUMMARY_MODEL, {
        quantized: true,
        session_options: { logSeverityLevel: 3 },
      })
    );
    summarizerPromise.then(() => logger('Summarizer ready:', SUMMARY_MODEL));
  }
  return summarizerPromise;
}

function getSentiment() {
  if (!sentimentPromise) {
    sentimentPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('sentiment-analysis', SENTIMENT_MODEL, {
        quantized: true,
        session_options: { logSeverityLevel: 3 },
      })
    );
    sentimentPromise.then(() => logger('Sentiment model ready:', SENTIMENT_MODEL));
  }
  return sentimentPromise;
}

/** Optional: call at boot with WARM_MODELS=true to pre-load in background. */
export function warmModels() {
  Promise.all([getSummarizer(), getSentiment()]).catch((e) =>
    logger.error('Model warm-up failed:', e.message)
  );
}

// ---------------------------------------------------------------------------
// Divide & conquer helpers
// ---------------------------------------------------------------------------

/** Split text into ~maxWords chunks on sentence boundaries. */
function chunkText(text, maxWords = 450) {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*/g) || [text];
  const chunks = [];
  let current = [];
  let count = 0;
  for (const s of sentences) {
    const w = s.split(/\s+/).length;
    if (count + w > maxWords && current.length) {
      chunks.push(current.join(' '));
      current = [];
      count = 0;
    }
    current.push(s.trim());
    count += w;
  }
  if (current.length) chunks.push(current.join(' '));
  return chunks;
}

const STOPWORDS = new Set(
  'a,an,the,and,or,but,if,then,else,when,while,of,in,on,at,to,from,by,for,with,about,into,through,during,before,after,above,below,up,down,out,off,over,under,again,further,once,here,there,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,can,will,just,should,now,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,would,could,it,its,this,that,these,those,he,she,they,them,his,her,their,we,our,you,your,i,me,my,as,also,said,says,new,one,two,mr,ms,mrs,according,told,reuters,ap'.split(',')
);

/** Lightweight TF keyword extraction with proper-noun boosting. */
function extractKeywords(text, limit = 10) {
  const freq = new Map();
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const raw = words[i].replace(/[^a-zA-Z0-9'-]/g, '');
    if (raw.length < 3) continue;
    const lower = raw.toLowerCase();
    if (STOPWORDS.has(lower)) continue;
    // Boost capitalized words mid-sentence (likely entities)
    const isProper = /^[A-Z]/.test(raw) && i > 0 && !/[.!?]$/.test(words[i - 1] || '');
    const key = isProper ? raw : lower;
    freq.set(key, (freq.get(key) || 0) + (isProper ? 2.5 : 1));
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function urlHash(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

function sentimentLabelText(label) {
  switch (label?.toLowerCase()) {
    case 'positive':
      return 'This article has a positive sentiment.';
    case 'negative':
      return 'This article has a negative sentiment.';
    default:
      return 'This article has a neutral sentiment.';
  }
}

// ---------------------------------------------------------------------------
// Main service
// ---------------------------------------------------------------------------
class FastAnalyzer {
  /**
   * Analyze an article by URL. Order of operations:
   *  1. memory cache (instant)
   *  2. Neon DB cache (a few ms, survives restarts — shared across users)
   *  3. scrape → chunk → parallel local inference → persist
   */
  async analyze({ url, title = null }) {
    const hash = urlHash(url);

    const cached = memCache.get(hash);
    if (cached) return { ...cached, cache: 'memory' };

    const dbRow = await safeQuery(
      'SELECT summary, sentiment, sentiment_score, sentiment_label, confidence, keywords, suggestions FROM article_analysis WHERE url_hash = $1',
      [hash]
    );
    if (dbRow?.rows?.length) {
      const r = dbRow.rows[0];
      const result = {
        summary: r.summary,
        sentiment: { label: r.sentiment, score: r.sentiment_score },
        sentimentLabel: r.sentiment_label,
        confidence: r.confidence,
        keywords: r.keywords || [],
        suggestions: r.suggestions || [],
      };
      memCache.set(hash, result);
      return { ...result, cache: 'db' };
    }

    const started = Date.now();

    // Kick off model loading and scraping concurrently (lazy load overlap)
    const [summarizer, sentimentPipe, scraped] = await Promise.all([
      getSummarizer(),
      getSentiment(),
      fastScraper.scrape(url),
    ]);

    if (!scraped.text || scraped.text.length < 200) {
      return {
        summary: 'Could not extract enough article content to analyze.',
        sentiment: { label: 'UNAVAILABLE', score: 0 },
        sentimentLabel: 'Analysis not available.',
        confidence: 0,
        keywords: [],
        suggestions: [],
      };
    }

    const text = scraped.text.slice(0, 40000); // hard safety cap
    const chunks = chunkText(text);

    // Divide & conquer: summarize and score every chunk in parallel.
    // Sentiment models cap at 512 tokens, so per-chunk is also more accurate.
    const chunkJobs = chunks.map(async (chunk) => {
      const [sum, sen] = await Promise.all([
        summarizer(chunk, { max_length: 120, min_length: 25 }),
        sentimentPipe(chunk.slice(0, 2000)),
      ]);
      return {
        summary: sum[0]?.summary_text || '',
        sentiment: sen[0] || { label: 'NEUTRAL', score: 0.5 },
      };
    });
    const chunkResults = await Promise.all(chunkJobs);

    // Reduce step 1: merge chunk summaries; re-summarize if still long.
    let summary = chunkResults.map((c) => c.summary).join(' ').trim();
    if (chunks.length > 1 && summary.split(/\s+/).length > 180) {
      const final = await summarizer(summary, { max_length: 160, min_length: 60 });
      summary = final[0]?.summary_text || summary;
    }

    // Reduce step 2: length-weighted sentiment aggregation.
    let pos = 0;
    let neg = 0;
    chunkResults.forEach((c, i) => {
      const weight = chunks[i].length;
      if (c.sentiment.label === 'POSITIVE') pos += c.sentiment.score * weight;
      else neg += c.sentiment.score * weight;
    });
    const total = pos + neg || 1;
    const label = pos >= neg ? 'POSITIVE' : 'NEGATIVE';
    const score = Math.max(pos, neg) / total;
    // Near 50/50 splits are effectively neutral/mixed.
    const finalLabel = score < 0.62 ? 'NEUTRAL' : label;

    const keywords = extractKeywords(text);
    const suggestions = keywords.slice(0, 5).map((k) => ({
      type: 'search',
      label: `More on "${k}"`,
      query: k,
    }));

    const result = {
      summary,
      sentiment: { label: finalLabel, score: Number(score.toFixed(3)) },
      sentimentLabel: sentimentLabelText(finalLabel),
      confidence: Number(score.toFixed(3)),
      keywords,
      suggestions,
    };

    memCache.set(hash, result);
    safeQuery(
      `INSERT INTO article_analysis
        (url_hash, url, title, summary, sentiment, sentiment_score, sentiment_label, confidence, keywords, suggestions, model)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (url_hash) DO UPDATE SET
         summary = EXCLUDED.summary, sentiment = EXCLUDED.sentiment,
         sentiment_score = EXCLUDED.sentiment_score, sentiment_label = EXCLUDED.sentiment_label,
         confidence = EXCLUDED.confidence, keywords = EXCLUDED.keywords,
         suggestions = EXCLUDED.suggestions, model = EXCLUDED.model, created_at = now()`,
      [hash, url, title, summary, finalLabel, score, result.sentimentLabel, score, keywords, JSON.stringify(suggestions), `${SUMMARY_MODEL}+${SENTIMENT_MODEL}`]
    ); // fire-and-forget

    logger(
      `Analyzed ${url} in ${Date.now() - started}ms (${chunks.length} chunks, ${scraped.method})`
    );
    return result;
  }
}

export default new FastAnalyzer();
