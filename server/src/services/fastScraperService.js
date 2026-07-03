import axios from 'axios';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';
import log from '../utils/logger.js';

const logger = log('FastScraper');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Fast article extraction: plain HTTP fetch + Mozilla Readability.
 * ~100-500ms vs 5-15s for a puppeteer round-trip. Puppeteer is only
 * used as a last resort for JS-rendered pages.
 */
class FastScraperService {
  async scrape(url) {
    const started = Date.now();
    try {
      const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
        timeout: 10000,
        maxRedirects: 5,
        responseType: 'text',
      });

      const text = this.extract(html, url);
      if (text && text.length > 400) {
        logger(`Fast path extracted ${text.length} chars in ${Date.now() - started}ms: ${url}`);
        return { text, method: 'fetch+readability' };
      }
      logger(`Fast path thin content (${text?.length || 0} chars), falling back to puppeteer: ${url}`);
    } catch (err) {
      logger(`Fast path failed (${err.message}), falling back to puppeteer: ${url}`);
    }

    // Fallback: heavy browser scrape for JS-rendered / bot-walled pages
    try {
      const { default: ArticleScraperService } = await import('./articleScraperService.js');
      const text = await new ArticleScraperService().scrape(url);
      return { text, method: 'puppeteer' };
    } catch (err) {
      logger.error(`Both scrape paths failed for ${url}: ${err.message}`);
      return { text: null, method: 'none' };
    }
  }

  extract(html, url) {
    const virtualConsole = new VirtualConsole(); // silence CSS parse noise
    const dom = new JSDOM(html, { url, virtualConsole });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article?.textContent) return null;
    return article.textContent.replace(/\s+/g, ' ').trim();
  }
}

export default new FastScraperService();
