import { StateGraph } from '@langchain/langgraph';
import ImprovedNewsProcessor from './improvedNewsProcessor.js';
import EnhancedCacheManager from './enhancedCacheManager.js';
import config from '../config/config.js';
import createLogger from '../utils/logger.js';

const logger = createLogger('ImprovedNewsOrchestrator');

/**
 * Improved News Orchestrator using LangGraph
 * Handles the orchestration of news processing, ranking, and aggregation
 * with enhanced performance and error handling
 */
class ImprovedNewsOrchestrator {
  constructor() {
    this.newsProcessor = new ImprovedNewsProcessor();
    this.cache = new EnhancedCacheManager();
    
    // Processing options
    this.options = {
      batchSize: 5, // Process articles in batches of 5
      parallelism: 3, // Number of parallel processing operations
      retryAttempts: 2, // Number of retry attempts for failed operations
      retryDelay: 1000, // Delay between retries in milliseconds
    };
  }

  /**
   * Create a graph for processing a single news article
   * @returns {Object} - Compiled LangGraph workflow
   */
  createArticleProcessingGraph() {
    // Define the state shape
    const graphState = {
      article: { value: null },
      processedData: { value: null, default: () => ({}) },
      error: { value: null },
      processingSteps: {
        value: null,
        default: () => ({
          summarize: false,
          categorize: false,
          extractInfo: false,
          calculateScore: false,
        }),
      },
    };

    // Create the graph
    const builder = new StateGraph({ channels: graphState });

    // Define the nodes
    builder.addNode("summarize", async (state) => {
      try {
        // Skip if disabled in config
        if (!config.ai.features.summarization) {
          return {
            processingSteps: { ...state.processingSteps, summarize: true },
          };
        }
        
        // Get from cache or compute
        const cacheKey = `summary:${state.article.url || state.article.title}`;
        const summary = await this.cache.getOrCompute(
          cacheKey,
          async () => this.newsProcessor.summarizeArticle(state.article),
          null,
          'summary'
        );
        
        return {
          processedData: { ...state.processedData, summary },
          processingSteps: { ...state.processingSteps, summarize: true },
        };
      } catch (error) {
        logger(`Error in summarize: ${error.message}`);
        return {
          error: `Error in summarize: ${error.message}`,
          processingSteps: { ...state.processingSteps, summarize: true },
        };
      }
    });

    builder.addNode("categorize", this.createCategorizeNode());
    builder.addNode("extractInfo", this.createExtractInfoNode());
    builder.addNode("calculateScore", this.createCalculateScoreNode());
    
    // Define the flow
    builder.setEntryPoint("summarize");
    
    // Edges define the sequence of operations
    builder.addEdge("summarize", "categorize");
    builder.addEdge("categorize", "extractInfo");
    builder.addEdge("extractInfo", "calculateScore");

    // The graph is finished, and we set the finish point
    builder.setFinishPoint("calculateScore");

    return builder.compile();
  }

  /**
   * Helper method to create the categorization node
   * This structure helps keep the graph definition clean
   */
  createCategorizeNode() {
    return async (state) => {
      // Continue even if previous step had an error
      try {
        // Skip if disabled in config
        if (!config.ai.features.categorization) {
          return {
            processingSteps: { ...state.processingSteps, categorize: true },
          };
        }
        
        // Get from cache or compute
        const cacheKey = `category:${state.article.url || state.article.title}`;
        const category = await this.cache.getOrCompute(
          cacheKey,
          async () => this.newsProcessor.categorizeArticle(state.article),
          null,
          'category'
        );
        
        return {
          processedData: { ...state.processedData, category },
          processingSteps: { ...state.processingSteps, categorize: true },
        };
      } catch (error) {
        logger(`Error in categorize: ${error.message}`);
        return {
          error: state.error || `Error in categorize: ${error.message}`,
          processingSteps: { ...state.processingSteps, categorize: true },
        };
      }
    };
  }

