const { createGraph } = require('@langchain/langgraph');
const ImprovedNewsProcessor = require('./improvedNewsProcessor');
const EnhancedCacheManager = require('./enhancedCacheManager');
const config = require('../config/config');
const createLogger = require('../utils/logger');
const log = createLogger('ImprovedNewsOrchestrator');

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
    // Define the state type
    const graphState = {
      article: {},
      processedData: {},
      error: null,
      processingSteps: {
        summarize: false,
        categorize: false,
        extractInfo: false,
        calculateScore: false,
      },
    };

    // Create the graph
    const builder = createGraph(graphState);

    // Define the nodes
    builder.addNode("summarize", async (state) => {
      try {
        // Skip if disabled in config
        if (!config.ai.features.summarization) {
          return {
            ...state,
            processingSteps: {
              ...state.processingSteps,
              summarize: true,
            },
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
          ...state,
          processedData: {
            ...state.processedData,
            summary,
          },
          processingSteps: {
            ...state.processingSteps,
            summarize: true,
          },
        };
      } catch (error) {
        log(`Error in summarize: ${error.message}`);
        return {
          ...state,
          error: `Error in summarize: ${error.message}`,
          processingSteps: {
            ...state.processingSteps,
            summarize: true,
          },
        };
      }
    });

    builder.addNode("categorize", async (state) => {
      // Continue even if previous step had an error
      try {
        // Skip if disabled in config
        if (!config.ai.features.categorization) {
          return {
            ...state,
            processingSteps: {
              ...state.processingSteps,
              categorize: true,
            },
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
          ...state,
          processedData: {
            ...state.processedData,
            category,
          },
          processingSteps: {
            ...state.processingSteps,
            categorize: true,
          },
        };
      } catch (error) {
        log(`Error in categorize: ${error.message}`);
        return {
          ...state,
          error: state.error || `Error in categorize: ${error.message}`,
          processingSteps: {
            ...state.processingSteps,
            categorize: true,
          },
        };
      }
    });

    builder.addNode("extractInfo", async (state) => {
      // Continue even if previous steps had errors
      try {
        // Skip if disabled in config
        if (!config.ai.features.entityExtraction && !config.ai.features.sentimentAnalysis) {
          return {
            ...state,
            processingSteps: {
              ...state.processingSteps,
              extractInfo: true,
            },
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
          ...state,
          processedData: {
            ...state.processedData,
            entities: keyInfo.entities,
            locations: keyInfo.locations,
            topics: keyInfo.topics,
            sentiment: keyInfo.sentiment,
            importance: keyInfo.importance,
          },
          processingSteps: {
            ...state.processingSteps,
            extractInfo: true,
          },
        };
      } catch (error) {
        log(`Error in extractInfo: ${error.message}`);
        return {
          ...state,
          error: state.error || `Error in extractInfo: ${error.message}`,
          processingSteps: {
            ...state.processingSteps,
            extractInfo: true,
          },
        };
      }
    });

    builder.addNode("calculateScore", async (state) => {
      // Continue even if previous steps had errors
      try {
        // Skip if disabled in config
        if (!config.ai.features.relevanceScoring) {
          return {
            ...state,
            processingSteps: {
              ...state.processingSteps,
              calculateScore: true,
            },
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
          ...state,
          processedData: {
            ...state.processedData,
            relevanceScore,
            finalScore,
          },
          processingSteps: {
            ...state.processingSteps,
            calculateScore: true,
          },
        };
      } catch (error) {
        log(`Error in calculateScore: ${error.message}`);
        return {
          ...state,
          error: state.error || `Error in calculateScore: ${error.message}`,
          processingSteps: {
            ...state.processingSteps,
            calculateScore: true,
          },
        };
      }
    });

    builder.addNode("finalizeArticle", async (state) => {
      if (state.error) {
        log(`Warning: Completed article processing with errors: ${state.error}`);
      }
      
      // Merge the processed data with the original article
      const enhancedArticle = {
        ...state.article,
        summary: state.processedData.summary,
        category: state.processedData.category || state.article.category,
        entities: state.processedData.entities,
        locations: state.processedData.locations,
        topics: state.processedData.topics,
        sentiment: state.processedData.sentiment,
        importance: state.processedData.importance,
        relevanceScore: state.processedData.relevanceScore,
        finalScore: state.processedData.finalScore,
        processingError: state.error,
      };
      
      return {
        article: enhancedArticle,
        processedData: state.processedData,
        error: state.error,
        processingSteps: state.processingSteps,
      };
    });

    // Define the edges
    builder.addEdge("summarize", "categorize");
    builder.addEdge("categorize", "extractInfo");
    builder.addEdge("extractInfo", "calculateScore");
    builder.addEdge("calculateScore", "finalizeArticle");

    // Set the entry point
    builder.setEntryPoint("summarize");

    // Compile the graph
    return builder.compile();
  }

  /**
   * Process a single news article through the graph
   * @param {Object} article - The news article to process
   * @returns {Promise<Object>} - The processed article
   */
  async processArticle(article) {
    // Skip processing if article is missing essential data
    if (!article || (!article.title && !article.url)) {
      log('Warning: Skipping article processing due to missing data');
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
      log(`Error processing article: ${error.message}`);
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
        log(`Processing ${articlesToProcess.length} uncached articles in batches`);
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
      log(`Error in processBatch: ${error.message}`);
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
      log(`Error in deduplicateArticles: ${error.message}`);
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
      log(`Error in aggregateTopStories: ${error.message}`);
      
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

module.exports = ImprovedNewsOrchestrator;