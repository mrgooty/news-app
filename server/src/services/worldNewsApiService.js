import BaseNewsService from './baseNewsService.js';

/**
 * Service class for interacting with the World News API.
 */
class WorldNewsApiService extends BaseNewsService {
  constructor() {
    super('worldnewsapi');
    this.searchEndpoint = 'search-news';
    this.topNewsEndpoint = 'top-news';
  }

  /**
   * Normalizes an article from the World News API into a standard format.
   * @param {object} article - The article object from the API.
   * @returns {object} A normalized article object.
   */
  normalizeArticle(article) {
    return {
      id: article.id,
      title: article.title,
      description: article.summary,
      content: article.text,
      url: article.url,
      imageUrl: article.image,
      source: article.source_country,
      publishedAt: article.publish_date,
      category: article.category?.toLowerCase() || 'general',
    };
  }

  /**
   * Fetches articles by category from the World News API.
   * @param {string} category - The category to fetch.
   * @param {string} location - The location (source country).
   * @param {number} limit - The number of articles to fetch.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of normalized articles.
   */
  async getArticlesByCategory(category, location = null, limit = 20) {
    const params = {
      
      'source-countries': location,
      'number': limit,
      'sort': 'publish-time',
      'sort-direction': 'DESC',
      'text': this.mapCategory(category),
    };
    
    const data = await this.fetch(this.searchEndpoint, params);
    return (data?.news || []).map(this.normalizeArticle);
  }

  /**
   * Searches for articles using a keyword.
   * @param {string} keyword - The keyword to search for.
   * @param {string} category - An optional category.
   * @param {string} location - An optional location.
   * @param {number} limit - The number of articles to return.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of normalized articles.
   */
  async searchArticles(keyword, category = null, location = null, limit = 20) {
    const params = {
      
      'text': keyword,
      'source-countries': location,
      'number': limit,
    };

    if (category) {
      params.category = this.mapCategory(category);
    }
    
    const data = await this.fetch(this.searchEndpoint, params);
    return (data?.news || []).map(this.normalizeArticle);
  }

  /**
   * Fetches top headlines from the World News API.
   * @param {string} category - An optional category.
   * @param {string} location - An optional location.
   * @param {number} limit - The number of articles to return.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of normalized articles.
   */
  async getTopHeadlines(category = null, location = null, limit = 20) {
    const params = {
      
      'source-countries': location,
      'number': limit,
    };
    
    const data = await this.fetch(this.topNewsEndpoint, params);
    // The top-news endpoint has a different structure
    return (data?.top_news?.[0]?.news || []).map(this.normalizeArticle);
  }
}

export default WorldNewsApiService; 