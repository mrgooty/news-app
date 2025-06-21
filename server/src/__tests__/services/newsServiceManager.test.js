import { jest } from '@jest/globals';
import newsServiceManager from '../../services/newsServiceManager.js';
import config from '../../config/config.js';

// Mock dependencies
jest.mock('../../config/config.js');
jest.mock('../../utils/logger.js', () => () => jest.fn());

describe('NewsServiceManager', () => {
  let mockNewsApiService;
  let mockGNewsApiService;
  let mockGuardianApiService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock config
    config.newsApis = {
      newsapi: { apiKey: 'test-newsapi-key' },
      gnews: { apiKey: 'test-gnews-key' },
      guardian: { apiKey: 'test-guardian-key' }
    };

    // Mock service instances
    mockNewsApiService = {
      isAvailable: jest.fn().mockResolvedValue(true),
      getArticlesByCategory: jest.fn(),
      searchArticles: jest.fn(),
      getTopHeadlines: jest.fn()
    };

    mockGNewsApiService = {
      isAvailable: jest.fn().mockResolvedValue(true),
      getArticlesByCategory: jest.fn(),
      searchArticles: jest.fn(),
      getTopHeadlines: jest.fn()
    };

    mockGuardianApiService = {
      isAvailable: jest.fn().mockResolvedValue(true),
      getArticlesByCategory: jest.fn(),
      searchArticles: jest.fn(),
      getTopHeadlines: jest.fn()
    };

    // Mock service constructors
    jest.doMock('../../services/newsApiService.js', () => ({
      default: jest.fn().mockImplementation(() => mockNewsApiService)
    }));

    jest.doMock('../../services/gnewsApiService.js', () => ({
      default: jest.fn().mockImplementation(() => mockGNewsApiService)
    }));

    jest.doMock('../../services/guardianApiService.js', () => ({
      default: jest.fn().mockImplementation(() => mockGuardianApiService)
    }));
  });

  describe('Initialization', () => {
    test('should initialize with all services', () => {
      expect(newsServiceManager.services).toHaveProperty('newsapi');
      expect(newsServiceManager.services).toHaveProperty('gnews');
      expect(newsServiceManager.services).toHaveProperty('guardian');
    });

    test('should have correct service order', () => {
      expect(newsServiceManager.serviceOrder).toEqual(['newsapi', 'gnews', 'guardian']);
    });
  });

  describe('checkServicesAvailability', () => {
    test('should mark services as available when API keys are present', async () => {
      await newsServiceManager.checkServicesAvailability();
      
      expect(newsServiceManager.availableServices.newsapi).toBe(true);
      expect(newsServiceManager.availableServices.gnews).toBe(true);
      expect(newsServiceManager.availableServices.guardian).toBe(true);
    });

    test('should mark services as unavailable when API keys are missing', async () => {
      config.newsApis.newsapi.apiKey = null;
      
      await newsServiceManager.checkServicesAvailability();
      
      expect(newsServiceManager.availableServices.newsapi).toBe(false);
    });

    test('should handle service availability check errors gracefully', async () => {
      mockNewsApiService.isAvailable.mockRejectedValue(new Error('Network error'));
      
      await newsServiceManager.checkServicesAvailability();
      
      expect(newsServiceManager.availableServices.newsapi).toBe(true); // Should remain true due to error handling
    });
  });

  describe('getAvailableServices', () => {
    test('should return available services in order', () => {
      newsServiceManager.availableServices = {
        newsapi: true,
        gnews: false,
        guardian: true
      };

      const available = newsServiceManager.getAvailableServices();
      expect(available).toEqual(['newsapi', 'guardian']);
    });

    test('should return all services when none are marked available', () => {
      newsServiceManager.availableServices = {
        newsapi: false,
        gnews: false,
        guardian: false
      };

      const available = newsServiceManager.getAvailableServices();
      expect(available).toEqual(['newsapi', 'gnews', 'guardian']);
    });

    test('should respect preferred service order', () => {
      newsServiceManager.availableServices = {
        newsapi: true,
        gnews: true,
        guardian: true
      };

      const available = newsServiceManager.getAvailableServices(['guardian', 'newsapi']);
      expect(available).toEqual(['guardian', 'newsapi']);
    });
  });

  describe('getArticlesByCategory', () => {
    const testArticles = [
      testUtils.createTestArticle({ id: '1', title: 'Article 1' }),
      testUtils.createTestArticle({ id: '2', title: 'Article 2' })
    ];

    test('should fetch articles from available services', async () => {
      mockNewsApiService.getArticlesByCategory.mockResolvedValue(testArticles);
      
      const result = await newsServiceManager.getArticlesByCategory('technology', 'us', 10, 0);
      
      expect(result.articles).toHaveLength(2);
      expect(result.errors).toBeNull();
      expect(mockNewsApiService.getArticlesByCategory).toHaveBeenCalledWith('technology', 'us', 10, 0);
    });

    test('should handle service failures gracefully', async () => {
      mockNewsApiService.getArticlesByCategory.mockRejectedValue(new Error('API Error'));
      
      const result = await newsServiceManager.getArticlesByCategory('technology', 'us', 10, 0);
      
      expect(result.articles).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('newsapi');
      expect(result.errors[0].message).toBe('API Error');
    });

    test('should deduplicate articles by URL', async () => {
      const duplicateArticles = [
        testUtils.createTestArticle({ id: '1', url: 'https://example.com/1' }),
        testUtils.createTestArticle({ id: '2', url: 'https://example.com/1' }), // Same URL
        testUtils.createTestArticle({ id: '3', url: 'https://example.com/2' })
      ];

      mockNewsApiService.getArticlesByCategory.mockResolvedValue(duplicateArticles);
      
      const result = await newsServiceManager.getArticlesByCategory('technology', 'us', 10, 0);
      
      expect(result.articles).toHaveLength(2); // Should deduplicate
    });

    test('should respect limit parameter', async () => {
      const manyArticles = Array.from({ length: 20 }, (_, i) => 
        testUtils.createTestArticle({ id: `${i}`, title: `Article ${i}` })
      );

      mockNewsApiService.getArticlesByCategory.mockResolvedValue(manyArticles);
      
      const result = await newsServiceManager.getArticlesByCategory('technology', 'us', 5, 0);
      
      expect(result.articles).toHaveLength(5);
    });
  });

  describe('searchArticles', () => {
    const testArticles = [
      testUtils.createTestArticle({ id: '1', title: 'Search Result 1' }),
      testUtils.createTestArticle({ id: '2', title: 'Search Result 2' })
    ];

    test('should search articles from available services', async () => {
      mockNewsApiService.searchArticles.mockResolvedValue(testArticles);
      
      const result = await newsServiceManager.searchArticles('test query', 'technology', 'us', 10, 0);
      
      expect(result.articles).toHaveLength(2);
      expect(result.errors).toBeNull();
      expect(mockNewsApiService.searchArticles).toHaveBeenCalledWith('test query', 'technology', 'us', 10, 0);
    });

    test('should handle search failures gracefully', async () => {
      mockNewsApiService.searchArticles.mockRejectedValue(new Error('Search failed'));
      
      const result = await newsServiceManager.searchArticles('test query', 'technology', 'us', 10, 0);
      
      expect(result.articles).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('newsapi');
    });
  });

  describe('getTopHeadlines', () => {
    const testArticles = [
      testUtils.createTestArticle({ id: '1', title: 'Top Headline 1' }),
      testUtils.createTestArticle({ id: '2', title: 'Top Headline 2' })
    ];

    test('should fetch top headlines from available services', async () => {
      mockNewsApiService.getTopHeadlines.mockResolvedValue(testArticles);
      
      const result = await newsServiceManager.getTopHeadlines('technology', 'us', 10);
      
      expect(result.articles).toHaveLength(2);
      expect(result.errors).toBeNull();
      expect(mockNewsApiService.getTopHeadlines).toHaveBeenCalledWith('technology', 'us', 10);
    });

    test('should handle top headlines failures gracefully', async () => {
      mockNewsApiService.getTopHeadlines.mockRejectedValue(new Error('Headlines failed'));
      
      const result = await newsServiceManager.getTopHeadlines('technology', 'us', 10);
      
      expect(result.articles).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('newsapi');
    });
  });

  describe('Utility Methods', () => {
    test('getCategories should return categories from config', () => {
      const categories = newsServiceManager.getCategories();
      expect(Array.isArray(categories)).toBe(true);
    });

    test('getLocations should return locations from config', () => {
      const locations = newsServiceManager.getLocations();
      expect(Array.isArray(locations)).toBe(true);
    });

    test('getSources should return source information', () => {
      const sources = newsServiceManager.getSources();
      expect(Array.isArray(sources)).toBe(true);
      expect(sources[0]).toHaveProperty('id');
      expect(sources[0]).toHaveProperty('name');
      expect(sources[0]).toHaveProperty('available');
    });

    test('deduplicateArticles should remove duplicates by URL', () => {
      const articles = [
        testUtils.createTestArticle({ url: 'https://example.com/1' }),
        testUtils.createTestArticle({ url: 'https://example.com/1' }), // Duplicate
        testUtils.createTestArticle({ url: 'https://example.com/2' })
      ];

      const deduplicated = newsServiceManager.deduplicateArticles(articles);
      expect(deduplicated).toHaveLength(2);
    });
  });
}); 