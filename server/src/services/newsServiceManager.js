import config from '../config/config.js';
import log from '../utils/logger.js';
import { deduplicateArticles, createArticleError } from '../utils/articleUtils.js';
import NewsAPIService from './newsApiService.js';
import GNewsAPIService from './gnewsApiService.js';
import GuardianAPIService from './guardianApiService.js';
import NyTimesApiService from './nyTimesApiService.js';
import WorldNewsApiService from './worldNewsApiService.js';
import WeatherstackApiService from './weatherstackApiService.js';

const logger = log('NewsServiceManager');

/**
 * Manager for handling multiple news API services with fallback
 */
class NewsServiceManager {
  constructor() {
    // Initialize all news services
    this.services = {
      newsapi: new NewsAPIService(),
      gnews: new GNewsAPIService(),
      guardian: new GuardianAPIService(),
      nytimes: new NyTimesApiService(),
      worldnewsapi: new WorldNewsApiService(),
      weatherstack: new WeatherstackApiService(),
    };
    
    // Track available services
    this.availableServices = {};
    
    // Default service order for fallback
    this.serviceOrder = ['newsapi', 'gnews', 'guardian', 'nytimes', 'worldnewsapi', 'weatherstack'];
    
    // Check service availability on initialization
    this.checkServicesAvailability();

    this.serviceCheckInterval = 60 * 60 * 1000; // 1 hour
    this.serviceCheckTimeout = null;
    this.init();
  }

  /**
   * Initialize the service manager by checking service availability
   */
  init() {
    clearTimeout(this.serviceCheckTimeout);
    this.checkServicesAvailability();
    // Schedule the next check
    this.serviceCheckTimeout = setTimeout(() => this.init(), this.serviceCheckInterval);
  }

