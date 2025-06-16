const { ChatOpenAI } = require('@langchain/openai');
const { createGraph, StateGraph } = require('@langchain/langgraph');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const config = require('../config/config');

/**
 * News Aggregator using LangChain and LangGraph
 * This is a basic implementation that will be expanded in future tasks
 */
class NewsAggregator {
  constructor() {
    this.model = new ChatOpenAI({
      openAIApiKey: config.ai.openaiApiKey,
      modelName: config.ai.model,
      temperature: 0.1,
    });
  }

  /**
   * Create a workflow for processing news articles
   */
  createNewsProcessingWorkflow() {
    // Define the nodes in our graph
    const summarizeArticle = async ({ article }) => {
      const prompt = ChatPromptTemplate.fromTemplate(
        `Summarize the following news article in 2-3 sentences:
        
        Title: {title}
        Content: {content}
        
        Summary:`
      );
      
      const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
      
      const summary = await chain.invoke({
        title: article.title,
        content: article.content,
      });
      
      return { article: { ...article, summary } };
    };

    const categorizeArticle = async ({ article }) => {
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
        content: article.content,
      });
      
      return { article: { ...article, category: category.trim() } };
    };

    // Create the graph
    const workflow = createGraph();
    
    // Add nodes
    workflow.addNode("summarize", summarizeArticle);
    workflow.addNode("categorize", categorizeArticle);
    
    // Add edges
    workflow.addEdge(["summarize", "categorize"]);
    
    // Set the entry point
    workflow.setEntryPoint("summarize");
    
    // Compile the graph
    return workflow.compile();
  }

  /**
   * Process a news article through the AI workflow
   * @param {Object} article - The news article to process
   * @returns {Promise<Object>} - The processed article with summary and category
   */
  async processArticle(article) {
    const workflow = this.createNewsProcessingWorkflow();
    const result = await workflow.invoke({ article });
    return result.article;
  }
}

module.exports = NewsAggregator;