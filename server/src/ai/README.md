# AI News Orchestration System

This directory contains the implementation of the AI-powered news orchestration system using LangChain and LangGraph.

## Overview

The system processes, ranks, filters, and aggregates news content from multiple sources to provide high-quality, relevant news stories to users.

## Components

- **NewsProcessor**: Handles individual text processing tasks using LangChain
- **NewsOrchestrator**: Manages the workflow using LangGraph
- **TextUtils**: Provides utilities for text analysis and similarity comparison
- **CacheManager**: Improves performance by caching processed results
- **NewsAggregator**: High-level interface for the entire system

## Usage

### Basic Usage

```javascript
const { NewsAggregator } = require('./ai');

// Initialize the news aggregator
const newsAggregator = new NewsAggregator();

// Process a single article
const processedArticle = await newsAggregator.processArticle(article);

// Process multiple articles
const processedArticles = await newsAggregator.processArticles(articles);

// Rank articles
const rankedArticles = await newsAggregator.rankArticles(articles, {
  recencyWeight: 0.3,
  scoreWeight: 0.7
});

// Get top stories across categories
const topStories = await newsAggregator.getTopStories(articlesByCategory, 15);
```

### GraphQL Integration

The system is integrated with the GraphQL API through resolvers in `src/graphql/resolvers.js`. The main queries that use the AI system are:

- `articlesByCategory`: Returns AI-processed articles for a specific category
- `searchArticles`: Returns AI-processed search results
- `topHeadlines`: Returns AI-processed top headlines
- `topStoriesAcrossCategories`: Returns aggregated top stories across multiple categories

## Configuration

The system uses the OpenAI API for language model capabilities. Configure your API key in the `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-3.5-turbo  # or another compatible model
```

## Testing

Run the test script to verify the system is working correctly:

```
node src/ai/test.js
```

## Extending the System

### Adding New Processing Capabilities

To add new processing capabilities, extend the `NewsProcessor` class with additional methods:

```javascript
// In newsProcessor.js
async analyzeReadability(article) {
  // Implementation
}
```

### Creating Custom Workflows

To create custom workflows, use the LangGraph API in the `NewsOrchestrator` class:

```javascript
// In newsOrchestrator.js
createCustomWorkflow() {
  const builder = createGraph(graphState);
  
  // Define nodes and edges
  
  return builder.compile();
}
```

### Performance Optimization

The system uses caching to improve performance. You can adjust cache settings in the `NewsAggregator` constructor:

```javascript
this.cache = new CacheManager({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 2000,
});
```

## Dependencies

- `@langchain/core`: Core LangChain functionality
- `@langchain/openai`: OpenAI integration for LangChain
- `@langchain/langgraph`: Graph-based workflow orchestration
- `zod`: Schema validation for structured outputs