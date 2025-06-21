import { createGraph, StateGraph } from '@langchain/langgraph';
import NewsProcessor from './newsProcessor.js';

/**
 * News Orchestrator using LangGraph
 * Handles the orchestration of news processing, ranking, and aggregation
 */
class NewsOrchestrator {
  constructor() {
    this.newsProcessor = new NewsProcessor();
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
    };

    // Create the graph
    const builder = createGraph(graphState);

    // Define the nodes
    builder.addNode("summarize", async (state) => {
      try {
        const summary = await this.newsProcessor.summarizeArticle(state.article);
        return {
          ...state,
          processedData: {
            ...state.processedData,
            summary,
          },
        };
      } catch (error) {
        return {
          ...state,
          error: `Error in summarize: ${error.message}`,
        };
      }
    });

    builder.addNode("categorize", async (state) => {
      if (state.error) return state;
      
      try {
        const category = await this.newsProcessor.categorizeArticle(state.article);
        return {
          ...state,
          processedData: {
            ...state.processedData,
            category,
          },
        };
      } catch (error) {
        return {
          ...state,
          error: `Error in categorize: ${error.message}`,
        };
      }
    });

    builder.addNode("extractInfo", async (state) => {
      if (state.error) return state;
      
      try {
        const keyInfo = await this.newsProcessor.extractKeyInformation(state.article);
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
        };
      } catch (error) {
        return {
          ...state,
          error: `Error in extractInfo: ${error.message}`,
        };
      }
    });

    builder.addNode("calculateScore", async (state) => {
      if (state.error) return state;
      
      try {
        const category = state.processedData.category || state.article.category;
        const relevanceScore = await this.newsProcessor.calculateRelevanceScore(state.article, category);
        
        // Calculate a final score that combines importance and relevance
        const importanceWeight = 0.4;
        const relevanceWeight = 0.6;
        const finalScore = (
          (state.processedData.importance * importanceWeight) + 
          (relevanceScore * relevanceWeight)
        );
        
        return {
          ...state,
          processedData: {
            ...state.processedData,
            relevanceScore,
            finalScore,
          },
        };
      } catch (error) {
        return {
          ...state,
          error: `Error in calculateScore: ${error.message}`,
        };
      }
    });

    builder.addNode("finalizeArticle", async (state) => {
      if (state.error) {
        console.error(`Error processing article: ${state.error}`);
        // Return the original article if there was an error
        return {
          article: state.article,
          processedData: {},
          error: state.error,
        };
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
      };
      
      return {
        article: enhancedArticle,
        processedData: state.processedData,
        error: null,
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
    const graph = this.createArticleProcessingGraph();
    const result = await graph.invoke({ article, processedData: {}, error: null });
    return result.article;
  }

  /**
   * Create a graph for processing multiple articles in parallel
   * @returns {Object} - Compiled LangGraph workflow
   */
  createBatchProcessingGraph() {
    // Define the state type
    const graphState = {
      articles: [],
      processedArticles: [],
      errors: [],
    };

    // Create the graph
    const builder = createGraph(graphState);

    // Define the nodes
    builder.addNode("processArticles", async (state) => {
      try {
        // Process articles in parallel
        const processPromises = state.articles.map(article => 
          this.processArticle(article).catch(error => {
            console.error(`Error processing article: ${error.message}`);
            return { ...article, error: error.message };
          })
        );
        
        const processedArticles = await Promise.all(processPromises);
        
        return {
          ...state,
          processedArticles,
        };
      } catch (error) {
        return {
          ...state,
          errors: [...state.errors, error.message],
        };
      }
    });

    builder.addNode("rankArticles", async (state) => {
      try {
        // Filter out articles with errors
        const validArticles = state.processedArticles.filter(article => !article.error);
        
        // Sort by finalScore in descending order
        const rankedArticles = [...validArticles].sort((a, b) => 
          (b.finalScore || 0) - (a.finalScore || 0)
        );
        
        return {
          ...state,
          processedArticles: rankedArticles,
        };
      } catch (error) {
        return {
          ...state,
          errors: [...state.errors, error.message],
        };
      }
    });

    // Define the edges
    builder.addEdge("processArticles", "rankArticles");

    // Set the entry point
    builder.setEntryPoint("processArticles");

    // Compile the graph
    return builder.compile();
  }

  /**
   * Process and rank a batch of articles
   * @param {Array} articles - The news articles to process
   * @returns {Promise<Array>} - The processed and ranked articles
   */
  async processBatch(articles) {
    const graph = this.createBatchProcessingGraph();
    const result = await graph.invoke({ articles, processedArticles: [], errors: [] });
    return result.processedArticles;
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
    
    const result = [];
    
    // Add the first article to the result
    result.push(articles[0]);
    
    // For each remaining article, check if it's a duplicate of any in the result
    for (let i = 1; i < articles.length; i++) {
      let isDuplicate = false;
      
      for (const existingArticle of result) {
        if (await this.newsProcessor.isDuplicate(articles[i], existingArticle)) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        result.push(articles[i]);
      }
    }
    
    return result;
  }

  /**
   * Aggregate top stories across categories
   * @param {Object} articlesByCategory - Map of category to articles
   * @param {number} totalLimit - Total number of articles to return
   * @returns {Promise<Array>} - Aggregated top stories
   */
  async aggregateTopStories(articlesByCategory, totalLimit = 15) {
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
  }
}

export default NewsOrchestrator;