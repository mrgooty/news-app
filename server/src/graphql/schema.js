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
  }

  # The main queries available to the client
  type Query {
    # Get all available news categories
    categories: [Category!]

    # Get all available locations for news filtering
    locations: [Location!]

    # Get a feed of news articles for a specific category and optional location
    newsByCategory(category: String!, location: String): [Article]
    
    # Search for news articles by a keyword, with an optional location filter
    searchNews(keyword: String!, location: String): [Article]

    # Analyze an article to get a summary and sentiment analysis
    analyzeArticle(content: String!, title: String!): AnalysisResult
  }
`;

module.exports = { typeDefs };