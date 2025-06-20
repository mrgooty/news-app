const summarizationService = require('./summarizationService');
const articleScraperService = require('../services/articleScraperService');
const BertAnalyzer = require('./bertAnalyzer');
const CacheManager = require('./cacheManager');
const log = require('../utils/logger')('ArticleAnalyzer');

// Cache results for 1 hour to avoid re-scraping and re-summarizing
const summaryCache = new CacheManager(3600).withName('SummaryCache');

// Basic URL validation regex
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

/**
 * A dedicated service for on-demand article analysis (summarization and sentiment).
 */
class ArticleAnalyzerService {
  constructor() {
    // Local BERT analyzer for sentiment analysis
    this.bertAnalyzer = new BertAnalyzer();
    // In a real app, you might inject these dependencies
    this.summarizer = summarizationService;
    this.scraper = articleScraperService;
  }

  /**
   * Performs summarization and sentiment analysis on a given article's content.
   *
   * @param {string} content The text content of the article.
   * @param {string} title The title of the article.
   * @returns {Promise<{summary: string, sentiment: string, sentimentLabel: string}>}
   */
  async analyze(content, title) {
    log(`Starting analysis for article: ${title}`);
    const articleContent = content || ''; // Ensure content is not null

    try {
      // Run summarization and sentiment analysis in parallel
      const [summary, sentimentResult] = await Promise.all([
        summarizationService.summarize(articleContent),
        this.bertAnalyzer.analyzeSentiment(articleContent)
      ]);

      const analysis = {
        summary: summary || 'Could not generate a summary.',
        sentiment: sentimentResult,
        sentimentLabel: this.getSentimentLabel(sentimentResult),
      };

      log(`Analysis complete for: ${title}`);
      return analysis;

    } catch (error) {
      log.error(`An unexpected error occurred during analysis for "${title}":`, error);
      throw new Error('Failed to analyze the article.');
    }
  }
  
  /**
   * Maps a sentiment label to a more user-friendly version.
   * @param {string} sentiment The sentiment from the analysis (e.g., 'positive', 'negative').
   * @returns {string} A user-friendly label.
   */
  getSentimentLabel(sentiment) {
    switch(sentiment?.toLowerCase()) {
      case 'positive':
        return 'This article has a positive sentiment.';
      case 'negative':
        return 'This article has a negative sentiment.';
      default:
        return 'This article has a neutral sentiment.';
    }
  }

  async summarizeArticle({ url }) {
    log(`Starting summarization process for URL: ${url}`);
    
    if (!url || !URL_REGEX.test(url)) {
      log(`WARN: Summarize called with an invalid URL: ${url}`);
      throw new Error('Invalid URL provided.');
    }
    
    // Check cache first
    const cachedSummary = summaryCache.get(url);
    if (cachedSummary) {
      return { summary: cachedSummary, entities: [], sentiment: 'neutral' };
    }

    try {
      const articleText = await this.scraper.scrape(url);

      if (articleText.startsWith('Could not extract') || articleText.startsWith('Failed to scrape')) {
        log(`WARN: Scraping did not yield content for ${url}. Returning message to user.`);
        return { summary: articleText, entities: [], sentiment: 'neutral' };
      }

      const summary = await this.summarizer.summarize(articleText);
      
      // Store successful summary in cache
      summaryCache.set(url, summary);

      return { summary, entities: [], sentiment: 'neutral' };

    } catch (error) {
      log(`ERROR: Error in summarizeArticle for URL ${url}:`, error);
      // Re-throwing the error lets the route handler decide the status code
      throw new Error('An unexpected error occurred during the analysis process.');
    }
  }
}

// Export a singleton instance
module.exports = new ArticleAnalyzerService(); 