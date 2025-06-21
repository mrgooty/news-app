import DataLoader from 'dataloader';
import crypto from 'crypto';

/**
 * DataLoader for batching and caching GraphQL queries
 * Prevents N+1 query problems and improves performance
 */
class NewsDataLoader {
  constructor() {
    // Cache for article data
    this.articleLoader = new DataLoader(async (articleIds) => {
      // This would typically batch load from database
      // For now, we'll return the IDs as-is since articles come from external APIs
      return articleIds.map(id => ({ id }));
    }, {
      cacheKeyFn: (key) => key,
      maxBatchSize: 100,
      batchScheduleFn: (callback) => setTimeout(callback, 10),
    });

    // Cache for category data
    this.categoryLoader = new DataLoader(async (categoryIds) => {
      // Load categories from config
      const categories = require('../config/config.js').default.appData.categories;
      return categoryIds.map(id => categories.find(cat => cat.id === id));
    });

    // Cache for location data
    this.locationLoader = new DataLoader(async (locationIds) => {
      // Load locations from config
      const locations = require('../config/config.js').default.appData.locations;
      return locationIds.map(id => locations.find(loc => loc.id === id));
    });
  }

  /**
   * Generate a cursor for pagination
   * @param {Object} article - Article object
   * @param {number} index - Index in the result set
   * @returns {string} - Base64 encoded cursor
   */
  generateCursor(article, index) {
    const cursorData = {
      id: article.id,
      publishedAt: article.publishedAt,
      index: index,
      timestamp: Date.now()
    };
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Decode a cursor
   * @param {string} cursor - Base64 encoded cursor
   * @returns {Object} - Decoded cursor data
   */
  decodeCursor(cursor) {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString();
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Invalid cursor');
    }
  }

  /**
   * Apply cursor-based pagination to articles
   * @param {Array} articles - Array of articles
   * @param {string} after - Cursor to start after
   * @param {number} first - Number of articles to return
   * @returns {Object} - Paginated result with edges and pageInfo
   */
  paginateArticles(articles, after = null, first = 20) {
    let filteredArticles = [...articles];

    // Apply cursor filter if provided
    if (after) {
      const cursorData = this.decodeCursor(after);
      filteredArticles = filteredArticles.filter(article => {
        if (article.publishedAt && cursorData.publishedAt) {
          return new Date(article.publishedAt) < new Date(cursorData.publishedAt);
        }
        return article.id !== cursorData.id;
      });
    }

    // Apply limit
    const limitedArticles = filteredArticles.slice(0, first);

    // Create edges with cursors
    const edges = limitedArticles.map((article, index) => ({
      node: {
        ...article,
        cursor: this.generateCursor(article, index)
      },
      cursor: this.generateCursor(article, index)
    }));

    // Create page info
    const pageInfo = {
      hasNextPage: filteredArticles.length > first,
      hasPreviousPage: !!after,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
    };

    return {
      edges,
      pageInfo,
      totalCount: articles.length
    };
  }

  /**
   * Batch load articles by category
   * @param {Array} categoryRequests - Array of {category, location, first, after}
   * @returns {Promise<Array>} - Array of article connections
   */
  async batchLoadArticlesByCategory(categoryRequests) {
    // Group requests by category and location for efficient batching
    const requestGroups = new Map();
    
    categoryRequests.forEach((request, index) => {
      const key = `${request.category}:${request.location || 'global'}`;
      if (!requestGroups.has(key)) {
        requestGroups.set(key, []);
      }
      requestGroups.get(key).push({ ...request, originalIndex: index });
    });

    // Load articles for each group
    const results = new Array(categoryRequests.length);
    
    for (const [key, requests] of requestGroups) {
      const [category, location] = key.split(':');
      
      try {
        // Load articles from news service manager
        const newsServiceManager = require('../services/newsServiceManager.js').default;
        const articles = await newsServiceManager.getArticlesByCategory(
          category,
          location === 'global' ? null : location,
          Math.max(...requests.map(r => r.first)),
          0
        );

        // Apply pagination for each request
        requests.forEach(request => {
          const connection = this.paginateArticles(
            articles.articles || [],
            request.after,
            request.first
          );
          results[request.originalIndex] = connection;
        });
      } catch (error) {
        // Handle errors for each request
        requests.forEach(request => {
          results[request.originalIndex] = {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null
            },
            totalCount: 0,
            errors: [{
              source: 'DataLoader',
              message: error.message,
              code: 'LOAD_ERROR',
              retryable: true
            }]
          };
        });
      }
    }

    return results;
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.articleLoader.clearAll();
    this.categoryLoader.clearAll();
    this.locationLoader.clearAll();
  }
}

// Create singleton instance
const dataLoader = new NewsDataLoader();

export default dataLoader; 