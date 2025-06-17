const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');
const config = require('../config/config');
const BertAnalyzer = require('./bertAnalyzer');
const createLogger = require('../utils/logger');
const log = createLogger('ImprovedNewsProcessor');

/**
 * Improved News Processor using LangChain with optimized prompts and fallback mechanisms
 * Handles text processing chains for news content analysis with enhanced performance
 */
class ImprovedNewsProcessor {
  constructor() {
    // Initialize OpenAI model with configuration
    this.initializeModels();
    
    // Initialize local BERT analyzer for fallback
    this.bertAnalyzer = new BertAnalyzer();
    
    // Track API usage
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
    
    // Rate limiting
    this.lastApiCall = 0;
    this.minTimeBetweenCalls = 100; // ms
  }

  /**
   * Initialize AI models
   */
  initializeModels() {
    this.aiEnabled = Boolean(config.ai.openaiApiKey);
    
    if (this.aiEnabled) {
      this.model = new ChatOpenAI({
        openAIApiKey: config.ai.openaiApiKey,
        modelName: config.ai.model,
        temperature: config.ai.temperature || 0.1,
        maxTokens: config.ai.maxTokens,
        timeout: config.ai.requestTimeout,
      });
      
      // Fallback model with more conservative settings
      this.fallbackModel = new ChatOpenAI({
        openAIApiKey: config.ai.openaiApiKey,
        modelName: config.ai.fallbackModel || 'gpt-3.5-turbo',
        temperature: 0.0,
        maxTokens: 300,
        timeout: 45000, // Longer timeout for fallback
      });
    } else {
      log('OpenAI API key not configured. AI features will be limited.');
      this.model = null;
      this.fallbackModel = null;
    }
  }

  /**
   * Apply rate limiting to API calls
   * @returns {Promise<void>}
   */
  async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    
    if (timeSinceLastCall < this.minTimeBetweenCalls) {
      const delay = this.minTimeBetweenCalls - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastApiCall = Date.now();
  }

  /**
   * Track API usage
   * @param {string} type - Type of API call
   * @param {number} tokens - Estimated token usage
   */
  trackApiUsage(type, tokens = 0) {
    this.apiUsage.totalCalls++;
    this.apiUsage.totalTokens += tokens;
    
    if (this.apiUsage.callsByType[type] !== undefined) {
      this.apiUsage.callsByType[type]++;
    }
  }

