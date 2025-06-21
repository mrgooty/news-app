import { jest } from '@jest/globals';
import resolvers from '../../graphql/resolvers.js';
import dataLoader from '../../utils/dataLoader.js';

// Mock dependencies
jest.mock('../../services/newsApiAggregator.js');
jest.mock('../../ai/articleAnalyzerService.js');
jest.mock('../../config/config.js');
jest.mock('../../utils/logger.js', () => () => jest.fn());
jest.mock('../../services/newsServiceManager.js');
jest.mock('../../utils/dataLoader.js');

describe('GraphQL Resolvers', () => {
  let mockNewsApiAggregator;
  let mockArticleAnalyzerService;
  let mockConfig;
  let mockNewsServiceManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock newsApiAggregator
    mockNewsApiAggregator = {
      fetchNewsByCategory: jest.fn(),
      searchNewsByKeyword: jest.fn(),
      fetchNewsByCategories: jest.fn()
    };

    // Mock articleAnalyzerService
    mockArticleAnalyzerService = {
      analyzeArticle: jest.fn()
    };

    // Mock config
    mockConfig = {
      appData: {
        categories: [
          { id: 'technology', name: 'Technology', description: 'Tech news' },
          { id: 'business', name: 'Business', description: 'Business news' }
        ],
        locations: [
          { id: 'us', name: 'United States', code: 'us' },
          { id: 'gb', name: 'United Kingdom', code: 'gb' }
        ]
      }
    };

    // Mock newsServiceManager
    mockNewsServiceManager = {
      getArticlesByCategory: jest.fn(),
      searchArticles: jest.fn(),
      getTopHeadlines: jest.fn()
    };

    // Setup mocks
    jest.doMock('../../services/newsApiAggregator.js', () => mockNewsApiAggregator);
    jest.doMock('../../ai/articleAnalyzerService.js', () => ({
      default: mockArticleAnalyzerService
    }));
    jest.doMock('../../config/config.js', () => ({
      default: mockConfig
    }));
    jest.doMock('../../services/newsServiceManager.js', () => ({
      default: mockNewsServiceManager
    }));
  });

  describe('categories', () => {
    test('should return categories from config', () => {
      const result = resolvers.Query.categories();
      
      expect(result).toEqual(mockConfig.appData.categories);
    });
  });

  describe('locations', () => {
    test('should return locations from config', () => {
      const result = resolvers.Query.locations();
      
      expect(result).toEqual(mockConfig.appData.locations);
    });
  });

  describe('newsByCategory', () => {
    const mockConnection = {
      edges: [
        {
          node: testUtils.createTestArticle(),
          cursor: 'cursor1'
        }
      ],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'cursor1',
        endCursor: 'cursor1'
      },
      totalCount: 1
    };

    test('should fetch news by category successfully', async () => {
      mockNewsApiAggregator.fetchNewsByCategory.mockResolvedValue(mockConnection);

      const result = await resolvers.Query.newsByCategory(
        null,
        { category: 'technology', location: 'us', first: 10, after: null }
      );

      expect(result).toEqual(mockConnection);
      expect(mockNewsApiAggregator.fetchNewsByCategory).toHaveBeenCalledWith(
        'technology',
        'us',
        10,
        0
      );
    });

    test('should handle errors gracefully', async () => {
      const error = new Error('API Error');
      mockNewsApiAggregator.fetchNewsByCategory.mockRejectedValue(error);

      const result = await resolvers.Query.newsByCategory(
        null,
        { category: 'technology', location: 'us', first: 10, after: null }
      );

      expect(result).toEqual({
        articles: [],
        errors: [{ source: 'GraphQL', message: 'API Error' }]
      });
    });

    test('should handle missing parameters', async () => {
      mockNewsApiAggregator.fetchNewsByCategory.mockResolvedValue(mockConnection);

      const result = await resolvers.Query.newsByCategory(
        null,
        { category: 'technology' }
      );

      expect(mockNewsApiAggregator.fetchNewsByCategory).toHaveBeenCalledWith(
        'technology',
        undefined,
        20, // default limit
        0
      );
    });
  });

  describe('topStoriesAcrossCategories', () => {
    const mockConnection = {
      edges: [
        {
          node: testUtils.createTestArticle(),
          cursor: 'cursor1'
        }
      ],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'cursor1',
        endCursor: 'cursor1'
      },
      totalCount: 1
    };

    test('should fetch top stories across categories successfully', async () => {
      mockNewsApiAggregator.fetchNewsByCategories.mockResolvedValue(mockConnection);

      const result = await resolvers.Query.topStoriesAcrossCategories(
        null,
        { categories: ['technology', 'business'], location: 'us', first: 10, after: null }
      );

      expect(result).toEqual(mockConnection);
      expect(mockNewsApiAggregator.fetchNewsByCategories).toHaveBeenCalledWith(
        ['technology', 'business'],
        'us',
        10,
        0
      );
    });

    test('should handle errors gracefully', async () => {
      const error = new Error('API Error');
      mockNewsApiAggregator.fetchNewsByCategories.mockRejectedValue(error);

      const result = await resolvers.Query.topStoriesAcrossCategories(
        null,
        { categories: ['technology'], location: 'us', first: 10, after: null }
      );

      expect(result).toEqual({
        articles: [],
        errors: [{ source: 'GraphQL', message: 'API Error' }]
      });
    });
  });

  describe('searchNews', () => {
    const mockConnection = {
      edges: [
        {
          node: testUtils.createTestArticle(),
          cursor: 'cursor1'
        }
      ],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'cursor1',
        endCursor: 'cursor1'
      },
      totalCount: 1
    };

    test('should search news successfully', async () => {
      mockNewsApiAggregator.searchNewsByKeyword.mockResolvedValue(mockConnection);

      const result = await resolvers.Query.searchNews(
        null,
        { keyword: 'test query', location: 'us', first: 10, after: null }
      );

      expect(result).toEqual(mockConnection);
      expect(mockNewsApiAggregator.searchNewsByKeyword).toHaveBeenCalledWith(
        'test query',
        'us',
        10,
        0
      );
    });

    test('should handle search errors gracefully', async () => {
      const error = new Error('Search failed');
      mockNewsApiAggregator.searchNewsByKeyword.mockRejectedValue(error);

      const result = await resolvers.Query.searchNews(
        null,
        { keyword: 'test query', location: 'us', first: 10, after: null }
      );

      expect(result).toEqual({
        articles: [],
        errors: [{ source: 'GraphQL', message: 'Search failed' }]
      });
    });
  });

  describe('analyzeArticle', () => {
    const mockAnalysis = {
      summary: 'Test summary',
      sentiment: 'positive',
      sentimentLabel: 'Positive',
      confidence: 0.85,
      entities: [
        { name: 'Test Entity', type: 'PERSON', confidence: 0.9 }
      ]
    };

    test('should analyze article successfully', async () => {
      mockArticleAnalyzerService.analyzeArticle.mockResolvedValue(mockAnalysis);

      const result = await resolvers.Query.analyzeArticle(
        null,
        { content: 'Test content', title: 'Test Title' }
      );

      expect(result).toEqual(mockAnalysis);
    });

    test('should handle analysis errors gracefully', async () => {
      const error = new Error('Analysis failed');
      mockArticleAnalyzerService.analyzeArticle.mockRejectedValue(error);

      await expect(
        resolvers.Query.analyzeArticle(null, { content: 'Test content', title: 'Test Title' })
      ).rejects.toThrow('Failed to analyze article.');
    });
  });

  describe('aggregationMeta', () => {
    test('should return aggregation metadata', async () => {
      const result = await resolvers.Query.aggregationMeta();

      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('lastUpdated');
      expect(result).toHaveProperty('totalArticles');
      expect(result).toHaveProperty('processingTime');
      expect(Array.isArray(result.sources)).toBe(true);
      expect(typeof result.processingTime).toBe('number');
    });
  });
}); 