  /**
   * Helper method to create the info extraction node
   */
  createExtractInfoNode() {
    return async (state) => {
      // Continue even if previous steps had errors
      try {
        // Skip if disabled in config
        if (!config.ai.features.entityExtraction && !config.ai.features.sentimentAnalysis) {
          return {
            processingSteps: { ...state.processingSteps, extractInfo: true },
          };
        }
        
        // Get from cache or compute
        const cacheKey = `info:${state.article.url || state.article.title}`;
        const keyInfo = await this.cache.getOrCompute(
          cacheKey,
          async () => this.newsProcessor.extractKeyInformation(state.article),
          null,
          'entities'
        );
        
        return {
          processedData: {
            ...state.processedData,
            entities: keyInfo.entities,
            locations: keyInfo.locations,
            topics: keyInfo.topics,
            sentiment: keyInfo.sentiment,
            importance: keyInfo.importance,
          },
          processingSteps: { ...state.processingSteps, extractInfo: true },
        };
      } catch (error) {
        logger(`Error in extractInfo: ${error.message}`);
        return {
          error: state.error || `Error in extractInfo: ${error.message}`,
          processingSteps: { ...state.processingSteps, extractInfo: true },
        };
      }
    };
  }

  /**
   * Helper method to create the score calculation node
   */
  createCalculateScoreNode() {
    return async (state) => {
      // Continue even if previous steps had errors
      try {
        // Skip if disabled in config
        if (!config.ai.features.relevanceScoring) {
          return {
            processingSteps: { ...state.processingSteps, calculateScore: true },
          };
        }
        
        const category = state.processedData.category || state.article.category || 'general';
        
        // Get from cache or compute
        const cacheKey = `relevance:${state.article.url || state.article.title}:${category}`;
        const relevanceScore = await this.cache.getOrCompute(
          cacheKey,
          async () => this.newsProcessor.calculateRelevanceScore(state.article, category),
          null,
          'relevance'
        );
        
        // Calculate a final score that combines importance and relevance
        const importanceWeight = 0.4;
        const relevanceWeight = 0.6;
        const importance = state.processedData.importance || 5;
        const finalScore = (
          (importance * importanceWeight) + 
          (relevanceScore * relevanceWeight / 10)
        );
        
        return {
          processedData: {
            ...state.processedData,
            relevanceScore,
            finalScore,
          },
          processingSteps: { ...state.processingSteps, calculateScore: true },
        };
      } catch (error) {
        logger(`Error in calculateScore: ${error.message}`);
        return {
          error: state.error || `Error in calculateScore: ${error.message}`,
          processingSteps: { ...state.processingSteps, calculateScore: true },
        };
      }
    };
  }

  /**
   * Process a single news article through the graph
   * @param {Object} article - The news article to process
   * @returns {Promise<Object>} - The processed article
   */
  async processArticle(article) {
    // Skip processing if article is missing essential data
    if (!article || (!article.title && !article.url)) {
      logger('Warning: Skipping article processing due to missing data');
      return article;
    }
    
    try {
      const graph = this.createArticleProcessingGraph();
      const result = await graph.invoke({ 
        article, 
        processedData: {}, 
        error: null,
        processingSteps: {
          summarize: false,
          categorize: false,
          extractInfo: false,
          calculateScore: false,
        },
      });
      
      return result.article;
    } catch (error) {
      logger(`Error processing article: ${error.message}`);
      return {
        ...article,
        processingError: error.message,
      };
    }
  }

  /**
   * Process articles in batches to avoid overwhelming the API
   * @param {Array} articles - The articles to process
   * @returns {Promise<Array>} - The processed articles
   */
  async processBatchWithThrottling(articles) {
    if (!articles || articles.length === 0) {
      return [];
    }
    
    const results = [];
    const batches = [];
    
    // Split articles into batches
    for (let i = 0; i < articles.length; i += this.options.batchSize) {
      batches.push(articles.slice(i, i + this.options.batchSize));
    }
    
    // Process batches sequentially, but articles within batch in parallel
    for (const batch of batches) {
      const batchPromises = batch.map(article => this.processArticle(article));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return results;
  }

  /**
   * Process and rank a batch of articles
   * @param {Array} articles - The news articles to process
   * @returns {Promise<Array>} - The processed and ranked articles
   */
  async processBatch(articles) {
    if (!articles || articles.length === 0) {
      return [];
    }
    
    try {
      // Check which articles are already in cache
      const processedArticles = [];
      const articlesToProcess = [];
      const indices = [];
      
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const cacheKey = `processed:${article.url || article.title}`;
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
        logger(`Processing ${articlesToProcess.length} uncached articles in batches`);
        const newlyProcessed = await this.processBatchWithThrottling(articlesToProcess);
        
        // Cache the newly processed articles and place them in the correct positions
        for (let i = 0; i < newlyProcessed.length; i++) {
          const article = newlyProcessed[i];
          const originalIndex = indices[i];
          const cacheKey = `processed:${article.url || article.title}`;
          
          this.cache.set(cacheKey, article, null, 'articles');
          processedArticles[originalIndex] = article;
        }
      }
      
      // Filter out any undefined entries and sort by finalScore
      const validArticles = processedArticles.filter(article => article !== undefined);
      
      // Sort by finalScore in descending order
      return validArticles.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    } catch (error) {
      logger(`Error in processBatch: ${error.message}`);
      // Return original articles if processing fails
      return articles;
    }
  }

