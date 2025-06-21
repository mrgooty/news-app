import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import config from '../config/config.js';
import log from '../utils/logger.js';
import { checkBasicDuplicate, prepareContentForAI } from '../utils/articleUtils.js';

const logger = log('ImprovedNewsProcessor');

/**
 * Improved News Processor using LangChain with optimized prompts and fallback mechanisms
 * Handles text processing chains for news content analysis with enhanced performance
 */
class ImprovedNewsProcessor {
  constructor() {
    this.aiEnabled = config.ai.enabled;
    this.model = null;
    this.fallbackModel = null;
    this.apiUsage = {
      totalCalls: 0,
      totalTokens: 0,
      callsByType: {
        summarize: 0,
        categorize: 0,
        extractInfo: 0,
        sentiment: 0,
        relevance: 0,
        duplicate: 0,
      },
    };

    if (this.aiEnabled) {
      this.initializeModels();
    }
  }

  /**
   * Initialize AI models
   */
  initializeModels() {
    try {
      this.model = new ChatOpenAI({
        modelName: config.ai.model,
        temperature: config.ai.temperature,
        maxTokens: config.ai.maxTokens,
        openAIApiKey: config.ai.openaiApiKey,
      });

      if (config.ai.fallbackModel && config.ai.fallbackModel !== config.ai.model) {
        this.fallbackModel = new ChatOpenAI({
          modelName: config.ai.fallbackModel,
          temperature: config.ai.temperature,
          maxTokens: config.ai.maxTokens,
          openAIApiKey: config.ai.openaiApiKey,
        });
      }

      logger('AI models initialized successfully');
    } catch (error) {
      logger(`Error initializing AI models: ${error.message}`);
      this.aiEnabled = false;
    }
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit() {
    const delay = config.ai.rateLimit.delay;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Track API usage
   */
  trackApiUsage(operationType) {
    this.apiUsage.totalCalls++;
    this.apiUsage.callsByType[operationType] = (this.apiUsage.callsByType[operationType] || 0) + 1;
  }

  /**
   * Reset API usage statistics
   */
  resetApiUsage() {
    this.apiUsage = {
      totalCalls: 0,
      totalTokens: 0,
      callsByType: {
        summarize: 0,
        categorize: 0,
        extractInfo: 0,
        sentiment: 0,
        relevance: 0,
        duplicate: 0,
      },
    };
  }

  /**
   * Execute an AI operation with retry and fallback logic
   * @param {Function} operation - The operation to execute
   * @param {string} operationType - Type of operation for tracking
   * @param {any} fallbackValue - Fallback value if operation fails
   * @param {Function} fallbackFn - Fallback function if operation fails
   * @returns {Promise<any>} - Operation result
   */
  async executeWithFallback(operation, operationType, fallbackValue = null, fallbackFn = null) {
    if (!this.aiEnabled) {
      if (fallbackFn) {
        return fallbackFn();
      }
      return fallbackValue;
    }
    
    try {
      // Apply rate limiting
      await this.applyRateLimit();
      
      // Track API usage
      this.trackApiUsage(operationType);
      
      // Execute the operation
      return await operation();
    } catch (error) {
      logger(`Error in ${operationType}: ${error.message}`);
      
      // Try with fallback model
      if (this.fallbackModel) {
        try {
          logger(`Retrying ${operationType} with fallback model`);
          // Apply rate limiting again
          await this.applyRateLimit();
          
          // Track API usage
          this.trackApiUsage(operationType);
          
          // Execute the operation with fallback model
          return await operation(true);
        } catch (fallbackError) {
          logger(`Fallback model also failed for ${operationType}: ${fallbackError.message}`);
        }
      }
      
      // Try with fallback function if provided
      if (fallbackFn) {
        try {
          logger(`Using local fallback for ${operationType}`);
          return await fallbackFn();
        } catch (localFallbackError) {
          logger(`Local fallback also failed for ${operationType}: ${localFallbackError.message}`);
        }
      }
      
      // Return fallback value if all else fails
      return fallbackValue;
    }
  }

  /**
   * Prepare content for AI processing
   * @param {Object} article - Article object
   * @param {boolean} short - Whether to use short content
   * @returns {string} - Prepared content
   */
  prepareContent(article, short = false) {
    return prepareContentForAI(article, short);
  }

  /**
   * Summarize article content
   * @param {Object} article - Article to summarize
   * @returns {Promise<string>} - Article summary
   */
  async summarizeArticle(article) {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      const prompt = ChatPromptTemplate.fromTemplate(
        `Summarize the following news article in 2-3 sentences. Focus on the main facts and key information.

        Title: {title}
        Content: {content}

        Summary:`
      );

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const result = await chain.invoke({
        title: article.title,
        content: this.prepareContent(article, true)
      });
      
      return result.trim();
    };

    const fallbackFn = async () => {
      return article.description || article.title;
    };

    return this.executeWithFallback(operation, 'summarize', article.title, fallbackFn);
  }

  /**
   * Categorize article content
   * @param {Object} article - Article to categorize
   * @returns {Promise<string>} - Article category
   */
  async categorizeArticle(article) {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      const prompt = ChatPromptTemplate.fromTemplate(
        `Categorize this news article into one of these categories: technology, business, politics, sports, entertainment, science, health, world.

        Title: {title}
        Content: {content}

        Respond with only the category name.`
      );

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const result = await chain.invoke({
        title: article.title,
        content: this.prepareContent(article, true)
      });
      
      return result.trim().toLowerCase();
    };

    const fallbackFn = async () => {
      return article.category || 'general';
    };

    return this.executeWithFallback(operation, 'categorize', 'general', fallbackFn);
  }

