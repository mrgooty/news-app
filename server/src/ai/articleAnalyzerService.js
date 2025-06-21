import articleScraperService from '../services/articleScraperService.js';
import CacheManager from './cacheManager.js';
import log from '../utils/logger.js';

const logger = log('ArticleAnalyzer');
const analysisCache = new CacheManager(3600).withName('AnalysisCache');
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

/**
 * A dedicated service for on-demand article analysis (summarization and sentiment).
 */
class ArticleAnalyzerService {
  constructor() {
    this.summarizer = null;
    this.sentimentAnalyzer = null;
    this.initializing = this.init();
  }

  async init() {
    try {
      logger('Initializing analysis pipelines...');
      // Use dynamic import for ES Modules as @xenova/transformers is an ESM package
      const { pipeline } = await import('@xenova/transformers');
      this.summarizer = await pipeline('summarization', 'Xenova/bart-large-cnn', {
        session_options: { logSeverityLevel: 3 },
      });
      this.sentimentAnalyzer = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
        session_options: { logSeverityLevel: 3 },
      });
      logger('Analysis pipelines initialized successfully.');
    } catch (error) {
      logger('ERROR: Failed to initialize analysis pipelines:', error);
    }
  }

  /**
   * Maps a sentiment label to a more user-friendly version.
   * @param {object} sentiment The sentiment object from the analysis.
   * @returns {string} A user-friendly label.
   */
  getSentimentLabel(sentiment) {
    switch (sentiment?.label?.toLowerCase()) {
      case 'positive':
        return 'This article has a positive sentiment.';
      case 'negative':
        return 'This article has a negative sentiment.';
      default:
        return 'This article has a neutral sentiment.';
    }
  }

  async analyzeArticle({ url }) {
    await this.initializing;
    if (!this.summarizer || !this.sentimentAnalyzer) {
      logger('ERROR: Analysis service is not initialized.');
      throw new Error('Analysis service is not available.');
    }

    logger(`Starting analysis process for URL: ${url}`);
    
    if (!url || !URL_REGEX.test(url)) {
      logger(`WARN: Analyze called with an invalid URL: ${url}`);
      throw new Error('Invalid URL provided.');
    }
    
    const cachedAnalysis = analysisCache.get(url);
    if (cachedAnalysis) {
      logger(`Cache HIT for analysis of URL: ${url}`);
      return cachedAnalysis;
    }
    logger(`Cache MISS for analysis of URL: ${url}`);

    try {
      const articleText = await this.scraper.scrape(url);

      if (articleText.startsWith('Could not extract') || articleText.startsWith('Failed to scrape')) {
        logger(`WARN: Scraping did not yield content for ${url}. Returning message to user.`);
        // Return a structured response that the frontend can handle
        return { 
          summary: articleText, 
          sentiment: { label: 'UNAVAILABLE', score: 0 },
          sentimentLabel: 'Analysis not available.'
        };
      }

      // Run both tasks in parallel for efficiency
      const [summaryResult, sentimentResult] = await Promise.all([
        this.summarizer(articleText, { max_length: 200, min_length: 50 }),
        this.sentimentAnalyzer(articleText)
      ]);
      
      const sentiment = sentimentResult[0] || { label: 'NEUTRAL', score: 0.5 };
      const analysis = {
        summary: summaryResult[0]?.summary_text || 'Could not generate summary.',
        sentiment: sentiment,
        sentimentLabel: this.getSentimentLabel(sentiment),
      };

      analysisCache.set(url, analysis);
      logger(`Analysis complete for URL: ${url}`);
      return analysis;

    } catch (error) {
      logger(`ERROR: An unexpected error occurred during the analysis process for URL ${url}:`, error);
      // Re-throwing the error lets the route handler decide the status code
      throw new Error('An unexpected error occurred during the analysis process.');
    }
  }
}

// Scraper is now instantiated within the class, but let's keep it clean
// and inject it, assuming it doesn't have a complex state itself.
ArticleAnalyzerService.prototype.scraper = articleScraperService;

// Export a singleton instance
const articleAnalyzerServiceInstance = new ArticleAnalyzerService();
export default articleAnalyzerServiceInstance; 