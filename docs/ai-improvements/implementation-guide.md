# AI Improvements Implementation Guide

This technical guide explains the implementation details of the AI improvements made to the news application.

## Implementation Overview

The AI capabilities have been enhanced through several key components:

1. `EnhancedCacheManager`: Improved caching system for AI-generated content
2. `ImprovedNewsProcessor`: Enhanced AI logic for text processing
3. `ImprovedNewsOrchestrator`: Optimized workflow orchestration
4. `ImprovedNewsAggregator`: High-level interface with performance monitoring

## Component Details

### EnhancedCacheManager

The `EnhancedCacheManager` provides efficient caching with content-type specific TTLs.

#### Key Features:

- In-memory caching with LRU eviction
- Content-type specific TTL settings
- Cache statistics and monitoring
- Automatic cleanup of expired items

#### Implementation Details:

```javascript
// Cache by content type with different TTLs
this.contentTypeTTL = config.cache.ttlByType || {
  summary: 24 * 60 * 60 * 1000,    // 24 hours for summaries
  category: 24 * 60 * 60 * 1000,   // 24 hours for categories
  sentiment: 24 * 60 * 60 * 1000,  // 24 hours for sentiment analysis
  entities: 24 * 60 * 60 * 1000,   // 24 hours for entity extraction
  relevance: 12 * 60 * 60 * 1000,  // 12 hours for relevance scores
  articles: 30 * 60 * 1000,        // 30 minutes for article lists
};
```

#### Usage:

```javascript
// Get or compute with content-type specific TTL
const summary = await cache.getOrCompute(
  cacheKey,
  async () => processor.summarizeArticle(article),
  null,
  'summary'  // Uses the TTL for summaries
);
```

### ImprovedNewsProcessor

The `ImprovedNewsProcessor` enhances the AI logic with optimized prompts and fallback mechanisms.

#### Key Features:

- Optimized prompts for better results
- Multiple fallback mechanisms
- Rate limiting and API usage tracking
- Local processing options with BERT

#### Implementation Details:

```javascript
// Execute an AI operation with retry and fallback logic
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
```

### ImprovedNewsOrchestrator

The `ImprovedNewsOrchestrator` optimizes the workflow for processing news articles.

#### Key Features:

- LangGraph-based workflow orchestration
- Batch processing with throttling
- Parallel processing where appropriate
- Comprehensive error handling

#### Implementation Details:

```javascript
// Process articles in batches to avoid overwhelming the API
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
```

### ImprovedNewsAggregator

The `ImprovedNewsAggregator` provides a high-level interface with performance monitoring.

#### Key Features:

- Performance metrics tracking
- Diversity-aware article ranking
- Efficient caching integration
- Comprehensive error handling

#### Implementation Details:

```javascript
// Rank articles by relevance and quality with diversity boost
async rankArticles(articles, options = {}) {
  const startTime = Date.now();
  this.metrics.requestCount++;
  
  const {
    recencyWeight = 0.3,
    scoreWeight = 0.7,
    diversityBoost = 0.1,
  } = options;

  try {
    // Process articles if they haven't been processed yet
    const processedArticles = await this.processArticles(articles);

    if (!this.aiEnabled) {
      return processedArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    
    // Calculate recency score (0-10) based on publishedAt date
    const now = new Date();
    const articlesWithRecencyScore = processedArticles.map(article => {
      // ... recency score calculation ...
      
      // Calculate combined score
      const finalScore = article.finalScore || 5;
      const combinedScore = (recencyScore * recencyWeight) + (finalScore * scoreWeight);
      
      return {
        ...article,
        recencyScore,
        combinedScore,
      };
    });
    
    // Apply diversity boost
    if (diversityBoost > 0) {
      // ... diversity boost implementation ...
    }
    
    // Sort by combined score in descending order
    const rankedArticles = articlesWithRecencyScore.sort((a, b) => b.combinedScore - a.combinedScore);
    
    const endTime = Date.now();
    this.metrics.rankArticlesTime.push(endTime - startTime);
    
    return rankedArticles;
  } catch (error) {
    // ... error handling ...
  }
}
```

## Integration with GraphQL

The GraphQL resolvers have been updated to use the improved AI components:

```javascript
// Initialize the improved AI news aggregator
const newsAggregator = new ImprovedNewsAggregator();

// Example resolver using improved AI
topHeadlines: async (_, { category, location, limit = 10, sources }) => {
  try {
    const result = await newsServiceManager.getTopHeadlines(category, location, limit * 2, sources);
    
    if (result.articles && result.articles.length > 0) {
      // Process all articles with AI
      const processedArticles = await newsAggregator.processArticles(result.articles);
      
      // Rank the processed articles
      const rankedArticles = await newsAggregator.rankArticles(processedArticles, {
        recencyWeight: 0.4,
        scoreWeight: 0.6,
        diversityBoost: 0.1
      });
      
      // Limit to the requested number
      result.articles = rankedArticles.slice(0, limit);
    }
    
    return result;
  } catch (error) {
    // ... error handling ...
  }
}
```

## Performance Monitoring

A new GraphQL query has been added to monitor performance:

```graphql
# Get performance metrics
performanceMetrics: PerformanceMetrics!
```

Implementation:

```javascript
// Get performance metrics
performanceMetrics: async () => {
  try {
    const metrics = newsAggregator.getPerformanceMetrics();
    return {
      cacheHitRate: metrics.cacheStats?.hitRate || '0%',
      averageProcessingTime: metrics.averageProcessArticleTime || 0,
      totalRequests: metrics.totalRequestCount || 0,
      apiCalls: metrics.apiUsage?.totalCalls || 0,
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      cacheHitRate: '0%',
      averageProcessingTime: 0,
      totalRequests: 0,
      apiCalls: 0,
    };
  }
}
```

## Configuration

The configuration has been enhanced to support the new AI capabilities:

```javascript
// LangChain/OpenAI configuration
ai: {
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: process.env.AI_MODEL || 'gpt-3.5-turbo',
  fallbackModel: 'gpt-3.5-turbo', // Fallback model if primary is unavailable
  temperature: 0.1, // Lower temperature for more consistent results
  maxTokens: 500, // Default max tokens for responses
  requestTimeout: 30000, // 30 seconds timeout for API requests
  retryAttempts: 3, // Number of retry attempts for failed requests
  rateLimits: {
    requestsPerMinute: 60, // Default rate limit
    tokensPerMinute: 90000, // Default token rate limit
  },
  // Feature flags for AI capabilities
  features: {
    summarization: true,
    categorization: true,
    sentimentAnalysis: true,
    entityExtraction: true,
    relevanceScoring: true,
    deduplication: true,
    fallbackToLocal: true, // Use local models as fallback
  }
}
```

## Error Handling

Comprehensive error handling has been implemented throughout the application:

1. Multiple fallback mechanisms when AI services fail
2. Graceful degradation to simpler processing
3. Detailed error logging and reporting
4. Error information included in API responses

## Testing

To test the AI improvements:

1. Make GraphQL requests to the various endpoints
2. Monitor performance using the `performanceMetrics` query
3. Check cache hit rates and processing times
4. Verify that fallback mechanisms work when API is unavailable