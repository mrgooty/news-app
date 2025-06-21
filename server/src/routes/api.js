import express from 'express';
import axios from 'axios';
import { fetchNewsByCategory, searchNewsByKeyword } from '../services/newsApiAggregator.js';
import config from '../config/config.js';
import articleAnalyzerService from '../ai/articleAnalyzerService.js';
import createLogger from '../utils/logger.js';
import { getEnhancedNews } from '../ai/improvedNewsOrchestrator.js';
import {
  getNews,
  searchNews,
  getTopHeadlines,
  scrapeArticle,
  getPreferencesDefaults,
} from '../services/newsServiceManager.js';
import { aiParameterService } from '../services/aiParameterService.js';
import ComprehensiveArticleAnalysisService from '../services/comprehensiveArticleAnalysisService.js';

const router = express.Router();
const logger = createLogger('APIRoutes');
const comprehensiveAnalysisService = new ComprehensiveArticleAnalysisService();

// Route to get the list of available categories
router.get('/categories', (req, res) => {
  try {
    const categories = config.appData.categories;
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Route to get the list of available locations
router.get('/locations', (req, res) => {
  try {
    const locations = config.appData.locations;
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching locations', error: error.message });
  }
});

// Route to get aggregated news by category
router.get('/news/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { location } = req.query;
    const articles = await fetchNewsByCategory(category, location);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching news by category', error: error.message });
  }
});

// Route to search for aggregated news by keyword
router.get('/news/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { location } = req.query;
    const articles = await searchNewsByKeyword(keyword, location);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error searching news', error: error.message });
  }
});

router.post('/analyze', async (req, res) => {
  const { url } = req.body;
  
  try {
    const analysis = await articleAnalyzerService.analyzeArticle({ url });
    res.json(analysis);
  } catch (error) {
    logger('Error in /api/analyze route:', error.message);

    // Provide specific client-facing errors
    if (error.message.includes('Invalid URL')) {
      return res.status(400).json({ error: 'Invalid URL provided. Please provide a valid, absolute URL.' });
    }
    
    // Generic error for all other cases
    res.status(500).json({ error: 'Failed to analyze article due to an internal server error.' });
  }
});

router.get('/preferences/defaults', async (req, res, next) => {
  try {
    const defaults = await getPreferencesDefaults();
    res.json(defaults);
  } catch (error) {
    next(error);
  }
});

// AI Parameter Management Endpoints
router.get('/ai-parameters', (req, res) => {
  try {
    const params = aiParameterService.get();
    res.json(params);
  } catch (error) {
    console.error('Failed to retrieve AI parameters:', error);
    res.status(500).json({ message: 'Failed to retrieve AI parameters' });
  }
});

router.put('/ai-parameters', (req, res) => {
  try {
    const newParams = req.body;
    if (!newParams || Object.keys(newParams).length === 0) {
      return res.status(400).json({ message: 'Request body cannot be empty.' });
    }
    const updatedParams = aiParameterService.update(newParams);
    res.json(updatedParams);
  } catch (error) {
    console.error('Failed to update AI parameters:', error);
    res.status(500).json({ message: 'Failed to update AI parameters' });
  }
});

// Comprehensive Sentiment Analysis Endpoint
router.post('/analyze-sentiment', async (req, res) => {
  const { url, articleText, articleMetadata, options } = req.body;
  
  try {
    let analysis;
    
    if (url) {
      // Analyze article from URL
      analysis = await comprehensiveAnalysisService.analyzeArticleFromUrl(url, options || {});
    } else if (articleText) {
      // Analyze provided article text
      analysis = await comprehensiveAnalysisService.analyzeArticleText(articleText, articleMetadata || {}, options || {});
    } else {
      return res.status(400).json({ 
        error: 'Either URL or articleText must be provided' 
      });
    }
    
    res.json(analysis);
  } catch (error) {
    logger('Error in /api/analyze-sentiment route:', error.message);
    
    // Provide specific client-facing errors
    if (error.message.includes('Failed to extract article content')) {
      return res.status(400).json({ 
        error: 'Unable to extract content from the provided URL. Please ensure the URL is valid and accessible.' 
      });
    }
    
    if (error.message.includes('Invalid URL')) {
      return res.status(400).json({ 
        error: 'Invalid URL provided. Please provide a valid, absolute URL.' 
      });
    }
    
    // Generic error for all other cases
    res.status(500).json({ 
      error: 'Failed to perform sentiment analysis due to an internal server error.' 
    });
  }
});

// Batch Sentiment Analysis Endpoint
router.post('/analyze-sentiment-batch', async (req, res) => {
  const { urls, options } = req.body;
  
  try {
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ 
        error: 'URLs array must be provided and cannot be empty' 
      });
    }
    
    if (urls.length > 10) {
      return res.status(400).json({ 
        error: 'Maximum 10 URLs allowed per batch request' 
      });
    }
    
    const batchResults = await comprehensiveAnalysisService.analyzeMultipleArticles(urls, options || {});
    
    // Add statistics to the response
    const statistics = comprehensiveAnalysisService.getAnalysisStatistics(batchResults.successful);
    
    res.json({
      ...batchResults,
      statistics
    });
  } catch (error) {
    logger('Error in /api/analyze-sentiment-batch route:', error.message);
    res.status(500).json({ 
      error: 'Failed to perform batch sentiment analysis due to an internal server error.' 
    });
  }
});

// Party Identification Endpoint (for testing/debugging)
router.post('/identify-parties', async (req, res) => {
  const { articleText } = req.body;
  
  try {
    if (!articleText) {
      return res.status(400).json({ 
        error: 'articleText must be provided' 
      });
    }
    
    const { PartyIdentificationService } = await import('../ai/index.js');
    const partyIdentificationService = new PartyIdentificationService();
    
    const identifiedEntities = await partyIdentificationService.identifyParties(articleText);
    const validation = partyIdentificationService.validateEntities(identifiedEntities);
    
    res.json({
      identifiedEntities,
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger('Error in /api/identify-parties route:', error.message);
    res.status(500).json({ 
      error: 'Failed to identify parties due to an internal server error.' 
    });
  }
});

export default router;