// Configuration settings for the server
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 4000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // News API configurations
  newsApis: {
    // These will be populated from environment variables
    newsapi: {
      baseUrl: 'https://newsapi.org/v2',
      apiKey: process.env.NEWSAPI_KEY,
    },
    gnews: {
      baseUrl: 'https://gnews.io/api/v4',
      apiKey: process.env.GNEWS_API_KEY,
    },
    nytimes: {
      baseUrl: 'https://api.nytimes.com/svc',
      apiKey: process.env.NYTIMES_API_KEY,
    },
    guardian: {
      baseUrl: 'https://content.guardianapis.com',
      apiKey: process.env.GUARDIAN_API_KEY,
    },
  },
  
  // LangChain/OpenAI configuration
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
  },
};

module.exports = config;