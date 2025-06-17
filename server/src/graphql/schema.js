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
    # New fields from AI processing
    entities: [String]
    topics: [String]
    sentiment: String
    importance: Float
    relevanceScore: Float
    finalScore: Float
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
    prefs: Prefs
  }

  type Mutation {
    setPrefs(categories: [String!]!, locations: [String!]!): Prefs
  }

  # Root schema
  schema {
    query: Query
    mutation: Mutation
  }
`;

module.exports = { typeDefs };