const path = require('path');

// Configuration settings for the server
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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
      keyName: 'apiKey',
      rateLimits: {
        requestsPerDay: 100, // Free tier limit
        requestsPerSecond: 1,
      },
    },
    gnews: {
      baseUrl: 'https://gnews.io/api/v4',
      apiKey: process.env.GNEWS_API_KEY,
      keyName: 'apikey',
      rateLimits: {
        requestsPerDay: 100, // Free tier limit
        requestsPerSecond: 1,
      },
    },
    guardian: {
      baseUrl: 'https://content.guardianapis.com',
      apiKey: process.env.GUARDIAN_API_KEY,
      keyName: 'api-key',
      rateLimits: {
        requestsPerDay: 500, // Free tier limit
        requestsPerSecond: 1,
      },
    },
    nytimes: {
      baseUrl: 'https://api.nytimes.com/svc',
      apiKey: process.env.NYT_API_KEY,
      keyName: 'api-key',
      rateLimits: {
        requestsPerDay: 500, // Approximate free tier limit
        requestsPerSecond: 1,
      },
    },
    worldnewsapi: {
      baseUrl: 'https://api.worldnewsapi.com',
      apiKey: process.env.WORLD_NEWS_API_KEY,
      keyName: 'api-key',
      rateLimits: {
        requestsPerDay: 100, // Placeholder
        requestsPerSecond: 1,
      },
    },
    weatherstack: {
      baseUrl: 'http://api.weatherstack.com',
      apiKey: process.env.WEATHER_API_KEY,
      rateLimits: {
        requestsPerDay: 250, // Free tier limit
        requestsPerSecond: 1,
      },
    },
  },
  
  // Static application data
  appData: {
    categories: [
      { id: 'business', name: 'Business', description: 'Business and finance news' },
      { id: 'entertainment', name: 'Entertainment', description: 'Entertainment and celebrity news' },
      { id: 'general', name: 'General', description: 'General news' },
      { id: 'health', name: 'Health', description: 'Health and wellness news' },
      { id: 'science', name: 'Science', description: 'Science and research news' },
      { id: 'sports', name: 'Sports', description: 'Sports news and updates' },
      { id: 'technology', name: 'Technology', description: 'Technology news' },
      { id: 'world', name: 'World', description: 'World news' },
      { id: 'politics', name: 'Politics', description: 'Political news' },
    ],
    locations: [
      { id: 'us', name: 'United States', code: 'us' },
      { id: 'gb', name: 'United Kingdom', code: 'gb' },
      { id: 'ca', name: 'Canada', code: 'ca' },
      { id: 'au', name: 'Australia', code: 'au' },
      { id: 'in', name: 'India', code: 'in' },
    ],
  },
  
  // Cache configuration
  cache: {
    memory: {
      ttl: 15 * 60 * 1000, // 15 minutes in milliseconds
      maxSize: 1000, // Maximum number of items in memory cache
    },
    redis: {
      url: process.env.REDIS_URL || null,
      ttl: 60 * 60 * 1000, // 1 hour in milliseconds
    },
    // Cache TTL by content type (in milliseconds)
    ttlByType: {
      summary: 24 * 60 * 60 * 1000, // 24 hours for summaries
      category: 24 * 60 * 60 * 1000, // 24 hours for categories
      sentiment: 24 * 60 * 60 * 1000, // 24 hours for sentiment analysis
      entities: 24 * 60 * 60 * 1000, // 24 hours for entity extraction
      relevance: 12 * 60 * 60 * 1000, // 12 hours for relevance scores
      articles: 30 * 60 * 1000, // 30 minutes for article lists
    }
  },
  
  // LangChain/OpenAI configuration
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    fallbackModel: 'gpt-3.5-turbo', // Fallback model if primary is unavailable
    temperature: 0.1, // Lower temperature for more consistent results
    maxTokens: 500, // Default max tokens for responses
    requestTimeout: 30000, // 30 seconds timeout for API requests
    retryAttempts: 3, // Number of retry attempts for failed requests
    rateLimits: {
      requestsPerMinute: 60, // Default rate limit
      tokensPerMinute: 90000, // Default token rate limit
    },
    // Feature flags for AI capabilities
    features: {
      summarization: false,
      categorization: false,
      sentimentAnalysis: false,
      entityExtraction: false,
      relevanceScoring: false,
      deduplication: false,
      fallbackToLocal: false, // Use local models as fallback
    }
  },
  
  // Category mapping between different APIs
  categoryMapping: {
    // Standard categories we use in our app
    business: {
      newsapi: 'business',
      gnews: 'business',
      guardian: 'business',
      nytimes: 'business',
     
    },
    technology: {
      newsapi: 'technology',
      gnews: 'technology',
      guardian: 'technology',
      nytimes: 'technology',
    },
    entertainment: {
      newsapi: 'entertainment',
      gnews: 'entertainment',
      guardian: 'culture',
      nytimes: 'arts',
     
    },
    sports: {
      newsapi: 'sports',
      gnews: 'sports',
      guardian: 'sport',
      nytimes: 'sports',
    },
    science: {
      newsapi: 'science',
      gnews: 'science',
      guardian: 'science',
      nytimes: 'science',
    },
    health: {
      newsapi: 'health',
      gnews: 'health',
      guardian: 'lifeandstyle',
      nytimes: 'health',
    },
    general: {
      newsapi: 'general',
      gnews: 'general',
      guardian: 'news',
      nytimes: 'home',
      
    },
    world: {
      newsapi: 'general',
      gnews: 'world',
      guardian: 'world',
      nytimes: 'world',
    },
    politics: {
      newsapi: 'general',
      gnews: 'nation',
      guardian: 'politics',
      nytimes: 'politics',
    },
  },
  
  // Country/location mapping
  countryMapping: {
    us: {
      newsapi: 'us',
      gnews: 'us',
      guardian: 'us',
      nytimes: 'us',
    },
    gb: {
      newsapi: 'gb',
      gnews: 'gb',
      guardian: 'uk',
      nytimes: 'uk',
     
    },
    ca: {
      newsapi: 'ca',
      gnews: 'ca',
      guardian: 'ca',
      nytimes: 'ca',
      
    },
    au: {
      newsapi: 'au',
      gnews: 'au',
      guardian: 'au',
      nytimes: 'au',
     
    },
    in: {
      newsapi: 'in',
      gnews: 'in',
      guardian: 'in',
      nytimes: 'in',
     
    },
  },
};

module.exports = config;