const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');
const log = require('../utils/logger')('NewsApiAggregator');

// --- Simple In-Memory Cache ---
const { cache: cacheConfig } = config;
const articleCache = new Map();

const getCacheKey = (type, value) => `${type}:${value}`;

const getFromCache = (key) => {
  const cached = articleCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    log(`Cache HIT for key: ${key}`);
    return cached.data;
  }
  if (cached) {
    log(`Cache EXPIRED for key: ${key}`);
    articleCache.delete(key);
  } else {
    log(`Cache MISS for key: ${key}`);
  }
  return null;
};

const setInCache = (key, data) => {
  if (articleCache.size >= cacheConfig.maxSize) {
    // Evict the oldest item
    const oldestKey = articleCache.keys().next().value;
    articleCache.delete(oldestKey);
    log(`Cache full. Evicted oldest key: ${oldestKey}`);
  }
  const cacheItem = {
    data,
    expiresAt: Date.now() + cacheConfig.ttl,
  };
  articleCache.set(key, cacheItem);
  log(`Cached data for key: ${key}`);
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
      log(`WARN: Unexpected response structure from ${source}. Data:`, response.data);
      throw new Error(`Unexpected response structure from ${source}.`);
    }
    
    const normalizedArticles = articles.map(article => normalizer(article, category));
    setInCache(cacheKey, normalizedArticles);
    return normalizedArticles;

  } catch (error) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || errorData?.error?.message || JSON.stringify(errorData);
    
    log(`ERROR: [${source.toUpperCase()}] Request failed with status ${status}: ${errorMessage}`);
    
    // Log the full response data for debugging if it exists
    if (errorData) {
      log(`DEBUG: [${source.toUpperCase()}] Full error response:`, errorData);
    }

    // Re-throw a more informative error
    throw error;
  }
};

const fetchNewsByCategory = async (category, location) => {
  log(`Fetching news for category: ${category}` + (location ? ` in ${location}` : ''));
  const { newsapi, gnews, guardian, nytimes } = config.newsApis;
  const { countryMapping } = config;

  // Prepare params with location if available
  const newsapiParams = { category: config.categoryMapping[category]?.newsapi || category, pageSize: 20 };
  if (location && countryMapping[location]?.newsapi) newsapiParams.country = countryMapping[location].newsapi;

  const gnewsParams = { category: config.categoryMapping[category]?.gnews || category, max: 20 };
  if (location && countryMapping[location]?.gnews) gnewsParams.country = countryMapping[location].gnews;
  
  const promises = [
    fetchNewsFromSource('newsapi', 'top-headlines', newsapiParams, normalize.newsapi, category),
    fetchNewsFromSource('gnews', 'top-headlines', gnewsParams, normalize.gnews, category),
    fetchNewsFromSource('guardian', 'search', { section: config.categoryMapping[category]?.guardian || category, 'page-size': 20, 'show-fields': 'trailText,bodyText,thumbnail' }, normalize.guardian, category),
    fetchNewsFromSource('nytimes', `topstories/v2/${config.categoryMapping[category]?.nytimes || 'home'}.json`, {}, normalize.nytimes, category),
  ];

  const results = await Promise.allSettled(promises);

  results.forEach(result => {
    if (result.status === 'rejected') {
      log(`A source failed to fetch: ${result.reason?.message || result.reason}`);
    }
  });

  const allArticles = results
      .filter(res => res.status === 'fulfilled' && Array.isArray(res.value))
      .flatMap(res => res.value);

  return deduplicateArticles(allArticles);
};

const searchNewsByKeyword = async (keyword, location) => {
  log(`Searching news for keyword: ${keyword}` + (location ? ` in ${location}` : ''));
  const { newsapi, gnews, worldnewsapi, guardian } = config.newsApis;
  const { countryMapping } = config;

  // Prepare params with location if available
  const newsapiParams = { q: keyword, pageSize: 20 };
  if (location && countryMapping[location]?.newsapi) newsapiParams.country = countryMapping[location].newsapi;

  const gnewsParams = { q: keyword, max: 20 };
  if (location && countryMapping[location]?.gnews) gnewsParams.country = countryMapping[location].gnews;

  const worldnewsapiParams = { text: keyword, number: 20 };
  if (location && countryMapping[location]?.worldnewsapi) worldnewsapiParams['source-countries'] = countryMapping[location].worldnewsapi;

  const promises = [
      fetchNewsFromSource('newsapi', 'everything', newsapiParams, normalize.newsapi),
      fetchNewsFromSource('gnews', 'search', gnewsParams, normalize.gnews),
      fetchNewsFromSource('worldnewsapi', 'search-news', worldnewsapiParams, normalize.worldnewsapi),
      fetchNewsFromSource('guardian', 'search', { q: keyword, 'page-size': 20, 'show-fields': 'trailText,bodyText,thumbnail' }, normalize.guardian),
  ];

  const results = await Promise.allSettled(promises);

  results.forEach(result => {
    if (result.status === 'rejected') {
        log(`A source failed to search: ${result.reason?.message || result.reason}`);
    }
  });

  const allArticles = results
      .filter(res => res.status === 'fulfilled' && Array.isArray(res.value))
      .flatMap(res => res.value);
      
  return deduplicateArticles(allArticles);
};

const fetchWeather = async (location) => {
    log(`Fetching weather for location: ${location}`);
    try {
        const apiKey = config.newsApis.weatherstack.apiKey;
        if (!apiKey) throw new Error('Weatherstack API key missing');

        const params = { access_key: apiKey, query: location };
        const response = await axios.get(config.newsApis.weatherstack.baseUrl + '/current', { params });
        return response.data;
    } catch (error) {
        log(`Failed to fetch weather: ${error.message}`);
        return { error: error.message };
    }
}

module.exports = {
  fetchNewsByCategory,
  searchNewsByKeyword,
  fetchWeather,
}; 