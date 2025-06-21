import NewsAggregator from './newsAggregator.js';
import NewsProcessor from './newsProcessor.js';
import NewsOrchestrator from './newsOrchestrator.js';
import TextUtils from './textUtils.js';
import CacheManager from './cacheManager.js';
import ImprovedNewsProcessor from './improvedNewsProcessor.js';
import ImprovedNewsOrchestrator from './improvedNewsOrchestrator.js';
import ImprovedNewsAggregator from './improvedNewsAggregator.js';
import EnhancedCacheManager from './enhancedCacheManager.js';
import BertAnalyzer from './bertAnalyzer.js';
import PartyIdentificationService from './partyIdentificationService.js';
import EnhancedSentimentAnalysisService from './enhancedSentimentAnalysisService.js';

/**
 * AI module exports for news orchestration and sentiment analysis
 */
export {
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
  
  // Sentiment Analysis Services
  PartyIdentificationService,
  EnhancedSentimentAnalysisService,
};

// Factory functions
export const createNewsAggregator = () => new NewsAggregator();
export const createImprovedNewsAggregator = () => new ImprovedNewsAggregator();
export const createPartyIdentificationService = () => new PartyIdentificationService();
export const createEnhancedSentimentAnalysisService = () => new EnhancedSentimentAnalysisService();