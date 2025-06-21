// server/src/ai/sentimentIndex.js

import PartyIdentificationService from './partyIdentificationService.js';
import EnhancedSentimentAnalysisService from './enhancedSentimentAnalysisService.js';

/**
 * Sentiment Analysis module exports
 */
export {
  PartyIdentificationService,
  EnhancedSentimentAnalysisService,
};

// Factory functions
export const createPartyIdentificationService = () => new PartyIdentificationService();
export const createEnhancedSentimentAnalysisService = () => new EnhancedSentimentAnalysisService(); 