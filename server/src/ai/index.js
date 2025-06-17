const NewsAggregator = require('./newsAggregator');
const NewsProcessor = require('./newsProcessor');
const NewsOrchestrator = require('./newsOrchestrator');
const TextUtils = require('./textUtils');
const CacheManager = require('./cacheManager');
const ImprovedNewsProcessor = require('./improvedNewsProcessor');
const ImprovedNewsOrchestrator = require('./improvedNewsOrchestrator');
const ImprovedNewsAggregator = require('./improvedNewsAggregator');
const EnhancedCacheManager = require('./enhancedCacheManager');
const BertAnalyzer = require('./bertAnalyzer');

/**
 * AI module exports for news orchestration
 */
module.exports = {
  // Original implementations
  NewsAggregator,
  NewsProcessor,
  NewsOrchestrator,
  TextUtils,
  CacheManager,
  
  // Improved implementations
  ImprovedNewsProcessor,
  ImprovedNewsOrchestrator,
  ImprovedNewsAggregator,
  EnhancedCacheManager,
  BertAnalyzer,
  
  // Factory functions
  createNewsAggregator: () => new NewsAggregator(),
  createImprovedNewsAggregator: () => new ImprovedNewsAggregator(),
};