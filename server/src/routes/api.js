const express = require('express');
const axios = require('axios');
const router = express.Router();
const { fetchNewsByCategory, searchNewsByKeyword } = require('../services/newsApiAggregator');
const config =require('../config/config');
const articleAnalyzerService = require('../ai/articleAnalyzerService');
const logger = require('../utils/logger')('ApiRoutes');
const { getEnhancedNews } = require('../ai/improvedNewsOrchestrator');

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

module.exports = router;