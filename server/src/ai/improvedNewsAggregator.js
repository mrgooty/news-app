const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const config = require('../config/config');
const ImprovedNewsProcessor = require('./improvedNewsProcessor');
const ImprovedNewsOrchestrator = require('./improvedNewsOrchestrator');
const EnhancedCacheManager = require('./enhancedCacheManager');
const TextUtils = require('./textUtils');
const createLogger = require('../utils/logger');
const log = createLogger('ImprovedNewsAggregator');

/**
 * Improved News Aggregator using LangChain and LangGraph
 * Provides a high-level interface for AI-powered news aggregation
 * with enhanced performance, caching, and error handling
 */
class ImprovedNewsAggregator {
  constructor() {
    this.aiEnabled = Boolean(config.ai.openaiApiKey);
    
    if (this.aiEnabled) {
      this.model = new ChatOpenAI({
        openAIApiKey: config.ai.openaiApiKey,
        modelName: config.ai.model,
        temperature: config.ai.temperature || 0.1,
        maxTokens: config.ai.maxTokens,
        timeout: config.ai.requestTimeout,
      });

      this.newsProcessor = new ImprovedNewsProcessor();
      this.newsOrchestrator = new ImprovedNewsOrchestrator();
      this.textUtils = new TextUtils();
    } else {
      log('OPENAI_API_KEY not set - AI features disabled');
      this.model = null;
      this.newsProcessor = null;
      this.newsOrchestrator = null;
      this.textUtils = null;
    }
    
    // Initialize cache for processed articles
    this.cache = new EnhancedCacheManager({
      ttl: config.cache.memory.ttl || 30 * 60 * 1000, // 30 minutes
      maxSize: config.cache.memory.maxSize || 1000,
    });
    
    // Performance metrics
    this.metrics = {
      processArticleTime: [],
      processArticlesTime: [],
      filterArticlesTime: [],
      rankArticlesTime: [],
      getTopStoriesTime: [],
      requestCount: 0,
    };
  }

  /**
   * Process a single news article
   * @param {Object} article - The news article to process
   * @returns {Promise<Object>} - The processed article
   */
  async processArticle(article) {
    const startTime = Date.now();
    this.metrics.requestCount++;
    
    if (!this.aiEnabled) {
      return article;
    }
    
    try {
      // Generate a cache key based on article URL or title
      const cacheKey = article.url || `title:${article.title}`;
      
      // Try to get from cache or compute if not available
      const result = await this.cache.getOrCompute(
        cacheKey,
        async () => this.newsOrchestrator.processArticle(article),
        null,
        'articles'
      );
      
      const endTime = Date.now();
      this.metrics.processArticleTime.push(endTime - startTime);
      
      return result;
    } catch (error) {
      log(`Error processing article: ${error.message}`);
      
      const endTime = Date.now();
      this.metrics.processArticleTime.push(endTime - startTime);
      
      // Return original article if processing fails
      return article;
    }
  }

  /**
   * Process multiple articles in parallel
   * @param {Array} articles - The news articles to process
   * @returns {Promise<Array>} - The processed articles
   */
  async processArticles(articles) {
    const startTime = Date.now();
    this.metrics.requestCount++;
    
    if (!articles || articles.length === 0) {
      return [];
    }

    if (!this.aiEnabled) {
      return articles;
    }
    
    try {
      const processedArticles = await this.newsOrchestrator.processBatch(articles);
      
      const endTime = Date.now();
      this.metrics.processArticlesTime.push(endTime - startTime);
      
      return processedArticles;
    } catch (error) {
      log(`Error in processArticles: ${error.message}`);
      
      const endTime = Date.now();
      this.metrics.processArticlesTime.push(endTime - startTime);
      
      // Return original articles if processing fails
      return articles;
    }
  }

