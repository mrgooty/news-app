import BaseNewsService from './baseNewsService.js';

/**
 * Service for fetching news from GNews API
 */
class GNewsApiService extends BaseNewsService {
  constructor() {
    super('gnews');
  }

  /**
   * Normalize article data from GNews to our common format
   * @param {Object} article - Raw article data from GNews
   * @param {string} category - Category of the article
   * @returns {Object} - Normalized article
   */
  normalizeArticle(article, category = null) {
    return {
      id: this.generateArticleId('gnews', article.url, article.title),
      title: article.title || 'No title available',
      description: article.description || '',
      content: article.content || article.description || '',
      url: article.url || '',
      imageUrl: article.image || null,
      source: article.source?.name || 'GNews',
      publishedAt: article.publishedAt || new Date().toISOString(),
      category: category || 'general',
      location: null, // GNews doesn't provide location in article data
    };
  }

  /**
   * Fetch articles by category
   * @param {string} category - The category to fetch articles for
   * @param {string} location - The location to fetch articles for
   * @param {number} limit - The number of articles to return
   * @param {number} offset - The offset for pagination
   * @returns {Promise<Array>} - A promise that resolves to an array of articles
   */
  async getArticlesByCategory(category, location, limit = 20, offset = 0) {
    const params = {
      topic: this.mapCategory(category),
      country: this.mapLocation(location),
      max: limit,
      offset,
    };
    return this.fetch('top-headlines', params, category);
  }

  /**
   * Search for articles
   * @param {string} query - The search query
   * @param {string} category - The category to search in
   * @param {string} location - The location to search in
   * @param {number} limit - The number of articles to return
   * @param {number} offset - The offset for pagination
   * @returns {Promise<Array>} - A promise that resolves to an array of articles
   */
  async searchArticles(query, category, location, limit = 20, offset = 0) {
    let q = query;
    if (category) {
      q += ` topic:${this.mapCategory(category)}`;
    }
    const params = {
      q,
      country: this.mapLocation(location),
      max: limit,
      offset,
    };
    return this.fetch('search', params, category);
  }

  /**
   * Get top headlines from GNews
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async getTopHeadlines(category = null, location = null, limit = 10) {
    try {
      const apiCategory = this.mapCategory(category);
      const apiCountry = this.mapLocation(location);
      
      const params = {
        max: limit,
        lang: 'en',
      };
      
      if (apiCategory) {
        params.category = apiCategory;
      }
      
      if (apiCountry) {
        params.country = apiCountry;
      }
      
      const response = await this.httpClient.get('/top-headlines', params);
      
      if (!response.articles || !Array.isArray(response.articles)) {
        console.error('[GNews] Invalid response format:', response);
        return [];
      }
      
      return response.articles.map(article => this.normalizeArticle(article, category));
    } catch (error) {
      console.error('[GNews] Error fetching top headlines:', error.message);
      return [];
    }
  }

  /**
   * Check if the GNews API is available (has valid credentials)
   * @returns {Promise<boolean>} - True if API is available
   */
  async isAvailable() {
    try {
      // Make a simple request to check if the API is available
      const response = await this.httpClient.get('/top-headlines', { 
        lang: 'en', 
        max: 1,
        category: 'general'
      });
      return response && response.articles && Array.isArray(response.articles);
    } catch (error) {
      console.error('[GNews] API not available:', error.message);
      return false;
    }
  }
}

export default GNewsApiService;