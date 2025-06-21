import axios from 'axios';
import crypto from 'crypto';
import config from '../config/config.js';
import log from '../utils/logger.js';
import newsServiceManager from './newsServiceManager.js';

const logger = log('NewsApiAggregator');

// --- Simple In-Memory Cache ---
const { cache: cacheConfig } = config;
const articleCache = new Map();

const getCacheKey = (type, value) => `${type}:${value}`;

const getFromCache = (key) => {
  const cached = articleCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    logger(`Cache HIT for key: ${key}`);
    return cached.data;
  }
  if (cached) {
    logger(`Cache EXPIRED for key: ${key}`);
    articleCache.delete(key);
  } else {
    logger(`Cache MISS for key: ${key}`);
  }
  return null;
};

const setInCache = (key, data) => {
  if (articleCache.size >= cacheConfig.maxSize) {
    // Evict the oldest item
    const oldestKey = articleCache.keys().next().value;
    articleCache.delete(oldestKey);
    logger(`Cache full. Evicted oldest key: ${oldestKey}`);
  }
  const cacheItem = {
    data,
    expiresAt: Date.now() + cacheConfig.ttl,
  };
  articleCache.set(key, cacheItem);
  logger(`Cached data for key: ${key}`);
};

// --- Helper Functions ---

const generateArticleId = (sourceName, url, title) => {
  return crypto.createHash('sha256').update(sourceName + (url || '') + (title || '')).digest('hex');
};

const normalize = {
  newsapi: (article, category) => ({
    id: generateArticleId('newsapi', article.url, article.title),
    title: article.title || 'No title available',
    description: article.description || '',
    content: article.content || '',
    url: article.url,
    imageUrl: article.urlToImage || null,
    source: article.source?.name || 'NewsAPI',
    publishedAt: article.publishedAt,
    category: category || 'general',
  }),
  gnews: (article, category) => ({
    id: generateArticleId('gnews', article.url, article.title),
    title: article.title,
    description: article.description,
    content: article.content,
    url: article.url,
    imageUrl: article.image,
    source: article.source.name,
    publishedAt: article.publishedAt,
    category: category || 'general',
  }),
  guardian: (article) => ({
    id: generateArticleId('guardian', article.id, article.webTitle),
    title: article.webTitle,
    description: article.fields?.trailText || '',
    content: article.fields?.bodyText || '',
    url: article.webUrl,
    imageUrl: article.fields?.thumbnail || null,
    source: 'The Guardian',
    publishedAt: article.webPublicationDate,
    category: article.sectionName,
  }),
  nytimes: (article) => ({
    id: generateArticleId('nytimes', article.uri, article.title),
    title: article.title,
    description: article.abstract || '',
    content: article.lead_paragraph || '',
    url: article.web_url,
    imageUrl: article.multimedia?.find(m => m.format === 'Super Jumbo')?.url ? `https://www.nytimes.com/${article.multimedia.find(m => m.format === 'Super Jumbo').url}` : null,
    source: article.source || 'The New York Times',
    publishedAt: article.pub_date,
    category: article.section_name,
  }),
  worldnewsapi: (article) => ({
     id: generateArticleId('worldnewsapi', article.id, article.title),
     title: article.title,
     description: article.text,
     content: article.text,
     url: article.url,
     imageUrl: article.image,
     source: article.source_country || 'World News API',
     publishedAt: article.publish_date,
     category: article.category,
  }),
};

const deduplicateArticles = (articles) => {
    const uniqueArticles = new Map();
    articles.forEach(article => {
        if (article && article.url && !uniqueArticles.has(article.url)) {
            uniqueArticles.set(article.url, article);
        }
    });
    return Array.from(uniqueArticles.values());
}

