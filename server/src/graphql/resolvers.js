const NewsServiceManager = require('../services/newsServiceManager');
const { ImprovedNewsAggregator } = require('../ai');
const createLogger = require("../utils/logger");
const log = createLogger("Resolvers");

// Initialize the news service manager
const newsServiceManager = new NewsServiceManager();

// Initialize the improved AI news aggregator
const newsAggregator = new ImprovedNewsAggregator();

const resolvers = {
  Query: {
    // Get all available news categories
    categories: async () => {
      return newsServiceManager.getCategories();
    },
    
    // Get all available news sources
    sources: async () => {
      return newsServiceManager.getSources();
    },
    
    // Get all available locations
    locations: async () => {
      return newsServiceManager.getLocations();
    },
    
    // Get news articles by category
    articlesByCategory: async (_, { category, location, limit = 10, sources }) => {
      log(`Fetching articles for category: ${category}, location: ${location}, limit: ${limit}, sources: ${sources}`);
      
      try {
        const result = await newsServiceManager.getArticlesByCategory(category, location, limit * 2, sources);
        
        // Process articles with AI
        if (result.articles && result.articles.length > 0) {
          // Process all articles with AI
          const processedArticles = await newsAggregator.processArticles(result.articles);
          
          // Rank the processed articles
          const rankedArticles = await newsAggregator.rankArticles(processedArticles, {
            recencyWeight: 0.3,
            scoreWeight: 0.7,
            diversityBoost: 0.1
          });
          
          // Limit to the requested number
          result.articles = rankedArticles.slice(0, limit);
        }
        
        return result;
      } catch (error) {
        console.error('Error in articlesByCategory resolver:', error);
        return {
          articles: [],
          errors: [{
            source: 'resolver',
            message: error.message,
            code: 'ERROR'
          }]
        };
      }
    },
    
    // Get a specific article by ID
    article: async (_, { id }) => {
      log(`Fetching article with ID: ${id}`);
      
      // This is a placeholder. In a real implementation, we would need to store
      // articles in a database or cache to retrieve them by ID.
      // For now, we'll return null as we don't have a way to fetch by ID directly.
      return null;
    },
    
    // Search for articles
    searchArticles: async (_, { query, category, location, limit = 10, sources }) => {
      log(`Searching for articles with query: ${query}, category: ${category}, location: ${location}, limit: ${limit}, sources: ${sources}`);
      
      try {
        const result = await newsServiceManager.searchArticles(query, category, location, limit * 2, sources);
        
        // Process articles with AI
        if (result.articles && result.articles.length > 0) {
          // Process all articles with AI
          const processedArticles = await newsAggregator.processArticles(result.articles);
          
          // Filter articles to prioritize those matching the search query
          const filteredArticles = await newsAggregator.filterArticles(processedArticles, {
            minScore: 4.0,
            category: category,
            includeKeywords: [query],
          });
          
          // If filtering removed too many articles, use the original processed articles
          const articlesToRank = filteredArticles.length < limit / 2 ? processedArticles : filteredArticles;
          
          // Rank the processed articles
          const rankedArticles = await newsAggregator.rankArticles(articlesToRank, {
            recencyWeight: 0.3,
            scoreWeight: 0.7
          });
          
          // Limit to the requested number
          result.articles = rankedArticles.slice(0, limit);
        }
        
        return result;
      } catch (error) {
        console.error('Error in searchArticles resolver:', error);
        return {
          articles: [],
          errors: [{
            source: 'resolver',
            message: error.message,
            code: 'ERROR'
          }]
        };
      }
    },
    
    // Get top headlines
    topHeadlines: async (_, { category, location, limit = 10, sources }) => {
      log(`Fetching top headlines with category: ${category}, location: ${location}, limit: ${limit}, sources: ${sources}`);
      
      try {
        const result = await newsServiceManager.getTopHeadlines(category, location, limit * 2, sources);
        
        // Process articles with AI
        if (result.articles && result.articles.length > 0) {
          // Process all articles with AI
          const processedArticles = await newsAggregator.processArticles(result.articles);
          
          // Rank the processed articles
          const rankedArticles = await newsAggregator.rankArticles(processedArticles, {
            recencyWeight: 0.4, // Higher weight on recency for headlines
            scoreWeight: 0.6,
            diversityBoost: 0.1
          });
          
          // Limit to the requested number
          result.articles = rankedArticles.slice(0, limit);
        }
        
        return result;
      } catch (error) {
        console.error('Error in topHeadlines resolver:', error);
        return {
          articles: [],
          errors: [{
            source: 'resolver',
            message: error.message,
            code: 'ERROR'
          }]
        };
      }
    },
    
    // Get top stories across multiple categories
    topStoriesAcrossCategories: async (_, { categories = ['general'], limit = 15, location, sources }) => {
      log(`Fetching top stories across categories: ${categories}, limit: ${limit}, location: ${location}, sources: ${sources}`);
      
      try {
        // Fetch articles for each category
        const articlesByCategory = {};
        const fetchPromises = categories.map(async (category) => {
          const result = await newsServiceManager.getArticlesByCategory(category, location, Math.ceil(limit / categories.length) * 2, sources);
          articlesByCategory[category] = result.articles || [];
        });
        
        await Promise.all(fetchPromises);
        
        // Aggregate top stories across categories
        const topStories = await newsAggregator.getTopStories(articlesByCategory, limit);
        
        return {
          articles: topStories,
          errors: null,
        };
      } catch (error) {
        console.error('Error in topStoriesAcrossCategories resolver:', error);
        return {
          articles: [],
          errors: [{
            source: 'resolver',
            message: error.message,
            code: 'ERROR'
          }]
        };
      }
    },

    // Get performance metrics
    performanceMetrics: async () => {
      try {
        const metrics = newsAggregator.getPerformanceMetrics();
        return {
          cacheHitRate: metrics.cacheStats?.hitRate || '0%',
          averageProcessingTime: metrics.averageProcessArticleTime || 0,
          totalRequests: metrics.totalRequestCount || 0,
          apiCalls: metrics.apiUsage?.totalCalls || 0,
        };
      } catch (error) {
        console.error('Error getting performance metrics:', error);
        return {
          cacheHitRate: '0%',
          averageProcessingTime: 0,
          totalRequests: 0,
          apiCalls: 0,
        };
      }
    },

    prefs: (_, __, { prefs }) => prefs
  },

  Mutation: {
    setPrefs: async (_, { categories, locations }, { setPrefs }) => {
      const p = { categories, locations };
      setPrefs(p);
      return p;
    },
    
    // Reset performance metrics
    resetMetrics: async () => {
      try {
        newsAggregator.resetMetrics();
        return { success: true, message: 'Metrics reset successfully' };
      } catch (error) {
        return { success: false, message: `Error resetting metrics: ${error.message}` };
      }
    }
  }
};

module.exports = { resolvers };