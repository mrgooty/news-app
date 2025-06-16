const NewsAggregator = require('./newsAggregator');
const NewsProcessor = require('./newsProcessor');
const NewsOrchestrator = require('./newsOrchestrator');
const TextUtils = require('./textUtils');
const CacheManager = require('./cacheManager');

/**
 * AI module exports for news orchestration
 */
module.exports = {
  NewsAggregator,
  NewsProcessor,
  NewsOrchestrator,
  TextUtils,
  CacheManager,
  
  // Factory function to create a new NewsAggregator instance
  createNewsAggregator: () => new NewsAggregator(),
};