  /**
   * Extract key information from article
   * @param {Object} article - Article to extract info from
   * @returns {Promise<Object>} - Extracted information
   */
  async extractArticleInfo(article) {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      const prompt = ChatPromptTemplate.fromTemplate(
        `Extract key information from this news article. Return a JSON object with these fields:
        - entities: array of important people, places, organizations mentioned
        - keywords: array of key terms and concepts
        - sentiment: overall sentiment (positive, negative, neutral)
        - confidence: confidence score (0-1)

        Title: {title}
        Content: {content}

        JSON:`
      );

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const result = await chain.invoke({
        title: article.title,
        content: this.prepareContent(article, true)
      });
      
      try {
        return JSON.parse(result.trim());
      } catch (error) {
        logger(`Error parsing extracted info: ${error.message}`);
        return {
          entities: [],
          keywords: [],
          sentiment: 'neutral',
          confidence: 0.5
        };
      }
    };

    const fallbackFn = async () => {
      return {
        entities: [],
        keywords: article.title.split(' ').slice(0, 5),
        sentiment: 'neutral',
        confidence: 0.5
      };
    };

    return this.executeWithFallback(operation, 'extractInfo', {
      entities: [],
      keywords: [],
      sentiment: 'neutral',
      confidence: 0.5
    }, fallbackFn);
  }

  /**
   * Analyze article sentiment
   * @param {Object} article - Article to analyze
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(article) {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      const prompt = ChatPromptTemplate.fromTemplate(
        `Analyze the sentiment of this news article. Return a JSON object with:
        - sentiment: positive, negative, or neutral
        - confidence: confidence score (0-1)
        - reasoning: brief explanation

        Title: {title}
        Content: {content}

        JSON:`
      );

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const result = await chain.invoke({
        title: article.title,
        content: this.prepareContent(article, true)
      });
      
      try {
        return JSON.parse(result.trim());
      } catch (error) {
        logger(`Error parsing sentiment: ${error.message}`);
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          reasoning: 'Unable to analyze sentiment'
        };
      }
    };

    const fallbackFn = async () => {
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        reasoning: 'Fallback sentiment analysis'
      };
    };

    return this.executeWithFallback(operation, 'sentiment', {
      sentiment: 'neutral',
      confidence: 0.5,
      reasoning: 'Unable to analyze sentiment'
    }, fallbackFn);
  }

  /**
   * Calculate article relevance score
   * @param {Object} article - Article to score
   * @param {string} context - Context for relevance (e.g., category, query)
   * @returns {Promise<number>} - Relevance score (0-1)
   */
  async calculateRelevanceScore(article, context = '') {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      const prompt = ChatPromptTemplate.fromTemplate(
        `Rate the relevance of this article to the context. Return a number between 0 and 1.

        Context: {context}
        Title: {title}
        Content: {content}

        Relevance score (0-1):`
      );

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const result = await chain.invoke({
        context,
        title: article.title,
        content: this.prepareContent(article, true)
      });
      
      const score = parseFloat(result.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    };

    const fallbackFn = async () => {
      return 0.5;
    };

    return this.executeWithFallback(operation, 'relevance', 0.5, fallbackFn);
  }

  /**
   * Check if an article is a duplicate of another with improved prompt
   * @param {Object} article1 - First article
   * @param {Object} article2 - Second article
   * @returns {Promise<boolean>} - True if articles are duplicates
   */
  async isDuplicate(article1, article2) {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      // Improved prompt for better duplicate detection
      const prompt = ChatPromptTemplate.fromTemplate(
        `Determine if these two news articles are duplicates or cover the same story.
        
        Article 1 Title: {title1}
        Article 1 Content: {content1}
        
        Article 2 Title: {title2}
        Article 2 Content: {content2}
        
        Consider:
        - Do they cover the same main event or story?
        - Do they contain the same key facts and information?
        - Are they just different perspectives on the same news?
        
        Respond with only "yes" if they are duplicates or cover the same story, or "no" if they are different.
        
        Are these articles duplicates?`
      );
      
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const result = await chain.invoke({
        title1: article1.title,
        content1: this.prepareContent(article1, true), // Use shorter content
        title2: article2.title,
        content2: this.prepareContent(article2, true), // Use shorter content
      });
      
      return result.trim().toLowerCase() === 'yes';
    };
    
    // Fallback function using centralized utility
    const fallbackFn = async () => {
      return checkBasicDuplicate(article1, article2);
    };
    
    // Default to not duplicate if all else fails
    return this.executeWithFallback(operation, 'duplicate', false, fallbackFn);
  }

  /**
   * Process a batch of articles
   * @param {Array} articles - Articles to process
   * @returns {Promise<Array>} - Processed articles
   */
  async processBatch(articles) {
    if (!this.aiEnabled || !articles || articles.length === 0) {
      return articles;
    }

    logger(`Processing batch of ${articles.length} articles`);

    const processedArticles = [];
    
    for (const article of articles) {
      try {
        // Process article in parallel
        const [summary, category, info, sentiment, relevance] = await Promise.allSettled([
          this.summarizeArticle(article),
          this.categorizeArticle(article),
          this.extractArticleInfo(article),
          this.analyzeSentiment(article),
          this.calculateRelevanceScore(article, article.category)
        ]);

        // Combine results
        const processedArticle = {
          ...article,
          aiSummary: summary.status === 'fulfilled' ? summary.value : null,
          aiCategory: category.status === 'fulfilled' ? category.value : article.category,
          aiInfo: info.status === 'fulfilled' ? info.value : {},
          aiSentiment: sentiment.status === 'fulfilled' ? sentiment.value : { sentiment: 'neutral', confidence: 0.5 },
          aiRelevance: relevance.status === 'fulfilled' ? relevance.value : 0.5,
          finalScore: this.calculateFinalScore(article, {
            relevance: relevance.status === 'fulfilled' ? relevance.value : 0.5,
            sentiment: sentiment.status === 'fulfilled' ? sentiment.value.confidence : 0.5
          })
        };

        processedArticles.push(processedArticle);
      } catch (error) {
        logger(`Error processing article ${article.id}: ${error.message}`);
        processedArticles.push(article);
      }
    }

    return processedArticles;
  }

  /**
   * Calculate final score for article ranking
   * @param {Object} article - Article object
   * @param {Object} aiResults - AI analysis results
   * @returns {number} - Final score
   */
  calculateFinalScore(article, aiResults) {
    let score = 0.5; // Base score

    // Factor in relevance
    if (aiResults.relevance) {
      score += aiResults.relevance * 0.3;
    }

    // Factor in sentiment confidence
    if (aiResults.sentiment) {
      score += aiResults.sentiment * 0.2;
    }

    // Factor in article age (newer articles get higher scores)
    if (article.publishedAt) {
      const ageInHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
      const ageScore = Math.max(0, 1 - (ageInHours / 168)); // Decay over a week
      score += ageScore * 0.3;
    }

    // Factor in content length (longer articles might be more substantial)
    const contentLength = (article.content || article.description || '').length;
    const lengthScore = Math.min(1, contentLength / 1000); // Normalize to 1000 chars
    score += lengthScore * 0.2;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get API usage statistics
   * @returns {Object} - Usage statistics
   */
  getApiUsage() {
    return { ...this.apiUsage };
  }
}

export default ImprovedNewsProcessor;