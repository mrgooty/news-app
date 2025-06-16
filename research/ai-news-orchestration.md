# AI-Powered News Orchestration System

This document explains the implementation of the LangChain and LangGraph-based news orchestration system for the News App.

## Overview

The AI-powered news orchestration system processes, ranks, filters, and aggregates news content from multiple sources. It uses LangChain for content analysis and LangGraph for workflow orchestration.

## Architecture

The system consists of several key components:

1. **NewsProcessor**: Handles individual text processing tasks using LangChain
2. **NewsOrchestrator**: Manages the workflow using LangGraph
3. **TextUtils**: Provides utilities for text analysis and similarity comparison
4. **CacheManager**: Improves performance by caching processed results
5. **NewsAggregator**: High-level interface for the entire system

## Key Features

### Content Processing

- **Summarization**: Condenses news articles into concise summaries
- **Categorization**: Assigns articles to appropriate categories
- **Entity Extraction**: Identifies key entities mentioned in articles
- **Sentiment Analysis**: Determines the emotional tone of content

### Ranking and Filtering

- **Relevance Scoring**: Evaluates how relevant an article is to its category
- **Importance Rating**: Assesses the significance of news stories
- **Recency Weighting**: Prioritizes newer content
- **Combined Scoring**: Balances multiple factors for final ranking

### Deduplication

- **URL-based**: Removes exact duplicates with the same URL
- **Content-based**: Uses AI to identify articles covering the same story
- **Clustering**: Groups similar articles to ensure topic diversity

### Aggregation

- **Cross-Category Selection**: Selects top stories from multiple categories
- **Diversity Enforcement**: Ensures variety in the aggregated content
- **Balanced Distribution**: Maintains representation across categories

## LangGraph Workflow

The system uses LangGraph to create a directed graph of processing steps:

1. **Article Processing Graph**:
   - Summarize → Categorize → Extract Info → Calculate Score → Finalize Article

2. **Batch Processing Graph**:
   - Process Articles → Rank Articles

## Performance Optimization

- **Caching**: Stores processed articles to avoid redundant processing
- **Parallel Processing**: Handles multiple articles simultaneously
- **Selective Processing**: Only processes what's needed for the current request

## GraphQL Integration

The system integrates with the GraphQL API through resolvers:

- **articlesByCategory**: Returns AI-processed articles for a specific category
- **searchArticles**: Returns AI-processed search results
- **topHeadlines**: Returns AI-processed top headlines
- **topStoriesAcrossCategories**: Returns aggregated top stories across multiple categories

## Usage Examples

### Processing a Single Article

```javascript
const newsAggregator = new NewsAggregator();
const processedArticle = await newsAggregator.processArticle(article);
```

### Getting Top Stories Across Categories

```javascript
const newsAggregator = new NewsAggregator();
const topStories = await newsAggregator.getTopStories({
  technology: techArticles,
  business: businessArticles,
  sports: sportsArticles
}, 15);
```

## Future Enhancements

1. **Personalization**: Adapt content selection based on user preferences
2. **Topic Tracking**: Follow developing stories over time
3. **Fact Checking**: Verify information across multiple sources
4. **Multilingual Support**: Process and analyze content in multiple languages
5. **Trend Detection**: Identify emerging topics and trends