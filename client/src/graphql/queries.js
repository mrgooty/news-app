import { gql } from '@apollo/client';

// Query to fetch all categories
export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      description
    }
  }
`;

// Query to fetch all locations
export const GET_LOCATIONS = gql`
  query GetLocations {
    locations {
      id
      name
      code
    }
  }
`;

// Query to fetch top headlines
export const GET_TOP_HEADLINES = gql`
  query GetTopHeadlines($category: String, $location: String, $limit: Int, $sources: [String]) {
    topHeadlines(category: $category, location: $location, limit: $limit, sources: $sources) {
      articles {
        id
        title
        description
        content
        url
        imageUrl
        source
        publishedAt
        category
        summary
        location
        entities
        topics
        sentiment
        importance
        relevanceScore
        finalScore
      }
      errors {
        source
        message
        code
      }
    }
  }
`;

// Query to fetch articles by category
export const GET_ARTICLES_BY_CATEGORY = gql`
  query GetArticlesByCategory($category: String!, $location: String, $limit: Int, $sources: [String]) {
    articlesByCategory(category: $category, location: $location, limit: $limit, sources: $sources) {
      articles {
        id
        title
        description
        content
        url
        imageUrl
        source
        publishedAt
        category
        summary
        location
        entities
        topics
        sentiment
        importance
        relevanceScore
        finalScore
      }
      errors {
        source
        message
        code
      }
    }
  }
`;

// Query to fetch top stories across multiple categories
export const GET_TOP_STORIES_ACROSS_CATEGORIES = gql`
  query GetTopStoriesAcrossCategories($categories: [String], $location: String, $limit: Int, $sources: [String]) {
    topStoriesAcrossCategories(categories: $categories, location: $location, limit: $limit, sources: $sources) {
      articles {
        id
        title
        description
        content
        url
        imageUrl
        source
        publishedAt
        category
        summary
        location
        entities
        topics
        sentiment
        importance
        relevanceScore
        finalScore
      }
      errors {
        source
        message
        code
      }
    }
  }
`;

// Query to search articles
export const SEARCH_ARTICLES = gql`
  query SearchArticles($query: String!, $category: String, $location: String, $limit: Int, $sources: [String]) {
    searchArticles(query: $query, category: $category, location: $location, limit: $limit, sources: $sources) {
      articles {
        id
        title
        description
        content
        url
        imageUrl
        source
        publishedAt
        category
        summary
        location
        entities
        topics
        sentiment
        importance
        relevanceScore
        finalScore
      }
      errors {
        source
        message
        code
      }
    }
  }
`;

export const GET_PREFERENCES_DATA = gql`
  query GetPreferencesData {
    categories {
      id
      name
    }
    locations {
      id
      name
      code
    }
  }
`;

export const GET_NEWS_BY_CATEGORY = gql`
  query GetNewsByCategory($category: String!, $location: String) {
    newsByCategory(category: $category, location: $location) {
      id
      title
      description
      url
      imageUrl
      source
      publishedAt
      category
    }
  }
`;

export const SEARCH_NEWS = gql`
  query SearchNews($keyword: String!, $location: String) {
    searchNews(keyword: $keyword, location: $location) {
      id
      title
      description
      url
      imageUrl
      source
      publishedAt
      category
    }
  }
`;

export const ANALYZE_ARTICLE = gql`
  query AnalyzeArticle($title: String!, $content: String!) {
    analyzeArticle(title: $title, content: $content) {
      summary
      sentiment
      sentimentLabel
    }
  }
`;