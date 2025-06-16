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
  }

  # News category type
  type Category {
    id: ID!
    name: String!
    description: String
  }

  # Queries
  type Query {
    # Get all available news categories
    categories: [Category!]!
    
    # Get news articles by category
    articlesByCategory(category: String!, limit: Int): [Article!]!
    
    # Get a specific article by ID
    article(id: ID!): Article
    
    # Search for articles
    searchArticles(query: String!, limit: Int): [Article!]!
  }

  # Root schema
  schema {
    query: Query
  }
`;

module.exports = { typeDefs };