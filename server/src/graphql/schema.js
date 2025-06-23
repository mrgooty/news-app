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

  # Represents an entity extracted from article content
  type Entity {
    name: String!
    type: String!
    confidence: Float
  }
  
  # Aggregation metadata
  type AggregationMeta {
    sources: [String!]!
    lastUpdated: String!
    totalArticles: Int!
    processingTime: Float!
  }

  # Represents additional data about an article
  type ArticleData {
    title: String
    contentLength: Int
    wordCount: Int
    readingTime: Int
    summary: String
  }

  # Represents weather information
  type Weather {
    location: String!
    temperature: Int!
    feelsLike: Int!
    description: String!
    icon: String
    humidity: Int!
    windSpeed: Float!
    windDirection: String!
    pressure: Int!
    visibility: Float!
    uvIndex: Int!
    lastUpdated: String!
  }

  # Represents location information
  type LocationInfo {
    ip: String
    country: String
    city: String
    region: String
    zip: String
    lat: Float
    lon: Float
    formatted: String
  }

  type ArticleAnalysis {
    summary: String
    sentiment: String
    sentimentLabel: String
    confidence: Float
    entities: [Entity]
  }

  type ComprehensiveAnalysis {
    url: String!
    analysis: ArticleAnalysis
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
    analyzeArticle(content: String!, title: String): ArticleAnalysis

    # Get aggregation metadata
    aggregationMeta: AggregationMeta!

    # Get current weather for a location
    getWeather(location: String): Weather
    getWeatherByCoordinates(lat: Float!, lon: Float!): Weather
    getWeatherByZipCode(zipCode: String!): Weather
    getUserLocation: LocationInfo

    # Get local news for a location
    getLocalNews(location: String, first: Int = 20): ArticleConnection!

    # Get user preferences
    getPreferences: UserPreferences

    # Get comprehensive analysis of an article
    comprehensiveAnalysis(url: String!): ComprehensiveAnalysis
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

    savePreferences(categories: [String], location: String, zipCode: String): UserPreferences
    # setAIParameters(parameters: AIParametersInput!): AIParameters
  }

  # Subscriptions for real-time updates
  type Subscription {
    # Subscribe to new articles in a category
    newArticlesInCategory(category: String!, location: String): Article!
    
    # Subscribe to breaking news
    breakingNews: Article!
  }

  type UserPreferences {
    selectedCategories: [String]
    locations: [String!]
    zipCode: String
  }

  type AIParameters {
    id: ID
  }

  input AIParametersInput {
    id: ID
  }

  type ArticleError {
    source: String
    message: String
    code: String
    retryable: Boolean
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }
  
  type ArticleEdge {
    cursor: String!
    node: Article!
  }

  type ArticleConnection {
    edges: [ArticleEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    errors: [ArticleError]
  }
`;

export default typeDefs;