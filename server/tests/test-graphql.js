const axios = require('axios');

// Configuration
const SERVER_URL = 'http://localhost:4000';
const GRAPHQL_ENDPOINT = `${SERVER_URL}/graphql`;

// Helper function to make GraphQL requests
async function executeGraphQLQuery(query, variables = {}) {
  try {
    const response = await axios.post(GRAPHQL_ENDPOINT, {
      query,
      variables
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('GraphQL request failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Test queries
const queries = {
  getCategories: `
    query {
      categories {
        id
        name
        description
      }
    }
  `,
  
  getLocations: `
    query {
      locations {
        id
        name
        code
      }
    }
  `,
  
  getTopHeadlines: `
    query GetTopHeadlines($category: String, $location: String, $limit: Int) {
      topHeadlines(category: $category, location: $location, limit: $limit) {
        articles {
          id
          title
          description
          url
          imageUrl
          source
          publishedAt
          category
        }
        errors {
          source
          message
        }
      }
    }
  `,
  
  getArticlesByCategory: `
    query GetArticlesByCategory($category: String!, $limit: Int) {
      articlesByCategory(category: $category, limit: $limit) {
        articles {
          id
          title
          description
          url
          imageUrl
          source
          publishedAt
          category
        }
        errors {
          source
          message
        }
      }
    }
  `,
  
  searchArticles: `
    query SearchArticles($query: String!, $limit: Int) {
      searchArticles(query: $query, limit: $limit) {
        articles {
          id
          title
          description
          url
          imageUrl
          source
          publishedAt
          category
        }
        errors {
          source
          message
        }
      }
    }
  `
};

// Run tests
async function runTests() {
  console.log('🧪 Starting GraphQL API tests...');
  
  try {
    // First check server health
    console.log('\n📡 Checking server health...');
    const healthResponse = await axios.get(`${SERVER_URL}/health`);
    console.log(`Server health: ${healthResponse.status === 200 ? '✅ OK' : '❌ Not OK'}`);
    
    // Check API status
    console.log('\n🔑 Checking API keys status...');
    const apiStatusResponse = await axios.get(`${SERVER_URL}/api-status`);
    console.log('API Status:', JSON.stringify(apiStatusResponse.data, null, 2));
    
    // Test categories query
    console.log('\n📋 Testing categories query...');
    const categoriesResult = await executeGraphQLQuery(queries.getCategories);
    console.log(`Categories: ${categoriesResult.data.categories.length} found`);
    console.log(categoriesResult.data.categories.map(c => c.name).join(', '));
    
    // Test locations query
    console.log('\n🌎 Testing locations query...');
    const locationsResult = await executeGraphQLQuery(queries.getLocations);
    console.log(`Locations: ${locationsResult.data.locations.length} found`);
    console.log(locationsResult.data.locations.map(l => `${l.name} (${l.code})`).join(', '));
    
    // Test top headlines query
    console.log('\n📰 Testing top headlines query...');
    const topHeadlinesResult = await executeGraphQLQuery(queries.getTopHeadlines, {
      limit: 5
    });
    
    const topHeadlinesArticles = topHeadlinesResult.data.topHeadlines.articles;
    const topHeadlinesErrors = topHeadlinesResult.data.topHeadlines.errors;
    
    console.log(`Top Headlines: ${topHeadlinesArticles.length} articles found`);
    if (topHeadlinesArticles.length > 0) {
      console.log('First article:', {
        title: topHeadlinesArticles[0].title,
        source: topHeadlinesArticles[0].source,
        category: topHeadlinesArticles[0].category
      });
    }
    
    if (topHeadlinesErrors) {
      console.log('Errors:', topHeadlinesErrors);
    }
    
    // Test articles by category query
    console.log('\n🔍 Testing articles by category query...');
    const categoryResult = await executeGraphQLQuery(queries.getArticlesByCategory, {
      category: 'technology',
      limit: 5
    });
    
    const categoryArticles = categoryResult.data.articlesByCategory.articles;
    const categoryErrors = categoryResult.data.articlesByCategory.errors;
    
    console.log(`Technology Articles: ${categoryArticles.length} found`);
    if (categoryArticles.length > 0) {
      console.log('First article:', {
        title: categoryArticles[0].title,
        source: categoryArticles[0].source,
        category: categoryArticles[0].category
      });
    }
    
    if (categoryErrors) {
      console.log('Errors:', categoryErrors);
    }
    
    // Test search query
    console.log('\n🔎 Testing search articles query...');
    const searchResult = await executeGraphQLQuery(queries.searchArticles, {
      query: 'artificial intelligence',
      limit: 5
    });
    
    const searchArticles = searchResult.data.searchArticles.articles;
    const searchErrors = searchResult.data.searchArticles.errors;
    
    console.log(`Search Results: ${searchArticles.length} found`);
    if (searchArticles.length > 0) {
      console.log('First article:', {
        title: searchArticles[0].title,
        source: searchArticles[0].source,
        category: searchArticles[0].category
      });
    }
    
    if (searchErrors) {
      console.log('Errors:', searchErrors);
    }
    
    console.log('\n✅ All tests completed!');
    
    // Determine if we're using sample data or real data
    const usingSampleData = 
      topHeadlinesArticles.every(a => !a.url || a.url.includes('example.com')) ||
      categoryArticles.every(a => !a.url || a.url.includes('example.com')) ||
      searchArticles.every(a => !a.url || a.url.includes('example.com'));
    
    if (usingSampleData) {
      console.log('\n⚠️ WARNING: The server appears to be using sample data. Check your API keys configuration.');
    } else {
      console.log('\n✅ The server appears to be using real data from the news APIs.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the tests
runTests();