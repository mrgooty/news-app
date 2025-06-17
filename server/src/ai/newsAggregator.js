const { ChatOpenAI } = require('@langchain/openai');
const { createGraph, StateGraph } = require('@langchain/langgraph');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const config = require('../config/config');
const NewsProcessor = require('./newsProcessor');
const NewsOrchestrator = require('./newsOrchestrator');
const CacheManager = require('./cacheManager');
const TextUtils = require('./textUtils');

/**
 * News Aggregator using LangChain and LangGraph
 * Provides a high-level interface for AI-powered news aggregation
 */
class NewsAggregator {
  constructor() {
    this.aiEnabled = Boolean(config.ai.openaiApiKey);
    if (this.aiEnabled) {
      this.model = new ChatOpenAI({
        openAIApiKey: config.ai.openaiApiKey,
        modelName: config.ai.model,
        temperature: 0.1,
      });

      this.newsProcessor = new NewsProcessor();
      this.newsOrchestrator = new NewsOrchestrator();
      this.textUtils = new TextUtils();
    } else {
      // eslint-disable-next-line no-console
      console.warn('[NewsAggregator] OPENAI_API_KEY not set - AI features disabled');
      this.model = null;
      this.newsProcessor = null;
      this.newsOrchestrator = null;
      this.textUtils = null;
    }
    
    // Initialize cache for processed articles
    this.cache = new CacheManager({
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 1000,
    });
  }

  /**
   * Process a single news article
   * @param {Object} article - The news article to process
   * @returns {Promise<Object>} - The processed article
   */
  async processArticle(article) {
    if (!this.aiEnabled) {
      return article;
    }
    // Generate a cache key based on article URL or title
    const cacheKey = article.url || `title:${article.title}`;
    
    // Try to get from cache or compute if not available
    return this.cache.getOrCompute(cacheKey, async () => {
      return this.newsOrchestrator.processArticle(article);
    });
  }

  /**
   * Process multiple articles in parallel
   * @param {Array} articles - The news articles to process
   * @returns {Promise<Array>} - The processed articles
   */
  async processArticles(articles) {
    if (!articles || articles.length === 0) {
      return [];
    }

    if (!this.aiEnabled) {
      return articles;
    }
    
    // Check which articles are already in cache
    const processedArticles = [];
    const articlesToProcess = [];
    const indices = [];
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const cacheKey = article.url || `title:${article.title}`;
      const cachedArticle = this.cache.get(cacheKey);
      
      if (cachedArticle) {
        processedArticles[i] = cachedArticle;
      } else {
        articlesToProcess.push(article);
        indices.push(i);
      }
    }
    
    // Process articles not in cache
    if (articlesToProcess.length > 0) {
      const newlyProcessed = await this.newsOrchestrator.processBatch(articlesToProcess);
      
      // Cache the newly processed articles and place them in the correct positions
      for (let i = 0; i < newlyProcessed.length; i++) {
        const article = newlyProcessed[i];
        const originalIndex = indices[i];
        const cacheKey = article.url || `title:${article.title}`;
        
        this.cache.set(cacheKey, article);
        processedArticles[originalIndex] = article;
      }
    }
    
    // Filter out any undefined entries (shouldn't happen, but just in case)
    return processedArticles.filter(article => article !== undefined);
  }

  /**
   * Filter articles by quality and relevance
   * @param {Array} articles - The articles to filter
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} - Filtered articles
   */
  async filterArticles(articles, options = {}) {
    const {
      minScore = 5.0,
      category = null,
      excludeSentiments = [],
      requireEntities = [],
    } = options;

    // Process articles if they haven't been processed yet
    const processedArticles = await this.processArticles(articles);

    if (!this.aiEnabled) {
      return processedArticles;
    }
    
    // Apply filters
    return processedArticles.filter(article => {
      // Filter by minimum score
      if (article.finalScore < minScore) {
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
      
      return true;
    });
  }

  /**
   * Rank articles by relevance and quality
   * @param {Array} articles - The articles to rank
   * @param {Object} options - Ranking options
   * @returns {Promise<Array>} - Ranked articles
   */
  async rankArticles(articles, options = {}) {
    const {
      recencyWeight = 0.3,
      scoreWeight = 0.7,
    } = options;

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
    
    // Sort by combined score in descending order
    return articlesWithRecencyScore.sort((a, b) => b.combinedScore - a.combinedScore);
  }

  /**
   * Get top stories across multiple categories
   * @param {Object} articlesByCategory - Map of category to articles
   * @param {number} limit - Maximum number of articles to return
   * @returns {Promise<Array>} - Top stories across categories
   */
  async getTopStories(articlesByCategory, limit = 15) {
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
    // Process all articles by category
    const processedByCategory = {};
    const processingPromises = [];
    
    for (const [category, articles] of Object.entries(articlesByCategory)) {
      processingPromises.push(
        this.processArticles(articles).then(processed => {
          processedByCategory[category] = processed;
        })
      );
    }
    
    await Promise.all(processingPromises);
    
    // Use the orchestrator to aggregate top stories
    const topStories = await this.newsOrchestrator.aggregateTopStories(processedByCategory, limit);
    
    // Ensure diversity of topics
    const diverseStories = await this.ensureTopicDiversity(topStories);
    
    return diverseStories;
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
}

module.exports = NewsAggregator;