  /**
   * Filter articles by quality and relevance
   * @param {Array} articles - The articles to filter
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} - Filtered articles
   */
  async filterArticles(articles, options = {}) {
    const startTime = Date.now();
    this.metrics.requestCount++;
    
    const {
      minScore = 5.0,
      category = null,
      excludeSentiments = [],
      requireEntities = [],
      excludeKeywords = [],
      includeKeywords = [],
      minPublishedDate = null,
    } = options;

    try {
      // Process articles if they haven't been processed yet
      const processedArticles = await this.processArticles(articles);

      if (!this.aiEnabled) {
        return processedArticles;
      }
      
      // Apply filters
      const filteredArticles = processedArticles.filter(article => {
        // Filter by minimum score
        if (article.finalScore !== undefined && article.finalScore < minScore) {
          return false;
        }
        
        // Filter by category if specified
        if (category && article.category && 
            article.category.toLowerCase() !== category.toLowerCase()) {
          return false;
        }
        
        // Filter by sentiment if specified
        if (excludeSentiments.length > 0 && 
            article.sentiment && 
            excludeSentiments.includes(article.sentiment)) {
          return false;
        }
        
        // Filter by required entities if specified
        if (requireEntities.length > 0 && article.entities) {
          const hasRequiredEntity = requireEntities.some(entity => 
            article.entities.some(e => e.toLowerCase().includes(entity.toLowerCase()))
          );
          if (!hasRequiredEntity) {
            return false;
          }
        }
        
        // Filter by excluded keywords
        if (excludeKeywords.length > 0) {
          const articleText = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
          const hasExcludedKeyword = excludeKeywords.some(keyword => 
            articleText.includes(keyword.toLowerCase())
          );
          if (hasExcludedKeyword) {
            return false;
          }
        }
        
        // Filter by included keywords
        if (includeKeywords.length > 0) {
          const articleText = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
          const hasIncludedKeyword = includeKeywords.some(keyword => 
            articleText.includes(keyword.toLowerCase())
          );
          if (!hasIncludedKeyword) {
            return false;
          }
        }
        
        // Filter by minimum published date
        if (minPublishedDate && article.publishedAt) {
          const publishDate = new Date(article.publishedAt);
          const minDate = new Date(minPublishedDate);
          if (publishDate < minDate) {
            return false;
          }
        }
        
        return true;
      });
      
      const endTime = Date.now();
      this.metrics.filterArticlesTime.push(endTime - startTime);
      
      return filteredArticles;
    } catch (error) {
      log(`Error in filterArticles: ${error.message}`);
      
      const endTime = Date.now();
      this.metrics.filterArticlesTime.push(endTime - startTime);
      
      // Return original articles if filtering fails
      return articles;
    }
  }

