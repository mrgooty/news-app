const { fetchNewsByCategory, searchNewsByKeyword } = require('../services/newsApiAggregator');
const articleAnalyzerService = require('../ai/articleAnalyzerService');
const config = require('../config/config');
const log = require('../utils/logger')('GraphQLResolvers');

const resolvers = {
  Query: {
    /**
     * Resolver to fetch the list of available news categories.
     */
    categories: () => {
      log('Resolving categories');
      return config.appData.categories;
    },

    /**
     * Resolver to fetch the list of available locations.
     */
    locations: () => {
      log('Resolving locations');
      return config.appData.locations;
    },

    /**
     * Resolver to fetch news articles for a given category and optional location.
     * Delegates the core logic to the newsApiAggregator service.
     */
    newsByCategory: async (_, { category, location }) => {
      log(`Resolving newsByCategory for category: ${category}, location: ${location || 'none'}`);
      try {
        const articles = await fetchNewsByCategory(category, location);
        return articles;
      } catch (error) {
        log.error(`Error in newsByCategory resolver for category ${category}:`, error);
        // In a real app, you might want to return a specific GraphQL error
        throw new Error('Failed to fetch news by category.');
      }
    },

    /**
     * Resolver to search for news articles by a keyword, with an optional location.
     * Delegates the core logic to the newsApiAggregator service.
     */
    searchNews: async (_, { keyword, location }) => {
      log(`Resolving searchNews for keyword: ${keyword}, location: ${location || 'none'}`);
      try {
        const articles = await searchNewsByKeyword(keyword, location);
        return articles;
      } catch (error) {
        log.error(`Error in searchNews resolver for keyword ${keyword}:`, error);
        throw new Error('Failed to search for news.');
      }
    },

    /**
     * Resolver to analyze an article's content for a summary and sentiment.
     * Delegates to the ArticleAnalyzerService.
     */
    analyzeArticle: async (_, { content, title }) => {
      log(`Resolving analyzeArticle for: ${title}`);
      try {
        const analysis = await articleAnalyzerService.analyze(content, title);
        return analysis;
      } catch (error) {
        log.error(`Error in analyzeArticle resolver for ${title}:`, error);
        throw new Error('Failed to analyze article.');
      }
    },
  },
};

module.exports = { resolvers };