// --- API Throttling & Fetching Logic ---
const THROTTLE_DELAY_MS = 250; // 250ms delay between requests

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchNewsFromSource = async (source, endpoint, params, normalizer, category) => {
  const cacheKey = getCacheKey(category || params.q || params.text, source);
  const cachedArticles = getFromCache(cacheKey);
  if (cachedArticles) {
    return cachedArticles;
  }

  try {
    const sourceConfig = config.newsApis[source];
    if (!sourceConfig || !sourceConfig.apiKey) {
      throw new Error(`API key or config for ${source} is missing.`);
    }

    const finalParams = { ...params, [sourceConfig.keyName]: sourceConfig.apiKey };
    
    await sleep(THROTTLE_DELAY_MS);
    
    const response = await axios.get(`${sourceConfig.baseUrl}/${endpoint}`, { params: finalParams });
    const articles = (response.data.articles || response.data.news || response.data.results || response.data.data || response.data.response?.results || []);
    
    if (!Array.isArray(articles)) {
      logger(`WARN: Unexpected response structure from ${source}. Data:`, response.data);
      throw new Error(`Unexpected response structure from ${source}.`);
    }
    
    const normalizedArticles = articles.map(article => normalizer(article, category));
    setInCache(cacheKey, normalizedArticles);
    return normalizedArticles;

  } catch (error) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || errorData?.error?.message || JSON.stringify(errorData);
    
    logger(`ERROR: [${source.toUpperCase()}] Request failed with status ${status}: ${errorMessage}`);
    
    // Log the full response data for debugging if it exists
    if (errorData) {
      logger(`DEBUG: [${source.toUpperCase()}] Full error response:`, errorData);
    }

    // Re-throw a more informative error
    throw error;
  }
};

const callNewsApi = (params) => fetchNewsFromSource('newsapi', 'top-headlines', params, normalize.newsapi, params.category);
const callGNewsApi = (params) => fetchNewsFromSource('gnews', 'search', params, normalize.gnews, params.q);
const callGuardianApi = (params) => fetchNewsFromSource('guardian', 'search', params, normalize.guardian, params.q);
const callWorldNewsApi = (params) => fetchNewsFromSource('worldnewsapi', 'search-news', params, normalize.worldnewsapi, params.text);

/**
 * Fetches news from all configured sources for a given category.
 * Delegates to the NewsServiceManager.
 */
export async function fetchNewsByCategory(category, location, limit, offset) {
  logger(`Aggregating news for category: ${category}`);
  return newsServiceManager.getArticlesByCategory(category, location, limit, offset);
}

/**
 * Fetches news from all configured sources for a given set of categories.
 * Delegates to the NewsServiceManager.
 */
export async function fetchNewsByCategories(categories, location, limit, offset) {
  logger(`Aggregating news for categories: ${categories.join(', ')}`);
  
  const promises = categories.map(category => 
    newsServiceManager.getArticlesByCategory(category, location, limit, offset)
  );

  const results = await Promise.allSettled(promises);

  const allArticles = results
    .filter(res => res.status === 'fulfilled' && res.value?.articles)
    .flatMap(res => res.value.articles);
    
  const allErrors = results
    .filter(res => res.status === 'rejected')
    .map(res => ({ source: 'Aggregator', message: res.reason.message, code: 'FETCH_ERROR' }));

  const uniqueArticles = newsServiceManager.deduplicateArticles(allArticles);

  return { articles: uniqueArticles, errors: allErrors };
}

/**
 * Searches for news from all configured sources by a keyword.
 * Delegates to the NewsServiceManager.
 */
export async function searchNewsByKeyword(keyword, location, limit, offset) {
  logger(`Aggregating search for keyword: ${keyword}`);
  return newsServiceManager.searchArticles(keyword, null, location, limit, offset);
}

export const fetchWeather = async (location) => {
    logger(`Fetching weather for location: ${location}`);
    try {
        const apiKey = config.newsApis.weatherstack.apiKey;
        if (!apiKey) throw new Error('Weatherstack API key missing');

        const params = { access_key: apiKey, query: location };
        const response = await axios.get(config.newsApis.weatherstack.baseUrl + '/current', { params });
        return response.data;
    } catch (error) {
        logger(`Failed to fetch weather: ${error.message}`);
        return { error: error.message };
    }
};