import { fetchNewsByCategory, searchNewsByKeyword, fetchNewsByCategories } from '../services/newsApiAggregator.js';
import articleAnalyzerService from '../ai/articleAnalyzerService.js';
import config from '../config/config.js';
import log from '../utils/logger.js';
import newsServiceManager from '../services/newsServiceManager.js';
import dataLoader from '../utils/dataLoader.js';

const logger = log('GraphQLResolvers');

const resolvers = {
  Query: {
    /**
     * Resolver to fetch the list of available news categories.
     */
    categories: () => {
      logger('Resolving categories');
      return config.appData.categories;
    },

    /**
     * Resolver to fetch the list of available locations.
     */
    locations: () => {
      logger('Resolving locations');
      return config.appData.locations;
    },

    /**
     * Resolver to fetch news articles for a given category and optional location.
     * Uses cursor-based pagination for better performance.
     */
    newsByCategory: async (_, { category, location, first = 20, after }) => {
      logger(`Resolving newsByCategory for category: ${category}, location: ${location || 'none'}, first: ${first}`);
      try {
        // Convert cursor-based pagination to offset-based for existing services
        const offset = after ? dataLoader.decodeCursor(after).index + 1 : 0;
        
        const result = await newsServiceManager.getArticlesByCategory(category, location, first, offset);
        
        // Convert to connection format
        return dataLoader.paginateArticles(result.articles || [], after, first);
      } catch (error) {
        logger.error(`Error in newsByCategory resolver for category ${category}:`, error);
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 0,
          errors: [{ 
            source: 'GraphQL', 
            message: error.message,
            code: 'RESOLVER_ERROR',
            retryable: true
          }]
        };
      }
    },

    /**
     * Resolver to fetch top headlines for a given category and optional location.
     * Uses cursor-based pagination for better performance.
     */
    topHeadlines: async (_, { category, location, first = 20, after }) => {
      logger(`Resolving topHeadlines for category: ${category || 'none'}, location: ${location || 'none'}, first: ${first}`);
      try {
        const result = await newsServiceManager.getTopHeadlines(category, location, first);
        
        return dataLoader.paginateArticles(result.articles || [], after, first);
      } catch (error) {
        logger.error(`Error in topHeadlines resolver for category ${category}:`, error);
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 0,
          errors: [{ 
            source: 'GraphQL', 
            message: error.message,
            code: 'RESOLVER_ERROR',
            retryable: true
          }]
        };
      }
    },

    topStoriesAcrossCategories: async (_, { categories, location, first = 20, after }) => {
      logger(`Resolving topStoriesAcrossCategories for categories: ${categories.join(', ')}, location: ${location || 'none'}`);
      try {
        const offset = after ? dataLoader.decodeCursor(after).index + 1 : 0;
        
        // Fetch articles from multiple categories
        const promises = categories.map(category => 
          newsServiceManager.getArticlesByCategory(category, location, first, offset)
        );

        const results = await Promise.allSettled(promises);
        
        // Combine and deduplicate articles
        const allArticles = results
          .filter(res => res.status === 'fulfilled' && res.value?.articles)
          .flatMap(res => res.value.articles);
        
        const uniqueArticles = newsServiceManager.deduplicateArticles(allArticles);
        
        return dataLoader.paginateArticles(uniqueArticles, after, first);
      } catch (error) {
        logger.error(`Error in topStoriesAcrossCategories resolver:`, error);
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 0,
          errors: [{ 
            source: 'GraphQL', 
            message: error.message,
            code: 'RESOLVER_ERROR',
            retryable: true
          }]
        };
      }
    },

    /**
     * Resolver to search for news articles by a keyword, with an optional location.
     * Uses cursor-based pagination for better performance.
     */
    searchNews: async (_, { keyword, location, first = 20, after }) => {
      logger(`Resolving searchNews for keyword: ${keyword}, location: ${location || 'none'}, first: ${first}`);
      try {
        const offset = after ? dataLoader.decodeCursor(after).index + 1 : 0;
        
        const result = await newsServiceManager.searchArticles(keyword, null, location, first, offset);
        
        return dataLoader.paginateArticles(result.articles || [], after, first);
      } catch (error) {
        logger.error(`Error in searchNews resolver for keyword ${keyword}:`, error);
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 0,
          errors: [{ 
            source: 'GraphQL', 
            message: error.message,
            code: 'RESOLVER_ERROR',
            retryable: true
          }]
        };
      }
    },

    /**
     * Resolver to analyze an article's content for a summary and sentiment.
     * Enhanced with confidence scores and entity extraction.
     */
    analyzeArticle: async (_, { content, title }) => {
      logger(`Resolving analyzeArticle for: ${title}`);
      try {
        const analysis = await articleAnalyzerService.analyzeArticle({ 
          url: content, // Using content as URL for now
          title: title
        });
        
        // Ensure the response matches the schema
        return {
          summary: analysis.summary || '',
          sentiment: analysis.sentiment || 'neutral',
          sentimentLabel: analysis.sentimentLabel || 'Neutral',
          confidence: analysis.confidence || 0.5,
          entities: analysis.entities || []
        };
      } catch (error) {
        logger.error(`Error in analyzeArticle resolver for ${title}:`, error);
        throw new Error('Failed to analyze article.');
      }
    },

    /**
     * Resolver to get aggregation metadata for monitoring and analytics.
     */
    aggregationMeta: async () => {
      logger('Resolving aggregationMeta');
      try {
        const startTime = Date.now();
        
        // Get service status
        const serviceStatus = newsServiceManager.getServiceStatus();
        const availableSources = Object.entries(serviceStatus)
          .filter(([_, available]) => available)
          .map(([source, _]) => source);
        
        // Get total articles count (approximate)
        const totalArticles = await newsServiceManager.getTopHeadlines(null, null, 1);
        
        const processingTime = Date.now() - startTime;
        
        return {
          sources: availableSources,
          lastUpdated: new Date().toISOString(),
          totalArticles: totalArticles.articles?.length || 0,
          processingTime: processingTime
        };
      } catch (error) {
        logger.error('Error in aggregationMeta resolver:', error);
        return {
          sources: [],
          lastUpdated: new Date().toISOString(),
          totalArticles: 0,
          processingTime: 0
        };
      }
    },
  },

  Mutation: {
    /**
     * Mutation to refresh articles for a specific category.
     */
    refreshCategory: async (_, { category, location }) => {
      logger(`Refreshing category: ${category}, location: ${location || 'none'}`);
      try {
        // Clear cache for this category
        dataLoader.clearCache();
        
        const result = await newsServiceManager.getArticlesByCategory(category, location, 20, 0);
        
        return dataLoader.paginateArticles(result.articles || [], null, 20);
      } catch (error) {
        logger.error(`Error in refreshCategory mutation:`, error);
        throw new Error(`Failed to refresh category: ${error.message}`);
      }
    },

    /**
     * Mutation to update preferences and get fresh articles.
     */
    updatePreferencesAndRefresh: async (_, { categories, location }) => {
      logger(`Updating preferences and refreshing for categories: ${categories.join(', ')}`);
      try {
        // Clear cache
        dataLoader.clearCache();
        
        // Fetch fresh articles for all categories
        const promises = categories.map(category => 
          newsServiceManager.getArticlesByCategory(category, location, 10, 0)
        );

        const results = await Promise.allSettled(promises);
        
        const allArticles = results
          .filter(res => res.status === 'fulfilled' && res.value?.articles)
          .flatMap(res => res.value.articles);
        
        const uniqueArticles = newsServiceManager.deduplicateArticles(allArticles);
        
        return dataLoader.paginateArticles(uniqueArticles, null, 20);
      } catch (error) {
        logger.error(`Error in updatePreferencesAndRefresh mutation:`, error);
        throw new Error(`Failed to update preferences: ${error.message}`);
      }
    },
  },
};

export default resolvers;