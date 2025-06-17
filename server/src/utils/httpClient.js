const axios = require('axios');
const createLogger = require("./logger");
const config = require('../config/config');

// Simple in-memory cache
const cache = new Map();

/**
 * HTTP client with caching, rate limiting, and improved error handling
 */
const log = createLogger("HttpClient");

class HttpClient {
  /**
   * Create a new HTTP client for a specific news API
   * @param {string} apiName - The name of the API (must match a key in config.newsApis)
   */
  constructor(apiName) {
    if (!config.newsApis[apiName]) {
      throw new Error(`API configuration not found for: ${apiName}`);
    }

    this.apiName = apiName;
    this.apiConfig = config.newsApis[apiName];
    this.lastRequestTime = 0;
    
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: this.apiConfig.baseUrl,
      timeout: 10000, // 10 seconds timeout
      headers: {
        'User-Agent': 'News Aggregator App/1.0',
      },
    });
  }

  /**
   * Generate a cache key from request parameters
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {string} - Cache key
   */
  getCacheKey(endpoint, params) {
    return `${this.apiName}:${endpoint}:${JSON.stringify(params)}`;
  }

  /**
   * Check if we need to rate limit the request
   * @returns {Promise<void>} - Resolves when it's safe to make the request
   */
  async applyRateLimit() {
    const now = Date.now();
    const minInterval = 1000 / (this.apiConfig.rateLimits?.requestsPerSecond || 1);
    const timeToWait = Math.max(0, minInterval - (now - this.lastRequestTime));
    
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Make a GET request with caching and rate limiting
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async get(endpoint, params = {}, options = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cachedResponse = cache.get(cacheKey);
    
    // Return cached response if available and not expired
    if (cachedResponse && cachedResponse.timestamp > Date.now() - config.cache.ttl) {
      log(`[${this.apiName}] Cache hit for ${endpoint}`);
      return cachedResponse.data;
    }
    
    // Apply rate limiting
    await this.applyRateLimit();
    
    try {
      // Check if API key is available
      if (!this.apiConfig.apiKey) {
        throw new Error(`API key for ${this.apiName} is not configured. Please add it to your .env file.`);
      }
      
      // Prepare request configuration
      const requestConfig = {
        params: { ...params },
        ...options,
      };
      
      // Add API key based on authentication method
      if (this.apiName === 'newsapi' || this.apiName === 'bing') {
        requestConfig.headers = {
          ...requestConfig.headers,
          'X-Api-Key': this.apiConfig.apiKey,
        };
        
        // Special case for Bing News API
        if (this.apiName === 'bing') {
          requestConfig.headers = {
            ...requestConfig.headers,
            'Ocp-Apim-Subscription-Key': this.apiConfig.apiKey,
          };
          delete requestConfig.headers['X-Api-Key'];
        }
      } else if (this.apiName === 'newscatcher') {
        requestConfig.headers = {
          ...requestConfig.headers,
          'x-api-key': this.apiConfig.apiKey,
        };
      } else {
        // For most APIs, add the key as a query parameter
        const apiKeyParam = this.getApiKeyParamName();
        requestConfig.params[apiKeyParam] = this.apiConfig.apiKey;
      }
      
      log(`[${this.apiName}] Making request to ${endpoint}`);
      const response = await this.client.get(endpoint, requestConfig);
      
      // Cache the successful response
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: response.data,
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error, endpoint);
      
      // Enhance error with more context
      const enhancedError = new Error(this.getEnhancedErrorMessage(error, endpoint));
      enhancedError.originalError = error;
      enhancedError.apiName = this.apiName;
      enhancedError.endpoint = endpoint;
      enhancedError.params = params;
      
      throw enhancedError;
    }
  }

  /**
   * Get the appropriate parameter name for the API key
   * @returns {string} - API key parameter name
   */
  getApiKeyParamName() {
    switch (this.apiName) {
      case 'gnews':
        return 'token';
      case 'guardian':
        return 'api-key';
      case 'nytimes':
        return 'api-key';
      case 'mediastack':
        return 'access_key';
      default:
        return 'apiKey';
    }
  }

  /**
   * Create an enhanced error message with more context
   * @param {Error} error - The original error
   * @param {string} endpoint - The API endpoint
   * @returns {string} - Enhanced error message
   */
  getEnhancedErrorMessage(error, endpoint) {
    let message = `[${this.apiName}] Error calling ${endpoint}: `;
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      message += `Status ${error.response.status} - ${error.response.statusText}`;
      
      // Add more context based on status code
      if (error.response.status === 401) {
        message += `. Invalid API key or authentication failure. Please check your ${this.apiName} API key.`;
      } else if (error.response.status === 403) {
        message += `. Access forbidden. Your API key may have exceeded its rate limit or lacks necessary permissions.`;
      } else if (error.response.status === 404) {
        message += `. Endpoint not found. Please check the API documentation for correct endpoints.`;
      } else if (error.response.status === 429) {
        message += `. Rate limit exceeded. Please reduce request frequency or upgrade your API plan.`;
      } else if (error.response.data && typeof error.response.data === 'object') {
        // Try to extract error message from response data
        const errorMsg = error.response.data.message || 
                         error.response.data.error || 
                         JSON.stringify(error.response.data);
        message += `. ${errorMsg}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      message += `No response received. The service may be down or network connectivity issues occurred.`;
    } else {
      // Something happened in setting up the request
      message += error.message;
      
      // Check for common configuration issues
      if (error.message.includes('API key')) {
        message += ` Make sure you've added the ${this.apiName.toUpperCase()}_API_KEY to your .env file.`;
      }
    }
    
    return message;
  }

  /**
   * Handle API request errors
   * @param {Error} error - The error object
   * @param {string} endpoint - The API endpoint that was called
   */
  handleError(error, endpoint) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`[${this.apiName}] API Error (${endpoint}):`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`[${this.apiName}] No response (${endpoint}):`, error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`[${this.apiName}] Request error (${endpoint}):`, error.message);
    }
  }

  /**
   * Clear the cache for this API
   */
  clearCache() {
    for (const key of cache.keys()) {
      if (key.startsWith(`${this.apiName}:`)) {
        cache.delete(key);
      }
    }
  }
  
  /**
   * Retry a failed request with exponential backoff
   * @param {Function} requestFn - The request function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} initialDelay - Initial delay in milliseconds
   * @returns {Promise<any>} - The response data
   */
  async retryWithBackoff(requestFn, maxRetries = 3, initialDelay = 300) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's a client error (4xx)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          break;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        log(`[${this.apiName}] Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

module.exports = HttpClient;