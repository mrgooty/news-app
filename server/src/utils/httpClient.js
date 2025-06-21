import axios from 'axios';
import createLogger from './logger.js';
import config from '../config/config.js';

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
      
      // Prepare request configuration - use the same approach as newsApiAggregator
      const finalParams = { ...params, [this.apiConfig.keyName]: this.apiConfig.apiKey };
      
      const requestConfig = {
        params: finalParams,
        ...options,
      };
      
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
    // Use the keyName from config instead of hardcoded values
    return this.apiConfig.keyName || 'apiKey';
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
    }
    
    return message;
  }

  /**
   * Handle errors with appropriate logging
   * @param {Error} error - The error to handle
   * @param {string} endpoint - The endpoint that was called
   */
  handleError(error, endpoint) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    if (status) {
      log(`[${this.apiName}] HTTP ${status} error calling ${endpoint}: ${error.response.statusText}`);
      
      if (errorData) {
        log(`[${this.apiName}] Error details:`, errorData);
      }
    } else if (error.request) {
      log(`[${this.apiName}] Network error calling ${endpoint}: No response received`);
    } else {
      log(`[${this.apiName}] Request setup error calling ${endpoint}: ${error.message}`);
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

export default HttpClient;