/**
 * Cache manager for AI-processed news articles
 * Helps reduce redundant processing and improve performance
 */
import log from '../utils/logger.js';

const logger = log('CacheManager');

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 15 * 60 * 1000; // Default 15 minutes
    this.maxSize = options.maxSize || 1000; // Maximum number of items in cache
    this.name = options.name || 'GenericCache';
    
    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get an item from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached item or null if not found/expired
   */
  get(key) {
    const record = this.cache.get(key);
    if (!record) {
      logger(`[${this.name}] CACHE MISS for key: ${key}`);
      return null;
    }

    if (Date.now() > record.expiry) {
      logger(`[${this.name}] CACHE EXPIRED for key: ${key}`);
      this.cache.delete(key);
      return null;
    }

    logger(`[${this.name}] CACHE HIT for key: ${key}`);
    return record.value;
  }

  /**
   * Set an item in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = this.ttl) {
    // Ensure we don't exceed max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    const record = {
      value,
      expiry: Date.now() + ttl,
    };
    this.cache.set(key, record);
    logger(`[${this.name}] CACHE SET for key: ${key}`);
  }

  /**
   * Remove an item from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get a cached item or compute it if not available
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute value if not cached
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @returns {Promise<any>} - Cached or computed value
   */
  async getOrCompute(key, computeFn, ttl = this.ttl) {
    const cachedValue = this.get(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    const computedValue = await computeFn();
    this.set(key, computedValue, ttl);
    
    return computedValue;
  }

  /**
   * Remove expired items from the cache
   */
  cleanup() {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict the least recently accessed item from the cache
   */
  evictOldest() {
    let oldestKey = null;
    let oldestAccess = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestAccess) {
        oldestAccess = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
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

  withName(name) {
    this.name = name;
    return this;
  }
}

export default CacheManager;