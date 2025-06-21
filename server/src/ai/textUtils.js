import { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';
import config from '../config/config.js';

/**
 * Utility functions for text processing and analysis
 */
class TextUtils {
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.ai.openaiApiKey,
    });
  }

  /**
   * Calculate the similarity between two texts using embeddings
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Promise<number>} - Similarity score between 0 and 1
   */
  async calculateSimilarity(text1, text2) {
    // Get embeddings for both texts
    const [embedding1, embedding2] = await this.embeddings.embedDocuments([text1, text2]);
    
    // Calculate cosine similarity
    return this.cosineSimilarity(embedding1, embedding2);
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vec1 - First vector
   * @param {Array<number>} vec2 - Second vector
   * @returns {number} - Cosine similarity
   */
  cosineSimilarity(vec1, vec2) {
    // Calculate dot product
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    
    // Calculate magnitudes
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    // Calculate cosine similarity
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Cluster articles based on content similarity
   * @param {Array} articles - Articles to cluster
   * @returns {Promise<Array>} - Array of article clusters
   */
  async clusterArticles(articles) {
    if (!articles || articles.length <= 1) {
      return [articles];
    }
    
    // Extract text content from articles
    const texts = articles.map(article => {
      return `${article.title} ${article.description || ''} ${article.content || ''}`.trim();
    });
    
    // Get embeddings for all texts
    const embeddings = await this.embeddings.embedDocuments(texts);
    
    // Calculate similarity matrix
    const similarityMatrix = [];
    for (let i = 0; i < embeddings.length; i++) {
      similarityMatrix[i] = [];
      for (let j = 0; j < embeddings.length; j++) {
        similarityMatrix[i][j] = this.cosineSimilarity(embeddings[i], embeddings[j]);
      }
    }
    
    // Simple clustering algorithm
    const clusters = [];
    const assigned = new Set();
    
    // Similarity threshold for clustering
    const threshold = 0.8;
    
    for (let i = 0; i < articles.length; i++) {
      if (assigned.has(i)) continue;
      
      const cluster = [articles[i]];
      assigned.add(i);
      
      for (let j = 0; j < articles.length; j++) {
        if (i === j || assigned.has(j)) continue;
        
        if (similarityMatrix[i][j] >= threshold) {
          cluster.push(articles[j]);
          assigned.add(j);
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }

  /**
   * Extract named entities from text
   * @param {string} text - Text to analyze
   * @returns {Promise<Array>} - Extracted entities
   */
  async extractEntities(text) {
    // This is a simplified implementation
    // In a production environment, you might use a more sophisticated NLP library
    
    // Common entity types to look for
    const entityTypes = [
      'person', 'organization', 'location', 'product', 'event', 
      'work_of_art', 'law', 'date', 'time', 'percent', 'money', 
      'quantity', 'ordinal', 'cardinal'
    ];
    
    // Use LangChain to extract entities
    const { ChatPromptTemplate } = require('@langchain/core/prompts');
    const { ChatOpenAI } = require('@langchain/openai');
    const { StructuredOutputParser } = require('@langchain/core/output_parsers');
    const { z } = require('zod');
    
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        entities: z.array(
          z.object({
            text: z.string().describe("The entity text"),
            type: z.string().describe("The entity type"),
          })
        ).describe("Named entities found in the text"),
      })
    );
    
    const formatInstructions = parser.getFormatInstructions();
    
    const prompt = ChatPromptTemplate.fromTemplate(
      `Extract named entities from the following text:
      
      Text: {text}
      
      Look for entities like people, organizations, locations, products, events, etc.
      
      {format_instructions}
      
      Extracted Entities:`
    );
    
    const model = new ChatOpenAI({
      openAIApiKey: config.ai.openaiApiKey,
      modelName: config.ai.model,
      temperature: 0,
    });
    
    const chain = prompt.pipe(model).pipe(parser);
    
    const result = await chain.invoke({
      text: text,
      format_instructions: formatInstructions,
    });
    
    return result.entities;
  }

  /**
   * Analyze the sentiment of a text
   * @param {string} text - Text to analyze
   * @returns {Promise<string>} - Sentiment (positive, negative, neutral)
   */
  async analyzeSentiment(text) {
    const { ChatPromptTemplate } = require('@langchain/core/prompts');
    const { ChatOpenAI } = require('@langchain/openai');
    const { StringOutputParser } = require('@langchain/core/output_parsers');
    
    const prompt = ChatPromptTemplate.fromTemplate(
      `Analyze the sentiment of the following text and respond with only one word: "positive", "negative", or "neutral".
      
      Text: {text}
      
      Sentiment:`
    );
    
    const model = new ChatOpenAI({
      openAIApiKey: config.ai.openaiApiKey,
      modelName: config.ai.model,
      temperature: 0,
    });
    
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const sentiment = await chain.invoke({
      text: text,
    });
    
    return sentiment.trim().toLowerCase();
  }
}

export default TextUtils;