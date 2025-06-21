import { jest } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import schema from '../../graphql/schema.js';
import resolvers from '../../graphql/resolvers.js';
import config from '../../config/config.js';

// Mock dependencies
jest.mock('../../services/newsServiceManager.js');
jest.mock('../../ai/articleAnalyzerService.js');
jest.mock('../../config/config.js');
jest.mock('../../utils/logger.js', () => () => jest.fn());

describe('GraphQL API Integration Tests', () => {
  let server;
  let apolloServer;
  let mockNewsServiceManager;
  let mockArticleAnalyzerService;

  beforeAll(async () => {
    // Setup Apollo Server
    apolloServer = new ApolloServer({
      typeDefs: schema,
      resolvers,
    });

    await apolloServer.start();

    // Setup Express app
    const app = express();
    app.use(cors());
    app.use(json());
    app.use('/graphql', expressMiddleware(apolloServer));

    server = createServer(app);

    // Mock config
    config.appData = {
      categories: [
        { id: 'technology', name: 'Technology', description: 'Tech news' },
        { id: 'business', name: 'Business', description: 'Business news' }
      ],
      locations: [
        { id: 'us', name: 'United States', code: 'us' },
        { id: 'gb', name: 'United Kingdom', code: 'gb' }
      ]
    };
  });

  afterAll(async () => {
    await apolloServer.stop();
    server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockNewsServiceManager = {
      getArticlesByCategory: jest.fn(),
      searchArticles: jest.fn(),
      getTopHeadlines: jest.fn(),
      getServiceStatus: jest.fn().mockReturnValue({
        newsapi: true,
        gnews: true,
        guardian: true
      }),
      deduplicateArticles: jest.fn(articles => articles)
    };

    mockArticleAnalyzerService = {
      analyzeArticle: jest.fn()
    };

    jest.doMock('../../services/newsServiceManager.js', () => ({
      default: mockNewsServiceManager
    }));

    jest.doMock('../../ai/articleAnalyzerService.js', () => ({
      default: mockArticleAnalyzerService
    }));
  });

  const gqlRequest = (query, variables = {}) => {
    return request(server)
      .post('/graphql')
      .send({
        query,
        variables
      })
      .set('Content-Type', 'application/json');
  };

  describe('Categories Query', () => {
    const CATEGORIES_QUERY = `
      query GetCategories {
        categories {
          id
          name
          description
        }
      }
    `;

    test('should return all categories', async () => {
      const response = await gqlRequest(CATEGORIES_QUERY);

      expect(response.status).toBe(200);
      expect(response.body.data.categories).toHaveLength(2);
      expect(response.body.data.categories[0]).toEqual({
        id: 'technology',
        name: 'Technology',
        description: 'Tech news'
      });
    });

    test('should handle server errors gracefully', async () => {
      // Mock config to throw error
      config.appData = null;

      const response = await gqlRequest(CATEGORIES_QUERY);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Locations Query', () => {
    const LOCATIONS_QUERY = `
      query GetLocations {
        locations {
          id
          name
          code
        }
      }
    `;

    test('should return all locations', async () => {
      const response = await gqlRequest(LOCATIONS_QUERY);

      expect(response.status).toBe(200);
      expect(response.body.data.locations).toHaveLength(2);
      expect(response.body.data.locations[0]).toEqual({
        id: 'us',
        name: 'United States',
        code: 'us'
      });
    });
  });

  describe('NewsByCategory Query', () => {
    const NEWS_BY_CATEGORY_QUERY = `
      query GetNewsByCategory($category: String!, $location: String, $first: Int, $after: String) {
        newsByCategory(category: $category, location: $location, first: $first, after: $after) {
          edges {
            node {
              id
              title
              description
              url
              imageUrl
              source
              publishedAt
              category
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    test('should return articles for a category', async () => {
      const mockArticles = [
        testUtils.createTestArticle({ id: '1', title: 'Test Article 1' }),
        testUtils.createTestArticle({ id: '2', title: 'Test Article 2' })
      ];

      mockNewsServiceManager.getArticlesByCategory.mockResolvedValue({
        articles: mockArticles,
        errors: null
      });

      const response = await gqlRequest(NEWS_BY_CATEGORY_QUERY, {
        category: 'technology',
        location: 'us',
        first: 10
      });

      expect(response.status).toBe(200);
      expect(response.body.data.newsByCategory.edges).toHaveLength(2);
      expect(response.body.data.newsByCategory.pageInfo.hasNextPage).toBe(false);
      expect(response.body.data.newsByCategory.totalCount).toBe(2);
    });

    test('should handle pagination correctly', async () => {
      const mockArticles = Array.from({ length: 15 }, (_, i) => 
        testUtils.createTestArticle({ id: `${i}`, title: `Test Article ${i}` })
      );

      mockNewsServiceManager.getArticlesByCategory.mockResolvedValue({
        articles: mockArticles,
        errors: null
      });

      const response = await gqlRequest(NEWS_BY_CATEGORY_QUERY, {
        category: 'technology',
        location: 'us',
        first: 10
      });

      expect(response.status).toBe(200);
      expect(response.body.data.newsByCategory.edges).toHaveLength(10);
      expect(response.body.data.newsByCategory.pageInfo.hasNextPage).toBe(true);
    });

    test('should handle service errors gracefully', async () => {
      mockNewsServiceManager.getArticlesByCategory.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await gqlRequest(NEWS_BY_CATEGORY_QUERY, {
        category: 'technology',
        location: 'us',
        first: 10
      });

      expect(response.status).toBe(200);
      expect(response.body.data.newsByCategory.edges).toHaveLength(0);
      expect(response.body.data.newsByCategory.errors).toBeDefined();
    });

    test('should handle missing required parameters', async () => {
      const response = await gqlRequest(NEWS_BY_CATEGORY_QUERY, {
        location: 'us',
        first: 10
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('SearchNews Query', () => {
    const SEARCH_NEWS_QUERY = `
      query SearchNews($keyword: String!, $location: String, $first: Int, $after: String) {
        searchNews(keyword: $keyword, location: $location, first: $first, after: $after) {
          edges {
            node {
              id
              title
              description
              url
              source
              publishedAt
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    test('should search articles by keyword', async () => {
      const mockArticles = [
        testUtils.createTestArticle({ id: '1', title: 'Search Result 1' }),
        testUtils.createTestArticle({ id: '2', title: 'Search Result 2' })
      ];

      mockNewsServiceManager.searchArticles.mockResolvedValue({
        articles: mockArticles,
        errors: null
      });

      const response = await gqlRequest(SEARCH_NEWS_QUERY, {
        keyword: 'test query',
        location: 'us',
        first: 10
      });

      expect(response.status).toBe(200);
      expect(response.body.data.searchNews.edges).toHaveLength(2);
      expect(mockNewsServiceManager.searchArticles).toHaveBeenCalledWith(
        'test query',
        null,
        'us',
        10,
        0
      );
    });

    test('should handle search errors gracefully', async () => {
      mockNewsServiceManager.searchArticles.mockRejectedValue(
        new Error('Search failed')
      );

      const response = await gqlRequest(SEARCH_NEWS_QUERY, {
        keyword: 'test query',
        location: 'us',
        first: 10
      });

      expect(response.status).toBe(200);
      expect(response.body.data.searchNews.edges).toHaveLength(0);
      expect(response.body.data.searchNews.errors).toBeDefined();
    });
  });

  describe('AnalyzeArticle Query', () => {
    const ANALYZE_ARTICLE_QUERY = `
      query AnalyzeArticle($content: String!, $title: String!) {
        analyzeArticle(content: $content, title: $title) {
          summary
          sentiment
          sentimentLabel
          confidence
          entities {
            name
            type
            confidence
          }
        }
      }
    `;

    test('should analyze article content', async () => {
      const mockAnalysis = {
        summary: 'Test summary',
        sentiment: 'positive',
        sentimentLabel: 'Positive',
        confidence: 0.85,
        entities: [
          { name: 'Test Entity', type: 'PERSON', confidence: 0.9 }
        ]
      };

      mockArticleAnalyzerService.analyzeArticle.mockResolvedValue(mockAnalysis);

      const response = await gqlRequest(ANALYZE_ARTICLE_QUERY, {
        content: 'Test article content',
        title: 'Test Article Title'
      });

      expect(response.status).toBe(200);
      expect(response.body.data.analyzeArticle).toEqual(mockAnalysis);
    });

    test('should handle analysis errors gracefully', async () => {
      mockArticleAnalyzerService.analyzeArticle.mockRejectedValue(
        new Error('Analysis failed')
      );

      const response = await gqlRequest(ANALYZE_ARTICLE_QUERY, {
        content: 'Test article content',
        title: 'Test Article Title'
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('AggregationMeta Query', () => {
    const AGGREGATION_META_QUERY = `
      query GetAggregationMeta {
        aggregationMeta {
          sources
          lastUpdated
          totalArticles
          processingTime
        }
      }
    `;

    test('should return aggregation metadata', async () => {
      mockNewsServiceManager.getTopHeadlines.mockResolvedValue({
        articles: [testUtils.createTestArticle()]
      });

      const response = await gqlRequest(AGGREGATION_META_QUERY);

      expect(response.status).toBe(200);
      expect(response.body.data.aggregationMeta.sources).toEqual(['newsapi', 'gnews', 'guardian']);
      expect(response.body.data.aggregationMeta.lastUpdated).toBeDefined();
      expect(response.body.data.aggregationMeta.totalArticles).toBe(1);
      expect(response.body.data.aggregationMeta.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Mutations', () => {
    const REFRESH_CATEGORY_MUTATION = `
      mutation RefreshCategory($category: String!, $location: String) {
        refreshCategory(category: $category, location: $location) {
          edges {
            node {
              id
              title
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          totalCount
        }
      }
    `;

    test('should refresh category articles', async () => {
      const mockArticles = [
        testUtils.createTestArticle({ id: '1', title: 'Refreshed Article 1' })
      ];

      mockNewsServiceManager.getArticlesByCategory.mockResolvedValue({
        articles: mockArticles,
        errors: null
      });

      const response = await gqlRequest(REFRESH_CATEGORY_MUTATION, {
        category: 'technology',
        location: 'us'
      });

      expect(response.status).toBe(200);
      expect(response.body.data.refreshCategory.edges).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed queries', async () => {
      const response = await gqlRequest(`
        query InvalidQuery {
          nonExistentField
        }
      `);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });

    test('should handle invalid variables', async () => {
      const response = await gqlRequest(`
        query TestQuery($category: String!) {
          newsByCategory(category: $category) {
            edges {
              node {
                id
              }
            }
          }
        }
      `, {
        category: 123 // Invalid type
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should handle concurrent requests', async () => {
      const mockArticles = [testUtils.createTestArticle()];
      mockNewsServiceManager.getArticlesByCategory.mockResolvedValue({
        articles: mockArticles,
        errors: null
      });

      const requests = Array.from({ length: 5 }, () =>
        gqlRequest(`
          query GetNews($category: String!) {
            newsByCategory(category: $category) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        `, { category: 'technology' })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.newsByCategory.edges).toHaveLength(1);
      });
    });
  });
}); 