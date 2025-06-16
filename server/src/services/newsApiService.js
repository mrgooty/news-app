const BaseNewsService = require('./baseNewsService');

/**
 * Service for fetching news from NewsAPI.org
 */
class NewsApiService extends BaseNewsService {
  constructor() {
    super('newsapi');
  }

  /**
   * Normalize article data from NewsAPI to our common format
   * @param {Object} article - Raw article data from NewsAPI
   * @param {string} category - Category of the article
   * @returns {Object} - Normalized article
   */
  normalizeArticle(article, category = null) {
    return {
      id: this.generateArticleId('newsapi', article.url, article.title),
      title: article.title || 'No title available',
      description: article.description || '',
      content: article.content || article.description || '',
      url: article.url || '',
      imageUrl: article.urlToImage || null,
      source: article.source?.name || 'NewsAPI',
      publishedAt: article.publishedAt || new Date().toISOString(),
      category: category || 'general',
      location: article.country || null,
    };
  }

  /**
   * Get articles by category from NewsAPI
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
        category: apiCategory,
        pageSize: limit,
        language: 'en',
      };
      
      if (apiCountry) {
        params.country = apiCountry;
      }
      
      const response = await this.httpClient.get('/top-headlines', params);
      
      if (!response.articles || !Array.isArray(response.articles)) {
        console.error('[NewsAPI] Invalid response format:', response);
        return [];
      }
      
      return response.articles.map(article => this.normalizeArticle(article, category));
    } catch (error) {
      console.error('[NewsAPI] Error fetching articles by category:', error.message);
      return [];
    }
  }

  /**
   * Search for articles using NewsAPI
   * @param {string} query - Search query
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async searchArticles(query, category = null, location = null, limit = 10) {
    try {
      const params = {
        q: query,
        pageSize: limit,
        language: 'en',
        sortBy: 'relevancy',
        from: this.getDateDaysAgo(7), // Last 7 days
      };
      
      // If category is provided, add it to the query
      if (category) {
        const apiCategory = this.mapCategory(category);
        if (apiCategory) {
          params.q += ` AND category:${apiCategory}`;
        }
      }
      
      // If location is provided, add it as a country filter
      if (location) {
        const apiCountry = this.mapLocation(location);
        if (apiCountry) {
          params.q += ` AND country:${apiCountry}`;
        }
      }
      
      const response = await this.httpClient.get('/everything', params);
      
      if (!response.articles || !Array.isArray(response.articles)) {
        console.error('[NewsAPI] Invalid response format:', response);
        return [];
      }
      
      return response.articles.map(article => this.normalizeArticle(article, category));
    } catch (error) {
      console.error('[NewsAPI] Error searching articles:', error.message);
      return [];
    }
  }

  /**
   * Get top headlines from NewsAPI
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async getTopHeadlines(category = null, location = null, limit = 10) {
    try {
      const params = {
        pageSize: limit,
        language: 'en',
      };
      
      if (category) {
        const apiCategory = this.mapCategory(category);
        if (apiCategory) {
          params.category = apiCategory;
        }
      }
      
      if (location) {
        const apiCountry = this.mapLocation(location);
        if (apiCountry) {
          params.country = apiCountry;
        }
      }
      
      const response = await this.httpClient.get('/top-headlines', params);
      
      if (!response.articles || !Array.isArray(response.articles)) {
        console.error('[NewsAPI] Invalid response format:', response);
        return [];
      }
      
      return response.articles.map(article => this.normalizeArticle(article, category));
    } catch (error) {
      console.error('[NewsAPI] Error fetching top headlines:', error.message);
      return [];
    }
  }

  /**
   * Check if the NewsAPI is available (has valid credentials)
   * @returns {Promise<boolean>} - True if API is available
   */
  async isAvailable() {
    try {
      // Make a simple request to check if the API is available
      const response = await this.httpClient.get('/sources', { language: 'en', pageSize: 1 });
      return response && response.status === 'ok';
    } catch (error) {
      console.error('[NewsAPI] API not available:', error.message);
      return false;
    }
  }
}

module.exports = NewsApiService;