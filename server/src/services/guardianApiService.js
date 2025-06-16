const BaseNewsService = require('./baseNewsService');

/**
 * Service for fetching news from The Guardian API
 */
class GuardianApiService extends BaseNewsService {
  constructor() {
    super('guardian');
  }

  /**
   * Normalize article data from The Guardian to our common format
   * @param {Object} article - Raw article data from The Guardian
   * @param {string} category - Category of the article
   * @returns {Object} - Normalized article
   */
  normalizeArticle(article, category = null) {
    // Extract the thumbnail URL if available
    let imageUrl = null;
    if (article.fields && article.fields.thumbnail) {
      imageUrl = article.fields.thumbnail;
    }

    // Extract content if available
    let content = '';
    if (article.fields && article.fields.bodyText) {
      content = article.fields.bodyText;
    } else if (article.fields && article.fields.trailText) {
      content = article.fields.trailText;
    }

    return {
      id: this.generateArticleId('guardian', article.id, article.webTitle),
      title: article.webTitle || 'No title available',
      description: article.fields?.trailText || '',
      content: content,
      url: article.webUrl || '',
      imageUrl: imageUrl,
      source: 'The Guardian',
      publishedAt: article.webPublicationDate || new Date().toISOString(),
      category: category || article.sectionName || 'general',
      location: article.fields?.byline || null,
    };
  }

  /**
   * Get articles by category from The Guardian
   * @param {string} category - Category name
   * @param {string} location - Location code
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async getArticlesByCategory(category, location = null, limit = 10) {
    try {
      const apiSection = this.mapCategory(category);
      
      const params = {
        'section': apiSection || 'news',
        'page-size': limit,
        'show-fields': 'headline,trailText,bodyText,thumbnail,byline',
        'order-by': 'newest',
      };
      
      // The Guardian API doesn't support country filtering in the same way as other APIs
      // We could use a tag for location if needed
      if (location) {
        const apiLocation = this.mapLocation(location);
        if (apiLocation) {
          params.tag = `world/${apiLocation}`;
        }
      }
      
      const response = await this.httpClient.get('/search', params);
      
      if (!response.response || !response.response.results || !Array.isArray(response.response.results)) {
        console.error('[Guardian] Invalid response format:', response);
        return [];
      }
      
      return response.response.results.map(article => this.normalizeArticle(article, category));
    } catch (error) {
      console.error('[Guardian] Error fetching articles by category:', error.message);
      return [];
    }
  }

  /**
   * Search for articles using The Guardian API
   * @param {string} query - Search query
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async searchArticles(query, category = null, location = null, limit = 10) {
    try {
      const params = {
        'q': query,
        'page-size': limit,
        'show-fields': 'headline,trailText,bodyText,thumbnail,byline',
        'order-by': 'relevance',
        'from-date': this.getDateDaysAgo(30), // Last 30 days
      };
      
      // Add section filter if category is provided
      if (category) {
        const apiSection = this.mapCategory(category);
        if (apiSection) {
          params.section = apiSection;
        }
      }
      
      // Add location filter if provided
      if (location) {
        const apiLocation = this.mapLocation(location);
        if (apiLocation) {
          params.tag = `world/${apiLocation}`;
        }
      }
      
      const response = await this.httpClient.get('/search', params);
      
      if (!response.response || !response.response.results || !Array.isArray(response.response.results)) {
        console.error('[Guardian] Invalid response format:', response);
        return [];
      }
      
      return response.response.results.map(article => this.normalizeArticle(article, category));
    } catch (error) {
      console.error('[Guardian] Error searching articles:', error.message);
      return [];
    }
  }

  /**
   * Get top headlines from The Guardian
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Array of normalized articles
   */
  async getTopHeadlines(category = null, location = null, limit = 10) {
    try {
      const params = {
        'page-size': limit,
        'show-fields': 'headline,trailText,bodyText,thumbnail,byline',
        'order-by': 'newest',
      };
      
      // Add section filter if category is provided
      if (category) {
        const apiSection = this.mapCategory(category);
        if (apiSection) {
          params.section = apiSection;
        }
      }
      
      // Add location filter if provided
      if (location) {
        const apiLocation = this.mapLocation(location);
        if (apiLocation) {
          params.tag = `world/${apiLocation}`;
        }
      }
      
      const response = await this.httpClient.get('/search', params);
      
      if (!response.response || !response.response.results || !Array.isArray(response.response.results)) {
        console.error('[Guardian] Invalid response format:', response);
        return [];
      }
      
      return response.response.results.map(article => this.normalizeArticle(article, category));
    } catch (error) {
      console.error('[Guardian] Error fetching top headlines:', error.message);
      return [];
    }
  }

  /**
   * Check if The Guardian API is available (has valid credentials)
   * @returns {Promise<boolean>} - True if API is available
   */
  async isAvailable() {
    try {
      // Make a simple request to check if the API is available
      const response = await this.httpClient.get('/sections');
      return response && response.response && response.response.status === 'ok';
    } catch (error) {
      console.error('[Guardian] API not available:', error.message);
      return false;
    }
  }
}

module.exports = GuardianApiService;