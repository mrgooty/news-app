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
  query GetTopHeadlines($category: String, $location: String, $first: Int, $after: String) {
    topHeadlines(category: $category, location: $location, first: $first, after: $after) {
      edges {
        node {
          id
          title
          description
          content
          url
          imageUrl
          source
          publishedAt
          category
          cursor
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
      errors {
        source
        message
        code
        retryable
      }
    }
  }
`;

// Query to fetch articles by category
export const GET_ARTICLES_BY_CATEGORY = gql`
  query GetArticlesByCategory($category: String!, $location: String, $first: Int, $after: String) {
    newsByCategory(category: $category, location: $location, first: $first, after: $after) {
      edges {
        node {
          id
          title
          description
          content
          url
          imageUrl
          source
          publishedAt
          category
          cursor
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
      errors {
        source
        message
        code
        retryable
      }
    }
  }
`;

// Query to fetch top stories across multiple categories
export const GET_TOP_STORIES_ACROSS_CATEGORIES = gql`
  query GetTopStoriesAcrossCategories($categories: [String!]!, $location: String, $first: Int, $after: String) {
    topStoriesAcrossCategories(categories: $categories, location: $location, first: $first, after: $after) {
      edges {
        node {
          id
          title
          description
          content
          url
          imageUrl
          source
          publishedAt
          category
          cursor
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
      errors {
        source
        message
        code
        retryable
      }
    }
  }
`;

// Query to search articles
export const SEARCH_ARTICLES = gql`
  query SearchArticles($keyword: String!, $location: String, $first: Int, $after: String) {
    searchNews(keyword: $keyword, location: $location, first: $first, after: $after) {
      edges {
        node {
          id
          title
          description
          content
          url
          imageUrl
          source
          publishedAt
          category
          cursor
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
      errors {
        source
        message
        code
        retryable
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
  query GetNewsByCategory($category: String!, $location: String, $first: Int, $after: String) {
    newsByCategory(category: $category, location: $location, first: $first, after: $after) {
      edges {
        node {
          id
          title
          description
          url
          imageUrl
          source
          publishedAt
          category
          cursor
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
      errors {
        source
        message
        code
        retryable
      }
    }
  }
`;

export const ANALYZE_ARTICLE = gql`
  query AnalyzeArticle($title: String!, $content: String!) {
    analyzeArticle(title: $title, content: $content) {
      summary
      sentiment
      sentimentLabel
      confidence
      entities {
        name
        type
        confidence
      }
    }
  }
`;