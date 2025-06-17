const NewsApiService = require('./newsApiService');
const GNewsApiService = require('./gnewsApiService');
const GuardianApiService = require('./guardianApiService');
const createLogger = require("../utils/logger");
const log = createLogger("NewsServiceManager");
const config = require('../config/config');
const { CATEGORIES, LOCATIONS } = require('../constants');
const sampleArticles = require('../data/sampleArticles');

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
    
    // Initialize service availability unless running tests
    if (process.env.NODE_ENV !== 'test') {
      this.checkServicesAvailability();
    }
  }

  /**
   * Check which services are available (have valid API keys)
   */
  async checkServicesAvailability() {
    log("Checking API service availability...");
    
    for (const [name, service] of Object.entries(this.services)) {
      const apiKey = config.newsApis[name]?.apiKey;

      if (!apiKey) {
        this.availableServices[name] = false;
        log(`${name} API key is missing. Service will be unavailable.`);
        continue;
      }

      // Check if the API key looks like a placeholder
      if (apiKey.includes('your_') || apiKey.includes('test_')) {
        log(`Warning: ${name} API key appears to be a placeholder. Service may not work correctly.`);
      }

      // Assume the service is available if an API key exists
      this.availableServices[name] = true;

      try {
        const isAvailable = await service.isAvailable();
        this.availableServices[name] = isAvailable;
        
        if (isAvailable) {
          log(`${name} API is available and responding correctly.`);
        } else {
          log(`${name} API is not available. Check your API key and network connection.`);
        }
      } catch (error) {
        // Network checks might fail in restricted environments
        // so log the error but keep the service enabled
        log(
          `Could not verify ${name} availability: ${error.message}`
        );
        
        // If the error suggests an invalid API key, mark as unavailable
        if (error.message.includes('401') || 
            error.message.includes('403') || 
            error.message.includes('invalid') || 
            error.message.includes('API key')) {
          this.availableServices[name] = false;
          log(`${name} API key appears to be invalid. Service will be unavailable.`);
        }
      }
    }
    
    // Log overall availability
    const availableCount = Object.values(this.availableServices).filter(Boolean).length;
    log(`${availableCount} out of ${Object.keys(this.services).length} news services are available.`);
    
    if (availableCount === 0) {
      log("WARNING: No news services are available. The application will use sample data.");
    }
  }

  /**
   * Get a list of available services
   * @param {Array} preferredServices - Optional list of preferred service names
   * @returns {Array} - List of available service names in order of preference
   */
  getAvailableServices(preferredServices = null) {
    const serviceOrder = preferredServices || this.serviceOrder;

    const available = serviceOrder.filter(name => this.availableServices[name]);

    // If no services were marked available, try them all in order
    return available.length > 0 ? available : serviceOrder;
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
    
    log(`Fetching articles for category: ${category}, location: ${location}, limit: ${limit}`);
    log(`Trying services in order: ${availableServices.join(', ')}`);
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        log(`Trying ${serviceName} for articles in category ${category}...`);
        
        const serviceArticles = await service.getArticlesByCategory(category, location, limit);
        
        if (serviceArticles && serviceArticles.length > 0) {
          log(`Retrieved ${serviceArticles.length} articles from ${serviceName}`);
          articles.push(...serviceArticles);
          
          // If we have enough articles, stop trying more services
          if (articles.length >= limit) {
            break;
          }
        } else {
          log(`No articles found from ${serviceName} for category ${category}`);
        }
      } catch (error) {
        log(`Error fetching from ${serviceName}: ${error.message}`);
        errors.push({
          source: serviceName,
          message: error.message,
          code: error.code || 'ERROR',
        });
      }
    }
    
    // Deduplicate articles by URL
    const uniqueArticles = this.deduplicateArticles(articles);
    log(`After deduplication: ${uniqueArticles.length} unique articles`);

    // Limit to the requested number
    let limitedArticles = uniqueArticles.slice(0, limit);

    if (limitedArticles.length === 0) {
      // Fallback to local sample data when no articles are retrieved
      log(`No articles retrieved from any service. Using sample data.`);
      limitedArticles = sampleArticles
        .filter(article => !category || article.category === category)
        .slice(0, limit);
    }

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
    
    log(`Searching for articles with query: ${query}, category: ${category}, location: ${location}, limit: ${limit}`);
    log(`Trying services in order: ${availableServices.join(', ')}`);
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        log(`Trying ${serviceName} for search query "${query}"...`);
        
        const serviceArticles = await service.searchArticles(query, category, location, limit);
        
        if (serviceArticles && serviceArticles.length > 0) {
          log(`Retrieved ${serviceArticles.length} articles from ${serviceName}`);
          articles.push(...serviceArticles);
          
          // If we have enough articles, stop trying more services
          if (articles.length >= limit) {
            break;
          }
        } else {
          log(`No articles found from ${serviceName} for search query "${query}"`);
        }
      } catch (error) {
        log(`Error searching with ${serviceName}: ${error.message}`);
        errors.push({
          source: serviceName,
          message: error.message,
          code: error.code || 'ERROR',
        });
      }
    }
    
    // Deduplicate articles by URL
    const uniqueArticles = this.deduplicateArticles(articles);
    log(`After deduplication: ${uniqueArticles.length} unique articles`);

    // Limit to the requested number
    let limitedArticles = uniqueArticles.slice(0, limit);

    if (limitedArticles.length === 0) {
      // Fallback to local sample data when no articles are retrieved
      log(`No articles retrieved from any service. Using sample data.`);
      limitedArticles = sampleArticles
        .filter(article => {
          // Simple text search in title and description
          const searchText = `${article.title} ${article.description}`.toLowerCase();
          const queryMatch = searchText.includes(query.toLowerCase());
          const categoryMatch = !category || article.category === category;
          return queryMatch && categoryMatch;
        })
        .slice(0, limit);
    }

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
    
    log(`Fetching top headlines with category: ${category}, location: ${location}, limit: ${limit}`);
    log(`Trying services in order: ${availableServices.join(', ')}`);
    
    // Try each service in order until we get results or run out of services
    for (const serviceName of availableServices) {
      try {
        const service = this.services[serviceName];
        log(`Trying ${serviceName} for top headlines...`);
        
        const serviceArticles = await service.getTopHeadlines(category, location, limit);
        
        if (serviceArticles && serviceArticles.length > 0) {
          log(`Retrieved ${serviceArticles.length} articles from ${serviceName}`);
          articles.push(...serviceArticles);
          
          // If we have enough articles, stop trying more services
          if (articles.length >= limit) {
            break;
          }
        } else {
          log(`No articles found from ${serviceName} for top headlines`);
        }
      } catch (error) {
        log(`Error fetching top headlines from ${serviceName}: ${error.message}`);
        errors.push({
          source: serviceName,
          message: error.message,
          code: error.code || 'ERROR',
        });
      }
    }
    
    // Deduplicate articles by URL
    const uniqueArticles = this.deduplicateArticles(articles);
    log(`After deduplication: ${uniqueArticles.length} unique articles`);

    // Limit to the requested number
    let limitedArticles = uniqueArticles.slice(0, limit);

    if (limitedArticles.length === 0) {
      // Fallback to local sample data when no articles are retrieved
      log(`No articles retrieved from any service. Using sample data.`);
      limitedArticles = sampleArticles
        .filter(article => !category || article.category === category)
        .slice(0, limit);
    }

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
    return CATEGORIES;
  }

  /**
   * Get available locations
   * @returns {Array} - List of location objects
   */
  getLocations() {
    return LOCATIONS;
  }

  /**
   * Get available news sources
   * @returns {Array} - List of source objects
   */
  getSources() {
    const allSources = [
      { id: 'newsapi', name: 'NewsAPI.org', description: 'Comprehensive news API' },
      { id: 'gnews', name: 'GNews', description: 'Global news API' },
      { id: 'guardian', name: 'The Guardian', description: 'The Guardian news API' },
    ];
    
    // Filter to only show sources that are available or potentially available
    return allSources.map(source => {
      const isAvailable = this.availableServices[source.id];
      return {
        ...source,
        available: isAvailable,
        description: isAvailable 
          ? source.description 
          : `${source.description} (API key not configured or invalid)`
      };
    });
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
  
  /**
   * Force a refresh of service availability
   * @returns {Promise<Object>} - Object with service availability status
   */
  async refreshServiceAvailability() {
    await this.checkServicesAvailability();
    return this.getServiceStatus();
  }
  
  /**
   * Get the current status of all services
   * @returns {Object} - Object with service availability status
   */
  getServiceStatus() {
    const status = {};
    
    for (const [name, available] of Object.entries(this.availableServices)) {
      const apiKey = config.newsApis[name]?.apiKey;
      status[name] = {
        available,
        hasApiKey: Boolean(apiKey),
        apiKeyIsPlaceholder: apiKey ? (apiKey.includes('your_') || apiKey.includes('test_')) : false,
      };
    }
    
    return status;
  }
}

module.exports = NewsServiceManager;