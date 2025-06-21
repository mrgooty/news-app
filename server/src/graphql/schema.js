const typeDefs = `#graphql
  # Represents a news article from any source
  type Article {
    id: ID!
    title: String!
    description: String
    content: String
    url: String!
    imageUrl: String
    source: String
    publishedAt: String
    category: String
    cursor: String!
  }

  # Represents a news category available for selection
  type Category {
    id: ID!
    name: String!
    description: String
  }

  # Represents a location (country) available for selection
  type Location {
    id: ID!
    name: String!
    code: String!
  }

  # Represents the result of an article analysis
  type AnalysisResult {
    summary: String
    sentiment: String
    sentimentLabel: String
    confidence: Float
    entities: [Entity]
  }

  # Represents an entity extracted from article content
  type Entity {
    name: String!
    type: String!
    confidence: Float
  }
  
  # Represents an error from a news source
  type Error {
    source: String!
    message: String!
    code: String
    retryable: Boolean!
  }

  # Page info for cursor-based pagination
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Connection pattern for articles with cursor-based pagination
  type ArticleConnection {
    edges: [ArticleEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    errors: [Error]
  }

  # Edge in the connection pattern
  type ArticleEdge {
    node: Article!
    cursor: String!
  }

  # Aggregation metadata
  type AggregationMeta {
    sources: [String!]!
    lastUpdated: String!
    totalArticles: Int!
    processingTime: Float!
  }

  # The main queries available to the client
  type Query {
    # Get all available news categories
    categories: [Category!]!

    # Get all available locations for news filtering
    locations: [Location!]!

    # Get top headlines for a specific category and optional location
    topHeadlines(
      category: String
      location: String
      first: Int = 20
      after: String
    ): ArticleConnection!

    # Get a feed of news articles for a specific category and optional location
    newsByCategory(
      category: String!
      location: String
      first: Int = 20
      after: String
    ): ArticleConnection!
    
    # Get top stories across multiple categories
    topStoriesAcrossCategories(
      categories: [String!]!
      location: String
      first: Int = 20
      after: String
    ): ArticleConnection!

    # Search for news articles by a keyword, with an optional location filter
    searchNews(
      keyword: String!
      location: String
      first: Int = 20
      after: String
    ): ArticleConnection!

    # Analyze an article to get a summary and sentiment analysis
    analyzeArticle(content: String!, title: String!): AnalysisResult!

    # Get aggregation metadata
    aggregationMeta: AggregationMeta!
  }

  # Mutations for real-time updates
  type Mutation {
    # Refresh articles for a category
    refreshCategory(category: String!, location: String): ArticleConnection!
    
    # Update user preferences and get fresh articles
    updatePreferencesAndRefresh(
      categories: [String!]!
      location: String
    ): ArticleConnection!
  }

  # Subscriptions for real-time updates
  type Subscription {
    # Subscribe to new articles in a category
    newArticlesInCategory(category: String!, location: String): Article!
    
    # Subscribe to breaking news
    breakingNews: Article!
  }
`;

export default typeDefs;