  /**
   * Get API usage statistics
   * @returns {Object} - API usage statistics
   */
  getApiUsage() {
    return { ...this.apiUsage };
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
      log(`Error in ${operationType}: ${error.message}`);
      
      // Try with fallback model
      if (this.fallbackModel) {
        try {
          log(`Retrying ${operationType} with fallback model`);
          // Apply rate limiting again
          await this.applyRateLimit();
          
          // Track API usage
          this.trackApiUsage(operationType);
          
          // Execute the operation with fallback model
          return await operation(true);
        } catch (fallbackError) {
          log(`Fallback model also failed for ${operationType}: ${fallbackError.message}`);
        }
      }
      
      // Try with fallback function if provided
      if (fallbackFn) {
        try {
          log(`Using local fallback for ${operationType}`);
          return await fallbackFn();
        } catch (localFallbackError) {
          log(`Local fallback also failed for ${operationType}: ${localFallbackError.message}`);
        }
      }
      
      // Return fallback value if all else fails
      return fallbackValue;
    }
  }

  /**
   * Summarize a news article with improved prompt and fallback
   * @param {Object} article - The news article to summarize
   * @returns {Promise<string>} - The summary
   */
  async summarizeArticle(article) {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      // Improved prompt for better summaries
      const prompt = ChatPromptTemplate.fromTemplate(
        `Summarize the following news article in 2-3 concise, informative sentences that capture the main points.
        Focus on the key facts, events, or developments, and avoid unnecessary details.
        
        Title: {title}
        Content: {content}
        
        Summary:`
      );
      
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const summary = await chain.invoke({
        title: article.title,
        content: this.prepareContent(article),
      });
      
      return summary.trim();
    };
    
    // Fallback function using BERT
    const fallbackFn = async () => {
      if (config.ai.features.fallbackToLocal) {
        return this.bertAnalyzer.summarize(this.prepareContent(article));
      }
      return null;
    };
    
    // Generate a simple fallback summary from title if all else fails
    const simpleFallback = article.title;
    
    return this.executeWithFallback(operation, 'summarize', simpleFallback, fallbackFn);
  }

  /**
   * Categorize a news article with improved prompt and fallback
   * @param {Object} article - The news article to categorize
   * @returns {Promise<string>} - The category
   */
  async categorizeArticle(article) {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      // Improved prompt for more accurate categorization
      const prompt = ChatPromptTemplate.fromTemplate(
        `Categorize the following news article into exactly one of these categories:
        Technology, Business, Science, Health, Entertainment, Sports, Politics, World
        
        Choose the most specific and relevant category based on the main topic of the article.
        
        Title: {title}
        Content: {content}
        
        Category (one word only):`
      );
      
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      const category = await chain.invoke({
        title: article.title,
        content: this.prepareContent(article),
      });
      
      // Normalize category name
      return this.normalizeCategory(category.trim());
    };
    
    // Fallback function using rule-based categorization
    const fallbackFn = async () => {
      return this.ruleBadedCategorization(article);
    };
    
    // Default to 'general' if all else fails
    return this.executeWithFallback(operation, 'categorize', 'general', fallbackFn);
  }

  /**
   * Extract key information from a news article with improved schema
   * @param {Object} article - The news article to analyze
   * @returns {Promise<Object>} - Extracted information
   */
  async extractKeyInformation(article) {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      // Improved schema for more structured output
      const parser = StructuredOutputParser.fromZodSchema(
        z.object({
          entities: z.array(z.string()).describe("Key entities (people, organizations, products) mentioned in the article"),
          locations: z.array(z.string()).describe("Specific locations mentioned in the article"),
          topics: z.array(z.string()).describe("Main topics or themes of the article (3-5 topics)"),
          sentiment: z.enum(["positive", "negative", "neutral", "mixed"]).describe("Overall sentiment of the article"),
          importance: z.number().min(1).max(10).describe("Importance score from 1-10 based on significance of the news"),
        })
      );

      const formatInstructions = parser.getFormatInstructions();

      // Improved prompt for better information extraction
      const prompt = ChatPromptTemplate.fromTemplate(
        `Extract key information from the following news article:
        
        Title: {title}
        Content: {content}
        
        Analyze the article carefully and extract:
        1. Important entities (people, organizations, products)
        2. Specific locations mentioned
        3. Main topics or themes (3-5 topics)
        4. Overall sentiment (positive, negative, neutral, or mixed)
        5. Importance score (1-10) based on the significance of the news
        
        {format_instructions}
        
        Extracted Information:`
      );
      
      const chain = prompt.pipe(model).pipe(parser);
      
      const extractedInfo = await chain.invoke({
        title: article.title,
        content: this.prepareContent(article),
        format_instructions: formatInstructions,
      });
      
      return extractedInfo;
    };
    
    // Fallback function using simpler extraction
    const fallbackFn = async () => {
      const sentiment = config.ai.features.fallbackToLocal 
        ? await this.bertAnalyzer.analyzeSentiment(this.prepareContent(article))
        : 'neutral';
      
      return {
        entities: this.extractBasicEntities(article),
        locations: [],
        topics: [this.ruleBadedCategorization(article)],
        sentiment: sentiment,
        importance: 5, // Middle importance as default
      };
    };
    
    // Default empty structure if all else fails
    const defaultInfo = {
      entities: [],
      locations: [],
      topics: [],
      sentiment: 'neutral',
      importance: 5,
    };
    
    return this.executeWithFallback(operation, 'extractInfo', defaultInfo, fallbackFn);
  }

  /**
   * Calculate relevance score for an article with improved prompt
   * @param {Object} article - The news article to score
   * @param {string} category - The category to score against
   * @returns {Promise<number>} - Relevance score from 0-100
   */
  async calculateRelevanceScore(article, category) {
    const operation = async (useFallback = false) => {
      const model = useFallback ? this.fallbackModel : this.model;
      
      // Improved schema for more structured output
      const parser = StructuredOutputParser.fromZodSchema(
        z.object({
          relevanceScore: z.number().min(0).max(100).describe("Relevance score from 0-100"),
          reasoning: z.string().describe("Brief reasoning behind the score"),
        })
      );

      const formatInstructions = parser.getFormatInstructions();

      // Improved prompt for better relevance scoring
      const prompt = ChatPromptTemplate.fromTemplate(
        `Calculate a relevance score for this news article in the category "{category}".
        
        Title: {title}
        Content: {content}
        
        Consider these factors:
        - How directly related the content is to the {category} category
        - The importance of the news within that category
        - The timeliness and impact of the information
        - The specificity to the category (more specific = higher score)
        
        {format_instructions}
        
        Relevance Assessment:`
      );
      
      const chain = prompt.pipe(model).pipe(parser);
      
      const assessment = await chain.invoke({
        title: article.title,
        content: this.prepareContent(article, true), // Use shorter content for relevance
        category: category,
        format_instructions: formatInstructions,
      });
      
      return assessment.relevanceScore;
    };
    
    // Fallback function using keyword matching
    const fallbackFn = async () => {
      return this.calculateBasicRelevanceScore(article, category);
    };
    
    // Default middle score if all else fails
    return this.executeWithFallback(operation, 'relevance', 50, fallbackFn);
  }

  /**
   * Check if an article is a duplicate of another with improved prompt
   * @param {Object} article1 - First article
   * @param {Object} article2 - Second article
   * @returns {Promise<boolean>} - True if articles are duplicates
   */
  async isDuplicate(article1, article2) {
    // Quick check for identical URLs
    if (article1.url && article2.url && article1.url === article2.url) {
      return true;
    }
    
    // Quick check for identical titles
    if (article1.title === article2.title) {
      return true;
    }
    
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
    
    // Fallback function using title similarity
    const fallbackFn = async () => {
      return this.checkBasicDuplicate(article1, article2);
    };
    
    // Default to not duplicate if all else fails
    return this.executeWithFallback(operation, 'duplicate', false, fallbackFn);
  }

  /**
   * Prepare article content for processing
   * @param {Object} article - The article to prepare content for
   * @param {boolean} shorter - Whether to use shorter content
   * @returns {string} - Prepared content
   */
  prepareContent(article, shorter = false) {
    let content = article.content || article.description || '';
    
    // Add title if content is very short
    if (content.length < 100) {
      content = `${article.title}. ${content}`;
    }
    
    // Limit content length for efficiency
    const maxLength = shorter ? 500 : 1500;
    if (content.length > maxLength) {
      content = content.substring(0, maxLength);
    }
    
    return content;
  }

  /**
   * Normalize category name
   * @param {string} category - Category name to normalize
   * @returns {string} - Normalized category name
   */
  normalizeCategory(category) {
    const normalized = category.trim().toLowerCase();
    
    // Map of common variations to standard categories
    const categoryMap = {
      'tech': 'technology',
      'technology': 'technology',
      'business': 'business',
      'finance': 'business',
      'economy': 'business',
      'science': 'science',
      'research': 'science',
      'health': 'health',
      'medical': 'health',
      'healthcare': 'health',
      'entertainment': 'entertainment',
      'media': 'entertainment',
      'celebrity': 'entertainment',
      'sports': 'sports',
      'sport': 'sports',
      'politics': 'politics',
      'political': 'politics',
      'government': 'politics',
      'world': 'world',
      'international': 'world',
      'global': 'world',
    };
    
    // Return mapped category or default to 'general'
    return categoryMap[normalized] || 'general';
  }

  /**
   * Rule-based categorization as fallback
   * @param {Object} article - The article to categorize
   * @returns {string} - Category
   */
  ruleBadedCategorization(article) {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // Simple keyword-based categorization
    const categoryKeywords = {
      technology: ['tech', 'technology', 'software', 'hardware', 'app', 'digital', 'internet', 'cyber', 'ai', 'robot'],
      business: ['business', 'economy', 'market', 'stock', 'finance', 'company', 'industry', 'trade', 'economic'],
      science: ['science', 'research', 'study', 'discovery', 'space', 'physics', 'chemistry', 'biology'],
      health: ['health', 'medical', 'doctor', 'hospital', 'disease', 'treatment', 'patient', 'drug', 'vaccine'],
      entertainment: ['entertainment', 'movie', 'film', 'music', 'celebrity', 'actor', 'actress', 'hollywood', 'tv', 'show'],
      sports: ['sport', 'sports', 'game', 'player', 'team', 'match', 'tournament', 'championship', 'olympic', 'football', 'soccer', 'basketball'],
      politics: ['politics', 'government', 'president', 'minister', 'election', 'vote', 'party', 'congress', 'senate', 'parliament'],
      world: ['world', 'international', 'global', 'foreign', 'country', 'nation', 'diplomatic', 'embassy', 'border'],
    };
    
    // Count keyword matches for each category
    const scores = {};
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      scores[category] = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          scores[category]++;
        }
      }
    }
    
    // Find category with highest score
    let maxScore = 0;
    let maxCategory = 'general';
    
    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxCategory = category;
      }
    }
    
    // Return general if no strong match
    return maxScore > 0 ? maxCategory : 'general';
  }

  /**
   * Extract basic entities as fallback
   * @param {Object} article - The article to extract entities from
   * @returns {Array<string>} - Extracted entities
   */
  extractBasicEntities(article) {
    const text = `${article.title} ${article.description || ''}`;
    const entities = [];
    
    // Extract quoted phrases as potential entities
    const quoteRegex = /"([^"]+)"/g;
    let match;
    while ((match = quoteRegex.exec(text)) !== null) {
      if (match[1].length > 3) {
        entities.push(match[1]);
      }
    }
    
    // Extract capitalized phrases as potential entities
    const capitalizedRegex = /\b([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g;
    while ((match = capitalizedRegex.exec(text)) !== null) {
      if (!entities.includes(match[1])) {
        entities.push(match[1]);
      }
    }
    
    return entities.slice(0, 5); // Limit to 5 entities
  }

  /**
   * Calculate basic relevance score as fallback
   * @param {Object} article - The article to score
   * @param {string} category - The category to score against
   * @returns {number} - Relevance score
   */
  calculateBasicRelevanceScore(article, category) {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // Category-specific keywords
    const categoryKeywords = {
      technology: ['tech', 'technology', 'software', 'hardware', 'app', 'digital', 'internet', 'cyber', 'ai', 'robot'],
      business: ['business', 'economy', 'market', 'stock', 'finance', 'company', 'industry', 'trade', 'economic'],
      science: ['science', 'research', 'study', 'discovery', 'space', 'physics', 'chemistry', 'biology'],
      health: ['health', 'medical', 'doctor', 'hospital', 'disease', 'treatment', 'patient', 'drug', 'vaccine'],
      entertainment: ['entertainment', 'movie', 'film', 'music', 'celebrity', 'actor', 'actress', 'hollywood', 'tv', 'show'],
      sports: ['sport', 'sports', 'game', 'player', 'team', 'match', 'tournament', 'championship', 'olympic', 'football', 'soccer', 'basketball'],
      politics: ['politics', 'government', 'president', 'minister', 'election', 'vote', 'party', 'congress', 'senate', 'parliament'],
      world: ['world', 'international', 'global', 'foreign', 'country', 'nation', 'diplomatic', 'embassy', 'border'],
      general: ['news', 'report', 'update', 'latest', 'breaking', 'today', 'announce', 'reveal', 'say', 'state'],
    };
    
    // Get keywords for the specified category
    const keywords = categoryKeywords[category.toLowerCase()] || categoryKeywords.general;
    
    // Count keyword matches
    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
      }
    }
    
    // Calculate score based on matches
    const maxMatches = keywords.length;
    const baseScore = (matches / maxMatches) * 100;
    
    // Adjust score (minimum 30, maximum 95)
    return Math.min(95, Math.max(30, baseScore));
  }

  /**
   * Check if articles are duplicates using basic comparison
   * @param {Object} article1 - First article
   * @param {Object} article2 - Second article
   * @returns {boolean} - True if articles are likely duplicates
   */
  checkBasicDuplicate(article1, article2) {
    // Check for significant title overlap
    const title1Words = article1.title.toLowerCase().split(/\s+/);
    const title2Words = article2.title.toLowerCase().split(/\s+/);
    
    // Count matching words
    let matchingWords = 0;
    for (const word of title1Words) {
      if (word.length > 3 && title2Words.includes(word)) {
        matchingWords++;
      }
    }
    
    // Calculate similarity percentage
    const similarity = (matchingWords * 2) / (title1Words.length + title2Words.length);
    
    // Consider duplicates if similarity is high
    return similarity > 0.6;
  }
}

module.exports = ImprovedNewsProcessor;