const HttpClient = require('../utils/httpClient');
const config = require('../config/config');
const crypto = require('crypto');

/**
 * Base class for news API services
 */
class BaseNewsService {
  /**
   * Create a new news service
   * @param {string} apiName - The name of the API (must match a key in config.newsApis)
   */
  constructor(apiName) {
    this.apiName = apiName;
    this.httpClient = new HttpClient(apiName);
  }

  /**
   * Generate a unique ID for an article
   * @param {string} source - Source name
   * @param {string} url - Article URL
   * @param {string} title - Article title
   * @returns {string} - Unique ID
   */
  generateArticleId(source, url, title) {
    const input = `${source}:${url || ''}:${title || ''}`;
    return crypto.createHash('md5').update(input).digest('hex');
  }

  /**
   * Map a category from our standard categories to the API-specific category
   * @param {string} category - Standard category name
   * @returns {string|null} - API-specific category name or null if not supported
   */
  mapCategory(category) {
    if (!category) return null;
    
    const mapping = config.categoryMapping[category.toLowerCase()];
    return mapping ? mapping[this.apiName] : null;
  }

  /**
   * Map a location from our standard locations to the API-specific location code
   * @param {string} location - Standard location code
   * @returns {string|null} - API-specific location code or null if not supported
   */
  mapLocation(location) {
    if (!location) return null;
    
    const mapping = config.countryMapping[location.toLowerCase()];
    return mapping ? mapping[this.apiName] : null;
  }

  /**
   * Format the current date in YYYY-MM-DD format
   * @returns {string} - Formatted date
   */
  getCurrentDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date from N days ago in YYYY-MM-DD format
   * @param {number} days - Number of days ago
   * @returns {string} - Formatted date
   */
  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Normalize article data to a common format
   * @param {Object} article - Raw article data from API
   * @param {string} category - Category of the article
   * @returns {Object} - Normalized article
   */
  normalizeArticle(article, category = null) {
    // This method should be implemented by subclasses
    throw new Error('normalizeArticle method must be implemented by subclass');
  }

  /**
   * Get articles by category
   * @param {string} category - Category name
   * @param {string} location - Location code
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async getArticlesByCategory(category, location = null, limit = 10) {
    // This method should be implemented by subclasses
    throw new Error('getArticlesByCategory method must be implemented by subclass');
  }

  /**
   * Search for articles
   * @param {string} query - Search query
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async searchArticles(query, category = null, location = null, limit = 10) {
    // This method should be implemented by subclasses
    throw new Error('searchArticles method must be implemented by subclass');
  }

  /**
   * Get top headlines
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async getTopHeadlines(category = null, location = null, limit = 10) {
    // This method should be implemented by subclasses
    throw new Error('getTopHeadlines method must be implemented by subclass');
  }

  /**
   * Check if the API is available (has valid credentials)
   * @returns {Promise<boolean>} - True if API is available
   */
  async isAvailable() {
    try {
      // Make a simple request to check if the API is available
      // This method should be implemented by subclasses or use a default implementation
      return true;
    } catch (error) {
      console.error(`[${this.apiName}] API not available:`, error.message);
      return false;
    }
  }
}

module.exports = BaseNewsService;