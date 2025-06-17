const NewsServiceManager = require('../services/newsServiceManager');
const NewsAggregator = require('../ai/newsAggregator');

// Initialize the news service manager
const newsServiceManager = new NewsServiceManager();

// Initialize the AI news aggregator
const newsAggregator = new NewsAggregator();

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
      console.log(`Fetching articles for category: ${category}, location: ${location}, limit: ${limit}, sources: ${sources}`);
      
      try {
        const result = await newsServiceManager.getArticlesByCategory(category, location, limit * 2, sources);
        
        // Process articles with AI
        if (result.articles && result.articles.length > 0) {
          // Process all articles with AI
          const processedArticles = await newsAggregator.processArticles(result.articles);
          
          // Rank the processed articles
          const rankedArticles = await newsAggregator.rankArticles(processedArticles, {
            recencyWeight: 0.3,
            scoreWeight: 0.7
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
      console.log(`Fetching article with ID: ${id}`);
      
      // This is a placeholder. In a real implementation, we would need to store
      // articles in a database or cache to retrieve them by ID.
      // For now, we'll return null as we don't have a way to fetch by ID directly.
      return null;
    },
    
    // Search for articles
    searchArticles: async (_, { query, category, location, limit = 10, sources }) => {
      console.log(`Searching for articles with query: ${query}, category: ${category}, location: ${location}, limit: ${limit}, sources: ${sources}`);
      
      try {
        const result = await newsServiceManager.searchArticles(query, category, location, limit * 2, sources);
        
        // Process articles with AI
        if (result.articles && result.articles.length > 0) {
          // Process all articles with AI
          const processedArticles = await newsAggregator.processArticles(result.articles);
          
          // Rank the processed articles
          const rankedArticles = await newsAggregator.rankArticles(processedArticles, {
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
      console.log(`Fetching top headlines with category: ${category}, location: ${location}, limit: ${limit}, sources: ${sources}`);
      
      try {
        const result = await newsServiceManager.getTopHeadlines(category, location, limit * 2, sources);
        
        // Process articles with AI
        if (result.articles && result.articles.length > 0) {
          // Process all articles with AI
          const processedArticles = await newsAggregator.processArticles(result.articles);
          
          // Rank the processed articles
          const rankedArticles = await newsAggregator.rankArticles(processedArticles, {
            recencyWeight: 0.3,
            scoreWeight: 0.7
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
    
    // NEW RESOLVER: Get top stories across multiple categories
    topStoriesAcrossCategories: async (_, { categories = ['general'], limit = 15, location, sources }) => {
      console.log(`Fetching top stories across categories: ${categories}, limit: ${limit}, location: ${location}, sources: ${sources}`);
      
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

    prefs: async (_, __, { prefs }) => {
      return prefs;
    }
  },

  Mutation: {
    setPrefs: async (_, { categories, locations }, { setPrefs }) => {
      const p = { categories, locations };
      setPrefs(p);
      return p;
    }
  }
};

module.exports = { resolvers };