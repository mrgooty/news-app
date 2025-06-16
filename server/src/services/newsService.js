const axios = require('axios');
const config = require('../config/config');

/**
 * Service for fetching news from various APIs
 */
class NewsService {
  constructor() {
    // Configure axios instances for each news API
    this.newsapi = axios.create({
      baseURL: config.newsApis.newsapi.baseUrl,
      params: {
        apiKey: config.newsApis.newsapi.apiKey,
      },
    });

    this.gnews = axios.create({
      baseURL: config.newsApis.gnews.baseUrl,
      params: {
        token: config.newsApis.gnews.apiKey,
      },
    });

    this.nytimes = axios.create({
      baseURL: config.newsApis.nytimes.baseUrl,
      params: {
        'api-key': config.newsApis.nytimes.apiKey,
      },
    });

    this.guardian = axios.create({
      baseURL: config.newsApis.guardian.baseUrl,
      params: {
        'api-key': config.newsApis.guardian.apiKey,
      },
    });
  }

  /**
   * Get news articles by category from NewsAPI
   * @param {string} category - The news category
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of news articles
   */
  async getNewsByCategory(category, limit = 10) {
    try {
      const response = await this.newsapi.get('/top-headlines', {
        params: {
          category,
          pageSize: limit,
          language: 'en',
        },
      });

      return response.data.articles.map(article => ({
        id: article.url, // Using URL as a unique identifier
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source.name,
        publishedAt: article.publishedAt,
        category,
      }));
    } catch (error) {
      console.error('Error fetching news by category:', error);
      return [];
    }
  }

  /**
   * Search for news articles across multiple APIs
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of news articles
   */
  async searchNews(query, limit = 10) {
    try {
      // For now, we'll just use NewsAPI for searching
      const response = await this.newsapi.get('/everything', {
        params: {
          q: query,
          pageSize: limit,
          language: 'en',
          sortBy: 'relevancy',
        },
      });

      return response.data.articles.map(article => ({
        id: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source.name,
        publishedAt: article.publishedAt,
      }));
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  }

  /**
   * Get available news categories
   * @returns {Array} - Array of category objects
   */
  getCategories() {
    // These are standard categories available in most news APIs
    return [
      { id: 'business', name: 'Business', description: 'Business and finance news' },
      { id: 'entertainment', name: 'Entertainment', description: 'Entertainment and celebrity news' },
      { id: 'general', name: 'General', description: 'General news' },
      { id: 'health', name: 'Health', description: 'Health and wellness news' },
      { id: 'science', name: 'Science', description: 'Science and research news' },
      { id: 'sports', name: 'Sports', description: 'Sports news and updates' },
      { id: 'technology', name: 'Technology', description: 'Latest tech news' },
    ];
  }
}

module.exports = NewsService;