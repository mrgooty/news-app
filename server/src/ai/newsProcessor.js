const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');
const config = require('../config/config');

/**
 * News Processor using LangChain
 * Handles text processing chains for news content analysis
 */
class NewsProcessor {
  constructor() {
    this.model = new ChatOpenAI({
      openAIApiKey: config.ai.openaiApiKey,
      modelName: config.ai.model,
      temperature: 0.1,
    });
  }

  /**
   * Summarize a news article
   * @param {Object} article - The news article to summarize
   * @returns {Promise<string>} - The summary
   */
  async summarizeArticle(article) {
    const prompt = ChatPromptTemplate.fromTemplate(
      `Summarize the following news article in 2-3 sentences:
      
      Title: {title}
      Content: {content}
      
      Summary:`
    );
    
    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    
    const summary = await chain.invoke({
      title: article.title,
      content: article.content || article.description || '',
    });
    
    return summary.trim();
  }

  /**
   * Categorize a news article
   * @param {Object} article - The news article to categorize
   * @returns {Promise<string>} - The category
   */
  async categorizeArticle(article) {
    const prompt = ChatPromptTemplate.fromTemplate(
      `Categorize the following news article into one of these categories:
      Technology, Business, Science, Health, Entertainment, Sports, Politics, World
      
      Title: {title}
      Content: {content}
      
      Category:`
    );
    
    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    
    const category = await chain.invoke({
      title: article.title,
      content: article.content || article.description || '',
    });
    
    return category.trim();
  }

  /**
   * Extract key information from a news article
   * @param {Object} article - The news article to analyze
   * @returns {Promise<Object>} - Extracted information
   */
  async extractKeyInformation(article) {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        entities: z.array(z.string()).describe("Key entities mentioned in the article"),
        locations: z.array(z.string()).describe("Locations mentioned in the article"),
        topics: z.array(z.string()).describe("Main topics of the article"),
        sentiment: z.enum(["positive", "negative", "neutral"]).describe("Overall sentiment of the article"),
        importance: z.number().min(1).max(10).describe("Importance score from 1-10"),
      })
    );

    const formatInstructions = parser.getFormatInstructions();

    const prompt = ChatPromptTemplate.fromTemplate(
      `Extract key information from the following news article:
      
      Title: {title}
      Content: {content}
      
      {format_instructions}
      
      Extracted Information:`
    );
    
    const chain = prompt.pipe(this.model).pipe(parser);
    
    const extractedInfo = await chain.invoke({
      title: article.title,
      content: article.content || article.description || '',
      format_instructions: formatInstructions,
    });
    
    return extractedInfo;
  }

  /**
   * Calculate relevance score for an article
   * @param {Object} article - The news article to score
   * @param {string} category - The category to score against
   * @returns {Promise<number>} - Relevance score from 0-100
   */
  async calculateRelevanceScore(article, category) {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        relevanceScore: z.number().min(0).max(100).describe("Relevance score from 0-100"),
        reasoning: z.string().describe("Reasoning behind the score"),
      })
    );

    const formatInstructions = parser.getFormatInstructions();

    const prompt = ChatPromptTemplate.fromTemplate(
      `Calculate a relevance score for this news article in the category "{category}".
      
      Title: {title}
      Content: {content}
      
      Consider factors like:
      - How directly related the content is to the category
      - The importance of the news within that category
      - The timeliness and impact of the information
      
      {format_instructions}
      
      Relevance Assessment:`
    );
    
    const chain = prompt.pipe(this.model).pipe(parser);
    
    const assessment = await chain.invoke({
      title: article.title,
      content: article.content || article.description || '',
      category: category,
      format_instructions: formatInstructions,
    });
    
    return assessment.relevanceScore;
  }

  /**
   * Check if an article is a duplicate of another
   * @param {Object} article1 - First article
   * @param {Object} article2 - Second article
   * @returns {Promise<boolean>} - True if articles are duplicates
   */
  async isDuplicate(article1, article2) {
    // If URLs are identical, it's definitely a duplicate
    if (article1.url && article2.url && article1.url === article2.url) {
      return true;
    }
    
    const prompt = ChatPromptTemplate.fromTemplate(
      `Determine if these two news articles are duplicates or cover the same story.
      
      Article 1 Title: {title1}
      Article 1 Content: {content1}
      
      Article 2 Title: {title2}
      Article 2 Content: {content2}
      
      Respond with only "yes" if they are duplicates or cover the same story, or "no" if they are different.
      
      Are these articles duplicates?`
    );
    
    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    
    const result = await chain.invoke({
      title1: article1.title,
      content1: article1.content || article1.description || '',
      title2: article2.title,
      content2: article2.content || article2.description || '',
    });
    
    return result.trim().toLowerCase() === 'yes';
  }
}

module.exports = NewsProcessor;