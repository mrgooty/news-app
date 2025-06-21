import BaseNewsService from './baseNewsService.js';

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
      section: this.mapCategory(category),
      'production-office': this.mapLocation(location),
      'page-size': limit,
      page,
      'show-fields': 'trailText,bodyText,thumbnail',
    };
    return this.fetch('search', params, category);
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
    let q = query;
    if (category) {
      q += ` AND section:${this.mapCategory(category)}`;
    }
    const params = {
      q,
      'production-office': this.mapLocation(location),
      'page-size': limit,
      page,
      'show-fields': 'trailText,bodyText,thumbnail',
    };
    return this.fetch('search', params, category);
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

export default GuardianApiService;