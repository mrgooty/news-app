import BaseNewsService from './baseNewsService.js';

/**
 * Service class for interacting with the New York Times API.
 */
class NyTimesApiService extends BaseNewsService {
  constructor(config) {
    super(config);
    this.endpoint = 'svc/search/v2/articlesearch.json';
  }

  /**
   * Normalizes an article from the NYT API into a standard format.
   * @param {object} article - The article object from the NYT API.
   * @returns {object} A normalized article object.
   */
  normalizeArticle(article) {
    const imageUrl = article.multimedia?.find(m => m.subtype === 'xlarge')?.url;
    return {
      id: article._id,
      title: article.headline.main,
      description: article.abstract,
      content: article.lead_paragraph,
      url: article.web_url,
      imageUrl: imageUrl ? `https://www.nytimes.com/${imageUrl}` : null,
      source: 'New York Times',
      publishedAt: article.pub_date,
      category: article.section_name?.toLowerCase() || 'general',
    };
  }

  /**
   * Fetches articles by category.
   * The NYT API uses a 'filter query' (`fq`) for sections, which is equivalent to categories.
   * @param {string} category - The category to fetch.
   * @param {string} location - The location (not directly supported by NYT in the same way, but can be used in search).
   * @param {number} limit - The number of articles to fetch.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of normalized articles.
   */
  async getArticlesByCategory(category, location = null, limit = 20) {
    const params = {
      sort: 'newest',
      page: 0,
      'api-key': this.apiKey,
    };

    const fqParts = [`news_desk:("${this.getCategoryMapping(category)}")`];
    if (location) {
      fqParts.push(`glocations:("${location}")`);
    }
    params.fq = fqParts.join(' AND ');

    const data = await this.fetch(this.endpoint, params);
    return (data?.response?.docs || []).map(this.normalizeArticle);
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
      q: keyword,
      sort: 'relevance',
      page: 0,
      'api-key': this.apiKey,
    };

    const fqParts = [];
    if (category) {
      fqParts.push(`news_desk:("${this.getCategoryMapping(category)}")`);
    }
    if (location) {
      fqParts.push(`glocations:("${location}")`);
    }
    if (fqParts.length > 0) {
      params.fq = fqParts.join(' AND ');
    }
    
    const data = await this.fetch(this.endpoint, params);
    return (data?.response?.docs || []).map(this.normalizeArticle);
  }

  /**
   * Fetches top headlines. NYT API doesn't have a direct "top-headlines" endpoint like others.
   * We will simulate this by fetching the latest articles from the "home" section.
   * @param {string} category - An optional category.
   * @param {string} location - An optional location.
   * @param {number} limit - The number of articles to return.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of normalized articles.
   */
  async getTopHeadlines(category = null, location = null, limit = 20) {
    // NYT's 'Top Stories' endpoint is different. We'll use search for consistency.
    // Fetching latest general news as a stand-in for top headlines.
    return this.getArticlesByCategory(category || 'general', location, limit);
  }
}

export default NyTimesApiService; 