import config from '../config/config.js';
import createLogger from '../utils/logger.js';

const logger = createLogger('EnhancedCacheManager');

/**
 * Enhanced Cache Manager for AI-processed news articles
 * Provides efficient in-memory caching with improved performance
 */
class EnhancedCacheManager {
  constructor(options = {}) {
    // In-memory cache
    this.memoryCache = new Map();
    this.ttl = options.ttl || config.cache.memory.ttl || 15 * 60 * 1000; // Default 15 minutes
    this.maxSize = options.maxSize || config.cache.memory.maxSize || 1000; // Maximum number of items in cache
    
    // Set up periodic cleanup for memory cache
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
    
    // Cache by content type
    this.contentTypeTTL = config.cache.ttlByType || {
      summary: 24 * 60 * 60 * 1000, // 24 hours for summaries
      category: 24 * 60 * 60 * 1000, // 24 hours for categories
      sentiment: 24 * 60 * 60 * 1000, // 24 hours for sentiment analysis
      entities: 24 * 60 * 60 * 1000, // 24 hours for entity extraction
      relevance: 12 * 60 * 60 * 1000, // 12 hours for relevance scores
      articles: 30 * 60 * 1000, // 30 minutes for article lists
    };
  }

  /**
   * Get an item from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached item or null if not found/expired
   */
  get(key) {
    if (!this.memoryCache.has(key)) {
      this.stats.misses++;
      return null;
    }
    
    const item = this.memoryCache.get(key);
    
    // Check if item has expired
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update access time
    item.lastAccessed = Date.now();
    this.stats.hits++;
    
    return item.value;
  }

  /**
   * Set an item in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @param {string} contentType - Type of content for TTL determination (optional)
   */
  set(key, value, ttl = null, contentType = null) {
    this.stats.sets++;
    
    // Determine TTL based on content type if provided
    let effectiveTTL = ttl;
    if (!effectiveTTL && contentType && this.contentTypeTTL[contentType]) {
      effectiveTTL = this.contentTypeTTL[contentType];
    }
    if (!effectiveTTL) {
      effectiveTTL = this.ttl;
    }
    
    // Ensure we don't exceed max size
    if (this.memoryCache.size >= this.maxSize && !this.memoryCache.has(key)) {
      this.evictOldest();
    }
    
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + effectiveTTL,
      lastAccessed: Date.now(),
      contentType,
    });
  }

  /**
   * Remove an item from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.memoryCache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.memoryCache.clear();
    this.resetStats();
  }

  /**
   * Get a cached item or compute it if not available
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute value if not cached
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @param {string} contentType - Type of content for TTL determination (optional)
   * @returns {Promise<any>} - Cached or computed value
   */
  async getOrCompute(key, computeFn, ttl = null, contentType = null) {
    const cachedValue = this.get(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    const computedValue = await computeFn();
    this.set(key, computedValue, ttl, contentType);
    
    return computedValue;
  }

  /**
   * Remove expired items from the cache
   */
  cleanup() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger(`Cleaned up ${expiredCount} expired cache items. Current cache size: ${this.memoryCache.size}`);
    }
  }

  /**
   * Evict the least recently accessed item from the cache
   */
  evictOldest() {
    let oldestKey = null;
    let oldestAccess = Infinity;
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.lastAccessed < oldestAccess) {
        oldestAccess = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      logger(`Evicted oldest cache item: ${oldestKey}`);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;
    
    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      memorySize: this.memoryCache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
  }

  /**
   * Get all keys in the cache
   * @returns {Array<string>} - Array of cache keys
   */
  getKeys() {
    return Array.from(this.memoryCache.keys());
  }

  /**
   * Get cache items by content type
   * @param {string} contentType - Content type to filter by
   * @returns {Array} - Array of cached items of the specified type
   */
  getByContentType(contentType) {
    const result = [];
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.contentType === contentType) {
        result.push({
          key,
          value: item.value,
          expiry: new Date(item.expiry).toISOString(),
        });
      }
    }
    
    return result;
  }

  /**
   * Stop the cleanup interval when no longer needed
   */
  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export default EnhancedCacheManager;