  /**
   * Check which services are available based on API key configuration
   */
  async checkServicesAvailability() {
    logger('Checking service availability...');
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      try {
        const isAvailable = await service.isAvailable();
        this.availableServices[serviceName] = isAvailable;
        logger(`${serviceName} availability: ${isAvailable}`);
      } catch (error) {
        logger(`Error checking ${serviceName} availability: ${error.message}`);
        this.availableServices[serviceName] = true; // Default to true to allow fallback
      }
    }
  }

  /**
   * Get list of available services in preferred order
   * @param {Array} preferredOrder - Optional preferred service order
   * @returns {Array} - List of available service names
   */
  getAvailableServices(preferredOrder = null) {
    const order = preferredOrder || this.serviceOrder;
    const available = order.filter(serviceName => this.availableServices[serviceName]);
    
    // If no services are marked as available, return all services for fallback
    if (available.length === 0) {
      return order;
    }
    
    return available;
  }

  /**
   * Get articles by category with fallback between services
   * @param {string} category - Category name
   * @param {string} location - Location code
   * @param {number} limit - Maximum number of articles to return
   * @param {number} offset - Offset for pagination
   * @param {Array} sources - Optional list of preferred sources
   * @returns {Promise<Object>} - Object with articles and errors
   */
  async getArticlesByCategory(category, location = null, limit = 20, offset = 0, sources = null) {
    const availableServices = this.getAvailableServices(sources);
    const articles = [];
    const errors = [];
    
    logger(`Fetching articles for category: ${category}, location: ${location}, limit: ${limit}, offset: ${offset}`);
    logger(`Trying services in order: ${availableServices.join(', ')}`);
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        logger(`Trying ${serviceName} for articles in category ${category}...`);
        
        const serviceArticles = await service.getArticlesByCategory(category, location, limit, offset);
        
        if (serviceArticles && serviceArticles.length > 0) {
          logger(`Retrieved ${serviceArticles.length} articles from ${serviceName}`);
          articles.push(...serviceArticles);
          
          // If we have enough articles, stop trying more services
          if (articles.length >= limit) {
            break;
          }
        } else {
          logger(`No articles found from ${serviceName} for category ${category}`);
        }
      } catch (error) {
        logger(`Error fetching from ${serviceName}: ${error.message}`);
        errors.push(createArticleError(serviceName, error.message, error.code || 'ERROR'));
      }
    }
    
    // Deduplicate articles by URL using centralized utility
    const uniqueArticles = deduplicateArticles(articles);
    logger(`After deduplication: ${uniqueArticles.length} unique articles`);

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
   * @param {number} offset - Offset for pagination
   * @param {Array} sources - Optional list of preferred sources
   * @returns {Promise<Object>} - Object with articles and errors
   */
  async searchArticles(query, category = null, location = null, limit = 20, offset = 0, sources = null) {
    const availableServices = this.getAvailableServices(sources);
    const articles = [];
    const errors = [];
    
    logger(`Searching for articles with query: ${query}, category: ${category}, location: ${location}, limit: ${limit}, offset: ${offset}`);
    logger(`Trying services in order: ${availableServices.join(', ')}`);
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        logger(`Trying ${serviceName} for search query "${query}"...`);
        
        const serviceArticles = await service.searchArticles(query, category, location, limit, offset);
        
        if (serviceArticles && serviceArticles.length > 0) {
          logger(`Retrieved ${serviceArticles.length} articles from ${serviceName}`);
          articles.push(...serviceArticles);
          
          // If we have enough articles, stop trying more services
          if (articles.length >= limit) {
            break;
          }
        } else {
          logger(`No articles found from ${serviceName} for search query "${query}"`);
        }
      } catch (error) {
        logger(`Error searching with ${serviceName}: ${error.message}`);
        errors.push(createArticleError(serviceName, error.message, error.code || 'ERROR'));
      }
    }
    
    // Deduplicate articles by URL using centralized utility
    const uniqueArticles = deduplicateArticles(articles);
    logger(`After deduplication: ${uniqueArticles.length} unique articles`);

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
    
    logger(`Fetching top headlines with category: ${category}, location: ${location}, limit: ${limit}`);
    logger(`Trying services in order: ${availableServices.join(', ')}`);
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        logger(`Trying ${serviceName} for top headlines...`);
        
        const serviceArticles = await service.getTopHeadlines(category, location, limit);
        
        if (serviceArticles && serviceArticles.length > 0) {
          logger(`Retrieved ${serviceArticles.length} articles from ${serviceName}`);
          articles.push(...serviceArticles);
          
          // If we have enough articles, stop trying more services
          if (articles.length >= limit) {
            break;
          }
        } else {
          logger(`No articles found from ${serviceName} for top headlines`);
        }
      } catch (error) {
        logger(`Error fetching top headlines from ${serviceName}: ${error.message}`);
        errors.push(createArticleError(serviceName, error.message, error.code || 'ERROR'));
      }
    }
    
    // Deduplicate articles by URL using centralized utility
    const uniqueArticles = deduplicateArticles(articles);
    logger(`After deduplication: ${uniqueArticles.length} unique articles`);

    // Limit to the requested number
    const limitedArticles = uniqueArticles.slice(0, limit);

    return {
      articles: limitedArticles,
      errors: errors.length > 0 ? errors : null,
    };
  }

  /**
   * Get local news for a specific location with fallback between services
   * @param {string} location - Location to get local news for
   * @param {number} limit - Maximum number of articles to return
   * @param {Array} sources - Optional list of preferred sources
   * @returns {Promise<Object>} - Object with articles and errors
   */
  async getLocalNews(location, limit = 20, sources = null) {
    const availableServices = this.getAvailableServices(sources);
    const articles = [];
    const errors = [];
    
    logger(`Fetching local news for location: ${location}, limit: ${limit}`);
    logger(`Trying services in order: ${availableServices.join(", ")}`);
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        logger(`Trying ${serviceName} for local news in ${location}...`);
        
        // Check if service has getLocalNews method
        if (typeof service.getLocalNews === "function") {
          const serviceArticles = await service.getLocalNews(location, limit);
          
          if (serviceArticles && serviceArticles.length > 0) {
            logger(`Retrieved ${serviceArticles.length} local articles from ${serviceName}`);
            articles.push(...serviceArticles);
            
            // If we have enough articles, stop trying more services
            if (articles.length >= limit) {
              break;
            }
          } else {
            logger(`No local articles found from ${serviceName} for location ${location}`);
          }
        } else {
          logger(`${serviceName} does not support local news`);
        }
      } catch (error) {
        logger(`Error fetching local news from ${serviceName}: ${error.message}`);
        errors.push(createArticleError(serviceName, error.message, error.code || "ERROR"));
      }
    }
    
    // Deduplicate articles by URL using centralized utility
    const uniqueArticles = deduplicateArticles(articles);
    logger(`After deduplication: ${uniqueArticles.length} unique local articles`);

    // Limit to the requested number
    const limitedArticles = uniqueArticles.slice(0, limit);

    return {
      articles: limitedArticles,
      errors: errors.length > 0 ? errors : null,
    };
  }

  /**
   * Get available categories from configuration
   * @returns {Array} - List of available categories
   */
  getCategories() {
    return config.appData.categories || [];
  }

  /**
   * Get available locations from configuration
   * @returns {Array} - List of available locations
   */
  getLocations() {
    return config.appData.locations || [];
  }

  /**
   * Get source information with availability status
   * @returns {Array} - List of sources with availability
   */
  getSources() {
    return Object.entries(this.services).map(([id, service]) => ({
      id,
      name: service.constructor.name.replace('Service', ''),
      available: this.availableServices[id] || false
    }));
  }

  /**
   * Get service status for monitoring
   * @returns {Object} - Service availability status
   */
  getServiceStatus() {
    return { ...this.availableServices };
  }

  // Legacy method for backward compatibility - now uses centralized utility
  deduplicateArticles(articles) {
    return deduplicateArticles(articles);
  }
}

// Create a singleton instance
const newsServiceManager = new NewsServiceManager();

// Wrapper functions for API routes
export const getNews = (options) => newsServiceManager.getArticlesByCategory(
  options.category,
  options.location,
  options.limit,
  options.offset,
  options.sources,
);

export const searchNews = (options) => newsServiceManager.searchArticles(
  options.query,
  options.category,
  options.location,
  options.limit,
  options.offset,
  options.sources,
);

export const getTopHeadlines = (options) => newsServiceManager.getTopHeadlines(
  options.category,
  options.location,
  options.limit,
  options.sources,
);

export async function scrapeArticle(url) {
  // This would need to be implemented or imported from another service
  throw new Error('Article scraping not implemented');
}

export function getPreferencesDefaults() {
  return {
    categories: newsServiceManager.getCategories(),
    locations: newsServiceManager.getLocations(),
    sources: newsServiceManager.getSources(),
  };
}

export default newsServiceManager; 