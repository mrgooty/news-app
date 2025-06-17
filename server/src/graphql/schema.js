const typeDefs = `#graphql
  # News article type
  type Article {
    id: ID!
    title: String!
    description: String
    content: String
    url: String
    imageUrl: String
    source: String
    publishedAt: String
    category: String
    summary: String
    location: String
    # Fields from AI processing
    entities: [String]
    topics: [String]
    sentiment: String
    importance: Float
    relevanceScore: Float
    finalScore: Float
    recencyScore: Float
    combinedScore: Float
    processingError: String
  }

  # News category type
  type Category {
    id: ID!
    name: String!
    description: String
  }

  # News source type
  type Source {
    id: ID!
    name: String!
    description: String
    available: Boolean
  }

  # Location type
  type Location {
    id: ID!
    name: String!
    code: String!
  }

  type Prefs {
    categories: [String!]!
    locations: [String!]!
  }

  # Error type for handling API failures
  type ApiError {
    source: String!
    message: String!
    code: String
  }

  # News response with potential errors
  type NewsResponse {
    articles: [Article!]!
    errors: [ApiError!]
  }

  # Performance metrics type
  type PerformanceMetrics {
    cacheHitRate: String!
    averageProcessingTime: Float!
    totalRequests: Int!
    apiCalls: Int!
  }

  # Response for mutations
  type MutationResponse {
    success: Boolean!
    message: String
  }

  # Queries
  type Query {
    # Get all available news categories
    categories: [Category!]!
    
    # Get all available news sources
    sources: [Source!]!
    
    # Get all available locations
    locations: [Location!]!
    
    # Get news articles by category and optional location
    articlesByCategory(category: String!, location: String, limit: Int, sources: [String]): NewsResponse!
    
    # Get a specific article by ID
    article(id: ID!): Article
    
    # Search for articles with optional category and location filters
    searchArticles(query: String!, category: String, location: String, limit: Int, sources: [String]): NewsResponse!
    
    # Get top headlines with optional filters
    topHeadlines(category: String, location: String, limit: Int, sources: [String]): NewsResponse!
    
    # Get top stories across multiple categories
    topStoriesAcrossCategories(categories: [String], limit: Int, location: String, sources: [String]): NewsResponse!
    
    # Get performance metrics
    performanceMetrics: PerformanceMetrics!
    
    # Get user preferences
    prefs: Prefs
  }

  type Mutation {
    # Set user preferences
    setPrefs(categories: [String!]!, locations: [String!]!): Prefs
    
    # Reset performance metrics
    resetMetrics: MutationResponse!
  }

  # Root schema
  schema {
    query: Query
    mutation: Mutation
  }
`;

module.exports = { typeDefs };