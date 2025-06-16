// Configuration settings for the server
require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 4000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // News API configurations
  newsApis: {
    newsapi: {
      baseUrl: 'https://newsapi.org/v2',
      apiKey: process.env.NEWS_API_KEY,
      rateLimits: {
        requestsPerDay: 100, // Free tier limit
        requestsPerSecond: 1,
      },
    },
    newsdata: {
      baseUrl: 'https://newsdata.io/api/1',
      apiKey: process.env.NEWSDATA_API_KEY,
      rateLimits: {
        requestsPerDay: 200, // Approximate free tier limit
        requestsPerSecond: 1,
      },
    },
    gnews: {
      baseUrl: 'https://gnews.io/api/v4',
      apiKey: process.env.GNEWS_API_KEY,
      rateLimits: {
        requestsPerDay: 100, // Free tier limit
        requestsPerSecond: 1,
      },
    },
    guardian: {
      baseUrl: 'https://content.guardianapis.com',
      apiKey: process.env.GUARDIAN_API_KEY,
      rateLimits: {
        requestsPerDay: 500, // Free tier limit
        requestsPerSecond: 1,
      },
    },
    nytimes: {
      baseUrl: 'https://api.nytimes.com/svc',
      apiKey: process.env.NYT_API_KEY,
      rateLimits: {
        requestsPerDay: 500, // Approximate free tier limit
        requestsPerSecond: 1,
      },
    },
    mediastack: {
      baseUrl: 'http://api.mediastack.com/v1',
      apiKey: process.env.MEDIASTACK_API_KEY,
      rateLimits: {
        requestsPerMonth: 500, // Free tier limit
        requestsPerSecond: 1,
      },
    },
    newscatcher: {
      baseUrl: 'https://api.newscatcherapi.com/v2',
      apiKey: process.env.NEWSCATCHER_API_KEY,
      rateLimits: {
        requestsPerMonth: 1000, // Free tier limit for personal email
        requestsPerSecond: 1,
      },
    },
    bing: {
      baseUrl: 'https://api.bing.microsoft.com/v7.0',
      apiKey: process.env.BING_NEWS_API_KEY,
      rateLimits: {
        requestsPerMonth: 1000, // Free tier limit
        requestsPerSecond: 3,
      },
    },
    currents: {
      baseUrl: 'https://api.currentsapi.services/v1',
      apiKey: process.env.CURRENTS_API_KEY,
      rateLimits: {
        requestsPerDay: 600, // Approximate free tier limit
        requestsPerSecond: 1,
      },
    },
  },
  
  // Cache configuration
  cache: {
    ttl: 15 * 60 * 1000, // 15 minutes in milliseconds
  },
  
  // LangChain/OpenAI configuration
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
  },
  
  // Category mapping between different APIs
  categoryMapping: {
    // Standard categories we use in our app
    business: {
      newsapi: 'business',
      gnews: 'business',
      guardian: 'business',
      nytimes: 'business',
      newsdata: 'business',
      mediastack: 'business',
    },
    technology: {
      newsapi: 'technology',
      gnews: 'technology',
      guardian: 'technology',
      nytimes: 'technology',
      newsdata: 'technology',
      mediastack: 'technology',
    },
    entertainment: {
      newsapi: 'entertainment',
      gnews: 'entertainment',
      guardian: 'culture',
      nytimes: 'arts',
      newsdata: 'entertainment',
      mediastack: 'entertainment',
    },
    sports: {
      newsapi: 'sports',
      gnews: 'sports',
      guardian: 'sport',
      nytimes: 'sports',
      newsdata: 'sports',
      mediastack: 'sports',
    },
    science: {
      newsapi: 'science',
      gnews: 'science',
      guardian: 'science',
      nytimes: 'science',
      newsdata: 'science',
      mediastack: 'science',
    },
    health: {
      newsapi: 'health',
      gnews: 'health',
      guardian: 'lifeandstyle',
      nytimes: 'health',
      newsdata: 'health',
      mediastack: 'health',
    },
    general: {
      newsapi: 'general',
      gnews: 'general',
      guardian: 'news',
      nytimes: 'home',
      newsdata: 'top',
      mediastack: 'general',
    },
    world: {
      newsapi: 'general',
      gnews: 'world',
      guardian: 'world',
      nytimes: 'world',
      newsdata: 'world',
      mediastack: 'general',
    },
    politics: {
      newsapi: 'general',
      gnews: 'nation',
      guardian: 'politics',
      nytimes: 'politics',
      newsdata: 'politics',
      mediastack: 'general',
    },
  },
  
  // Country/location mapping
  countryMapping: {
    us: {
      newsapi: 'us',
      gnews: 'us',
      guardian: 'us',
      nytimes: 'us',
      newsdata: 'us',
      mediastack: 'us',
    },
    gb: {
      newsapi: 'gb',
      gnews: 'gb',
      guardian: 'uk',
      nytimes: 'uk',
      newsdata: 'gb',
      mediastack: 'gb',
    },
    ca: {
      newsapi: 'ca',
      gnews: 'ca',
      guardian: 'ca',
      nytimes: 'ca',
      newsdata: 'ca',
      mediastack: 'ca',
    },
    au: {
      newsapi: 'au',
      gnews: 'au',
      guardian: 'au',
      nytimes: 'au',
      newsdata: 'au',
      mediastack: 'au',
    },
    in: {
      newsapi: 'in',
      gnews: 'in',
      guardian: 'in',
      nytimes: 'in',
      newsdata: 'in',
      mediastack: 'in',
    },
  },
};

module.exports = config;