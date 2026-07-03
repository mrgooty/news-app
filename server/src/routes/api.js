import express from 'express';
import config from '../config/config.js';
import fastAnalyzer from '../ai/fastAnalyzer.js';
import createLogger from '../utils/logger.js';
import newsServiceManager, { getPreferencesDefaults } from '../services/newsServiceManager.js';

const router = express.Router();
const logger = createLogger('APIRoutes');

// Route to get the list of available categories
router.get('/categories', (req, res) => {
  try {
    res.json(config.appData.categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Route to get the list of available locations
router.get('/locations', (req, res) => {
  try {
    res.json(config.appData.locations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching locations', error: error.message });
  }
});

// Route to get aggregated news by category
router.get('/news/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { location } = req.query;
    const result = await newsServiceManager.getArticlesByCategory(category, location, 20, 0);
    res.json(result.articles || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching news by category', error: error.message });
  }
});

// Route to search for aggregated news by keyword
router.get('/news/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { location } = req.query;
    const result = await newsServiceManager.searchArticles(keyword, null, location, 20, 0);
    res.json(result.articles || []);
  } catch (error) {
    res.status(500).json({ message: 'Error searching news', error: error.message });
  }
});

// Fast local AI analysis: summary, sentiment, keywords, suggestions
router.post('/analyze', async (req, res) => {
  const { url } = req.body;

  try {
    new URL(url); // throws on invalid/missing URL
  } catch {
    return res.status(400).json({ error: 'Invalid URL provided. Please provide a valid, absolute URL.' });
  }

  try {
    const analysis = await fastAnalyzer.analyze({ url });
    res.json(analysis);
  } catch (error) {
    logger('Error in /api/analyze route:', error.message);

    if (error.message.includes('Invalid URL')) {
      return res.status(400).json({ error: 'Invalid URL provided. Please provide a valid, absolute URL.' });
    }

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

export default router;