  /**
   * Check for duplicate articles in a list
   * @param {Array} articles - List of articles to check
   * @returns {Promise<Array>} - Deduplicated list of articles
   */
  async deduplicateArticles(articles) {
    if (!articles || articles.length <= 1) {
      return articles;
    }
    
    // Skip if deduplication is disabled
    if (!config.ai.features.deduplication) {
      return articles;
    }
    
    try {
      const result = [];
      
      // Add the first article to the result
      result.push(articles[0]);
      
      // For each remaining article, check if it's a duplicate of any in the result
      for (let i = 1; i < articles.length; i++) {
        let isDuplicate = false;
        
        for (const existingArticle of result) {
          // Generate cache key for this comparison
          const article1Key = existingArticle.url || existingArticle.title;
          const article2Key = articles[i].url || articles[i].title;
          const cacheKey = `duplicate:${article1Key}:${article2Key}`;
          
          // Check cache or compute
          isDuplicate = await this.cache.getOrCompute(
            cacheKey,
            async () => this.newsProcessor.isDuplicate(articles[i], existingArticle),
            null,
            'duplicate'
          );
          
          if (isDuplicate) {
            break;
          }
        }
        
        if (!isDuplicate) {
          result.push(articles[i]);
        }
      }
      
      return result;
    } catch (error) {
      logger(`Error in deduplicateArticles: ${error.message}`);
      // Return original articles if deduplication fails
      return articles;
    }
  }

  /**
   * Aggregate top stories across categories
   * @param {Object} articlesByCategory - Map of category to articles
   * @param {number} totalLimit - Total number of articles to return
   * @returns {Promise<Array>} - Aggregated top stories
   */
  async aggregateTopStories(articlesByCategory, totalLimit = 15) {
    try {
      // Calculate how many articles to take from each category
      const categories = Object.keys(articlesByCategory);
      const articlesPerCategory = Math.max(1, Math.floor(totalLimit / categories.length));
      
      let aggregatedArticles = [];
      
      // Process each category in parallel
      const categoryPromises = categories.map(async (category) => {
        const articles = articlesByCategory[category];
        
        if (!articles || articles.length === 0) {
          return [];
        }
        
        // Process the batch of articles for this category
        const processedArticles = await this.processBatch(articles);
        
        // Take the top N articles from this category
        return processedArticles.slice(0, articlesPerCategory);
      });
      
      const articlesByCategories = await Promise.all(categoryPromises);
      
      // Flatten the array of arrays
      aggregatedArticles = articlesByCategories.flat();
      
      // Deduplicate across categories
      aggregatedArticles = await this.deduplicateArticles(aggregatedArticles);
      
      // Sort by finalScore in descending order
      aggregatedArticles.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
      
      // Limit to the total number requested
      return aggregatedArticles.slice(0, totalLimit);
    } catch (error) {
      logger(`Error in aggregateTopStories: ${error.message}`);
      
      // Fallback: return a simple aggregation of articles
      const allArticles = Object.values(articlesByCategory).flat();
      return allArticles.slice(0, totalLimit);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get API usage statistics
   * @returns {Object} - API usage statistics
   */
  getApiUsage() {
    return this.newsProcessor.getApiUsage();
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.cache.resetStats();
    this.newsProcessor.resetApiUsage();
  }
}

// Create a singleton instance
const orchestrator = new ImprovedNewsOrchestrator();

/**
 * Get enhanced news using the orchestrator
 * @param {Array} articles - Array of news articles to process
 * @returns {Promise<Array>} - Enhanced and processed articles
 */
export async function getEnhancedNews(articles) {
  try {
    if (!articles || articles.length === 0) {
      return [];
    }
    
    // Process the articles through the orchestrator
    const processedArticles = await orchestrator.processBatch(articles);
    
    return processedArticles;
  } catch (error) {
    logger(`Error in getEnhancedNews: ${error.message}`);
    // Return original articles if processing fails
    return articles;
  }
}

export default ImprovedNewsOrchestrator;