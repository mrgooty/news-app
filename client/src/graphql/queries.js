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
  query AnalyzeArticle($url: String!) {
    analyzeArticle(url: $url) {
      articleData {
        title
        wordCount
        readingTime\n        summary
        summary
      }
      sentimentAnalysis {
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
  }
`;

// Query to get weather information
export const GET_WEATHER = gql`
  query GetWeather($location: String) {
    getWeather(location: $location) {
      location
      temperature
      feelsLike
      description
      icon
      humidity
      windSpeed
      windDirection
      pressure
      visibility
      uvIndex
      lastUpdated
    }
  }
`;

// Query to get weather by coordinates
export const GET_WEATHER_BY_COORDINATES = gql`
  query GetWeatherByCoordinates($lat: Float!, $lon: Float!) {
    getWeatherByCoordinates(lat: $lat, lon: $lon) {
      location
      temperature
      feelsLike
      description
      icon
      humidity
      windSpeed
      windDirection
      pressure
      visibility
      uvIndex
      lastUpdated
    }
  }
`;

// Query to get weather by US zip code
export const GET_WEATHER_BY_ZIP_CODE = gql`
  query GetWeatherByZipCode($zipCode: String!) {
    getWeatherByZipCode(zipCode: $zipCode) {
      location
      temperature
      feelsLike
      description
      icon
      humidity
      windSpeed
      windDirection
      pressure
      visibility
      uvIndex
      lastUpdated
    }
  }
`;

// Query to get user location
export const GET_USER_LOCATION = gql`
  query GetUserLocation {
    getUserLocation {
      country
      countryCode
      region
      regionCode
      city
      zip
      lat
      lon
      timezone
      formatted
    }
  }
`;

// Query to get local news
export const GET_LOCAL_NEWS = gql`
  query GetLocalNews($location: String, $first: Int) {
    getLocalNews(location: $location, first: $first) {
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
