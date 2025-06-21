import BaseNewsService from './baseNewsService.js';

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
   * Fetch articles by category
   * @param {string} category - The category to fetch articles for
   * @param {string} location - The location to fetch articles for
   * @param {number} limit - The number of articles to return
   * @param {number} offset - The offset for pagination
   * @returns {Promise<Array>} - A promise that resolves to an array of articles
   */
  async getArticlesByCategory(category, location, limit = 20, offset = 0) {
    const page = offset ? Math.floor(offset / limit) + 1 : 1;
    const params = {
      category: this.mapCategory(category),
      country: this.mapLocation(location),
      pageSize: limit,
      page,
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
    const page = offset ? Math.floor(offset / limit) + 1 : 1;
    const params = {
      q: query,
      pageSize: limit,
      page,
    };
    if (category) params.category = this.mapCategory(category);
    // Note: NewsAPI 'country' param is not supported on 'everything' endpoint, so we don't pass it for search
    return this.fetch('everything', params, category);
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
      // Make a lightweight request to a valid endpoint to check availability
      const response = await this.httpClient.get('/top-headlines', {
        country: 'us',
        pageSize: 1
      });
      return response && response.status === 'ok';
    } catch (error) {
      console.error('[NewsAPI] API not available:', error.message);
      return false;
    }
  }
}

export default NewsApiService;