  /**
   * Rank articles by relevance and quality
   * @param {Array} articles - The articles to rank
   * @param {Object} options - Ranking options
   * @returns {Promise<Array>} - Ranked articles
   */
  async rankArticles(articles, options = {}) {
    const startTime = Date.now();
    this.metrics.requestCount++;
    
    const {
      recencyWeight = 0.3,
      scoreWeight = 0.7,
      diversityBoost = 0.1,
    } = options;

    try {
      // Process articles if they haven't been processed yet
      const processedArticles = await this.processArticles(articles);

      if (!this.aiEnabled) {
        return processedArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      }
      
      // Calculate recency score (0-10) based on publishedAt date
      const now = new Date();
      const articlesWithRecencyScore = processedArticles.map(article => {
        let recencyScore = 5; // Default middle score
        
        if (article.publishedAt) {
          const publishDate = new Date(article.publishedAt);
          const hoursDiff = (now - publishDate) / (1000 * 60 * 60);
          
          // Newer articles get higher scores
          // 0-6 hours: 10-8
          // 6-24 hours: 8-6
          // 1-3 days: 6-4
          // 3-7 days: 4-2
          // >7 days: 1
          if (hoursDiff < 6) {
            recencyScore = 10 - (hoursDiff / 3);
          } else if (hoursDiff < 24) {
            recencyScore = 8 - ((hoursDiff - 6) / 9);
          } else if (hoursDiff < 72) {
            recencyScore = 6 - ((hoursDiff - 24) / 24);
          } else if (hoursDiff < 168) {
            recencyScore = 4 - ((hoursDiff - 72) / 48);
          } else {
            recencyScore = 1;
          }
        }
        
        // Calculate combined score
        const finalScore = article.finalScore || 5;
        const combinedScore = (recencyScore * recencyWeight) + (finalScore * scoreWeight);
        
        return {
          ...article,
          recencyScore,
          combinedScore,
        };
      });
      
      // Apply diversity boost - slightly boost articles with unique categories/topics
      if (diversityBoost > 0) {
        const categoryCounts = {};
        const topicCounts = {};
        
        // Count occurrences of each category and topic
        articlesWithRecencyScore.forEach(article => {
          if (article.category) {
            categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
          }
          
          if (article.topics && Array.isArray(article.topics)) {
            article.topics.forEach(topic => {
              topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
          }
        });
        
        // Apply diversity boost
        articlesWithRecencyScore.forEach(article => {
          let diversityScore = 0;
          
          // Boost for rare categories
          if (article.category && categoryCounts[article.category]) {
            diversityScore += 1 / categoryCounts[article.category];
          }
          
          // Boost for rare topics
          if (article.topics && Array.isArray(article.topics)) {
            let topicDiversity = 0;
            article.topics.forEach(topic => {
              if (topicCounts[topic]) {
                topicDiversity += 1 / topicCounts[topic];
              }
            });
            diversityScore += topicDiversity / (article.topics.length || 1);
          }
          
          // Apply diversity boost to combined score
          article.combinedScore += diversityScore * diversityBoost;
        });
      }
      
      // Sort by combined score in descending order
      const rankedArticles = articlesWithRecencyScore.sort((a, b) => b.combinedScore - a.combinedScore);
      
      const endTime = Date.now();
      this.metrics.rankArticlesTime.push(endTime - startTime);
      
      return rankedArticles;
    } catch (error) {
      log(`Error in rankArticles: ${error.message}`);
      
      const endTime = Date.now();
      this.metrics.rankArticlesTime.push(endTime - startTime);
      
      // Sort by date if ranking fails
      return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
  }

  /**
   * Get top stories across multiple categories
   * @param {Object} articlesByCategory - Map of category to articles
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Top stories across categories
   */
  async getTopStories(articlesByCategory, limit = 15) {
    const startTime = Date.now();
    this.metrics.requestCount++;
    
    if (!this.aiEnabled) {
      const all = Object.values(articlesByCategory).flat();
      const seen = new Set();
      const unique = [];
      for (const art of all) {
        const key = art.url || art.title;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(art);
        }
      }
      unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      return unique.slice(0, limit);
    }
    
    try {
      // Use the orchestrator to aggregate top stories
      const topStories = await this.newsOrchestrator.aggregateTopStories(articlesByCategory, limit);
      
      // Ensure diversity of topics
      const diverseStories = await this.ensureTopicDiversity(topStories);
      
      const endTime = Date.now();
      this.metrics.getTopStoriesTime.push(endTime - startTime);
      
      return diverseStories;
    } catch (error) {
      log(`Error in getTopStories: ${error.message}`);
      
      const endTime = Date.now();
      this.metrics.getTopStoriesTime.push(endTime - startTime);
      
      // Fallback to simple aggregation
      const all = Object.values(articlesByCategory).flat();
      const seen = new Set();
      const unique = [];
      for (const art of all) {
        const key = art.url || art.title;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(art);
        }
      }
      unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      return unique.slice(0, limit);
    }
  }

  /**
   * Ensure diversity of topics in the top stories
   * @param {Array} articles - Articles to diversify
   * @returns {Promise<Array>} - Diversified articles
   */
  async ensureTopicDiversity(articles) {
    if (!articles || articles.length <= 1) {
      return articles;
    }

    if (!this.aiEnabled || !this.textUtils) {
      return articles;
    }
    
    try {
      // Cluster articles by similarity
      const clusters = await this.textUtils.clusterArticles(articles);
      
      // Take the best article from each cluster
      const diverseArticles = clusters.map(cluster => {
        // Sort cluster by finalScore and take the best one
        return cluster.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))[0];
      });
      
      // Sort by finalScore
      diverseArticles.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
      
      return diverseArticles;
    } catch (error) {
      log(`Error in ensureTopicDiversity: ${error.message}`);
      return articles;
    }
  }

  /**
   * Process and aggregate news from multiple sources and categories
   * @param {Object} options - Options for news aggregation
   * @returns {Promise<Array>} - Aggregated news articles
   */
  async aggregateNews(options = {}) {
    const {
      categories = ['general'],
      limit = 15,
      sources = null,
      location = null,
      minScore = 5.0,
    } = options;
    
    // This method would be called from the GraphQL resolvers
    // It would use the NewsServiceManager to fetch articles from different sources
    // Then process, filter, rank, and aggregate them
    
    // The actual implementation would depend on how the NewsServiceManager is integrated
    // For now, we'll return a placeholder
    return [];
  }

  /**
   * Get performance metrics
   * @returns {Object} - Performance metrics
   */
  getPerformanceMetrics() {
    const calculateAverage = (arr) => {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    };
    
    return {
      averageProcessArticleTime: calculateAverage(this.metrics.processArticleTime),
      averageProcessArticlesTime: calculateAverage(this.metrics.processArticlesTime),
      averageFilterArticlesTime: calculateAverage(this.metrics.filterArticlesTime),
      averageRankArticlesTime: calculateAverage(this.metrics.rankArticlesTime),
      averageGetTopStoriesTime: calculateAverage(this.metrics.getTopStoriesTime),
      totalRequestCount: this.metrics.requestCount,
      cacheStats: this.cache.getStats(),
      apiUsage: this.newsProcessor ? this.newsProcessor.getApiUsage() : null,
      orchestratorStats: this.newsOrchestrator ? {
        cacheStats: this.newsOrchestrator.getCacheStats(),
        apiUsage: this.newsOrchestrator.getApiUsage(),
      } : null,
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      processArticleTime: [],
      processArticlesTime: [],
      filterArticlesTime: [],
      rankArticlesTime: [],
      getTopStoriesTime: [],
      requestCount: 0,
    };
    
    if (this.newsProcessor) {
      this.newsProcessor.resetApiUsage();
    }
    
    if (this.newsOrchestrator) {
      this.newsOrchestrator.resetStats();
    }
    
    this.cache.resetStats();
  }
}

module.exports = ImprovedNewsAggregator;