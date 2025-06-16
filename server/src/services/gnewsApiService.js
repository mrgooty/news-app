const BaseNewsService = require('./baseNewsService');

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
   * Get articles by category from GNews
   * @param {string} category - Category name
   * @param {string} location - Location code
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async getArticlesByCategory(category, location = null, limit = 10) {
    try {
      const apiCategory = this.mapCategory(category);
      const apiCountry = this.mapLocation(location);
      
      const params = {
        category: apiCategory || 'general',
        max: limit,
        lang: 'en',
      };
      
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
      console.error('[GNews] Error fetching articles by category:', error.message);
      return [];
    }
  }

  /**
   * Search for articles using GNews
   * @param {string} query - Search query
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async searchArticles(query, category = null, location = null, limit = 10) {
    try {
      const apiCountry = this.mapLocation(location);
      
      const params = {
        q: query,
        max: limit,
        lang: 'en',
        sortby: 'relevance',
        from: this.getDateDaysAgo(7), // Last 7 days
        to: this.getCurrentDate(),
      };
      
      if (apiCountry) {
        params.country = apiCountry;
      }
      
      // GNews doesn't support category filtering in search, so we'll filter client-side if needed
      
      const response = await this.httpClient.get('/search', params);
      
      if (!response.articles || !Array.isArray(response.articles)) {
        console.error('[GNews] Invalid response format:', response);
        return [];
      }
      
      let articles = response.articles.map(article => this.normalizeArticle(article, category));
      
      // If category is provided, filter the results client-side
      if (category) {
        const apiCategory = this.mapCategory(category);
        if (apiCategory) {
          // This is a simple filter that might not be accurate since GNews doesn't categorize search results
          articles = articles.filter(article => 
            article.title.toLowerCase().includes(category.toLowerCase()) || 
            article.description.toLowerCase().includes(category.toLowerCase())
          );
        }
      }
      
      return articles;
    } catch (error) {
      console.error('[GNews] Error searching articles:', error.message);
      return [];
    }
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

module.exports = GNewsApiService;