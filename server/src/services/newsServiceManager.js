const NewsApiService = require('./newsApiService');
const GNewsApiService = require('./gnewsApiService');
const GuardianApiService = require('./guardianApiService');
const config = require('../config/config');

/**
 * Manager for handling multiple news API services with fallback
 */
class NewsServiceManager {
  constructor() {
    // Initialize all news services
    this.services = {
      newsapi: new NewsApiService(),
      gnews: new GNewsApiService(),
      guardian: new GuardianApiService(),
    };
    
    // Track available services
    this.availableServices = {};
    
    // Default service order for fallback
    this.serviceOrder = ['newsapi', 'gnews', 'guardian'];
    
    // Initialize service availability
    this.checkServicesAvailability();
  }

  /**
   * Check which services are available (have valid API keys)
   */
  async checkServicesAvailability() {
    const availabilityChecks = Object.entries(this.services).map(async ([name, service]) => {
      try {
        const isAvailable = await service.isAvailable();
        this.availableServices[name] = isAvailable;
        console.log(`[NewsServiceManager] ${name} availability: ${isAvailable}`);
        return { name, isAvailable };
      } catch (error) {
        console.error(`[NewsServiceManager] Error checking ${name} availability:`, error.message);
        this.availableServices[name] = false;
        return { name, isAvailable: false };
      }
    });
    
    await Promise.all(availabilityChecks);
  }

  /**
   * Get a list of available services
   * @param {Array} preferredServices - Optional list of preferred service names
   * @returns {Array} - List of available service names in order of preference
   */
  getAvailableServices(preferredServices = null) {
    const serviceOrder = preferredServices || this.serviceOrder;
    return serviceOrder.filter(name => this.availableServices[name]);
  }

  /**
   * Get articles by category with fallback between services
   * @param {string} category - Category name
   * @param {string} location - Location code
   * @param {number} limit - Maximum number of articles to return
   * @param {Array} sources - Optional list of preferred sources
   * @returns {Promise<Object>} - Object with articles and errors
   */
  async getArticlesByCategory(category, location = null, limit = 10, sources = null) {
    const availableServices = this.getAvailableServices(sources);
    const articles = [];
    const errors = [];
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        const serviceArticles = await service.getArticlesByCategory(category, location, limit);
        
        if (serviceArticles && serviceArticles.length > 0) {
          articles.push(...serviceArticles);
          
          // If we have enough articles, stop trying more services
          if (articles.length >= limit) {
            break;
          }
        }
      } catch (error) {
        errors.push({
          source: serviceName,
          message: error.message,
          code: error.code || 'ERROR',
        });
      }
    }
    
    // Deduplicate articles by URL
    const uniqueArticles = this.deduplicateArticles(articles);
    
    // Limit to the requested number
    const limitedArticles = uniqueArticles.slice(0, limit);
    
    return {
      articles: limitedArticles,
      errors: errors.length > 0 ? errors : null,
    };
  }

  /**
   * Search for articles with fallback between services
   * @param {string} query - Search query
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @param {Array} sources - Optional list of preferred sources
   * @returns {Promise<Object>} - Object with articles and errors
   */
  async searchArticles(query, category = null, location = null, limit = 10, sources = null) {
    const availableServices = this.getAvailableServices(sources);
    const articles = [];
    const errors = [];
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        const serviceArticles = await service.searchArticles(query, category, location, limit);
        
        if (serviceArticles && serviceArticles.length > 0) {
          articles.push(...serviceArticles);
          
          // If we have enough articles, stop trying more services
          if (articles.length >= limit) {
            break;
          }
        }
      } catch (error) {
        errors.push({
          source: serviceName,
          message: error.message,
          code: error.code || 'ERROR',
        });
      }
    }
    
    // Deduplicate articles by URL
    const uniqueArticles = this.deduplicateArticles(articles);
    
    // Limit to the requested number
    const limitedArticles = uniqueArticles.slice(0, limit);
    
    return {
      articles: limitedArticles,
      errors: errors.length > 0 ? errors : null,
    };
  }

  /**
   * Get top headlines with fallback between services
   * @param {string} category - Optional category filter
   * @param {string} location - Optional location filter
   * @param {number} limit - Maximum number of articles to return
   * @param {Array} sources - Optional list of preferred sources
   * @returns {Promise<Object>} - Object with articles and errors
   */
  async getTopHeadlines(category = null, location = null, limit = 10, sources = null) {
    const availableServices = this.getAvailableServices(sources);
    const articles = [];
    const errors = [];
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        const serviceArticles = await service.getTopHeadlines(category, location, limit);
        
        if (serviceArticles && serviceArticles.length > 0) {
          articles.push(...serviceArticles);
          
          // If we have enough articles, stop trying more services
          if (articles.length >= limit) {
            break;
          }
        }
      } catch (error) {
        errors.push({
          source: serviceName,
          message: error.message,
          code: error.code || 'ERROR',
        });
      }
    }
    
    // Deduplicate articles by URL
    const uniqueArticles = this.deduplicateArticles(articles);
    
    // Limit to the requested number
    const limitedArticles = uniqueArticles.slice(0, limit);
    
    return {
      articles: limitedArticles,
      errors: errors.length > 0 ? errors : null,
    };
  }

  /**
   * Get available categories across all services
   * @returns {Array} - List of category objects
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
      { id: 'technology', name: 'Technology', description: 'Technology news' },
      { id: 'world', name: 'World', description: 'World news' },
      { id: 'politics', name: 'Politics', description: 'Political news' },
    ];
  }

  /**
   * Get available locations
   * @returns {Array} - List of location objects
   */
  getLocations() {
    return [
      { id: 'us', name: 'United States', code: 'us' },
      { id: 'gb', name: 'United Kingdom', code: 'gb' },
      { id: 'ca', name: 'Canada', code: 'ca' },
      { id: 'au', name: 'Australia', code: 'au' },
      { id: 'in', name: 'India', code: 'in' },
    ];
  }

  /**
   * Get available news sources
   * @returns {Array} - List of source objects
   */
  getSources() {
    return [
      { id: 'newsapi', name: 'NewsAPI.org', description: 'Comprehensive news API' },
      { id: 'gnews', name: 'GNews', description: 'Global news API' },
      { id: 'guardian', name: 'The Guardian', description: 'The Guardian news API' },
    ].filter(source => this.availableServices[source.id]);
  }

  /**
   * Deduplicate articles by URL
   * @param {Array} articles - List of articles
   * @returns {Array} - Deduplicated list of articles
   */
  deduplicateArticles(articles) {
    const uniqueUrls = new Set();
    return articles.filter(article => {
      if (!article.url || uniqueUrls.has(article.url)) {
        return false;
      }
      uniqueUrls.add(article.url);
      return true;
    });
  }
}

module.exports = NewsServiceManager;