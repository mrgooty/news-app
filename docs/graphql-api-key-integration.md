# GraphQL Services and API Key Integration

This document provides information about the fixes and improvements made to the GraphQL services and API key integration in the news application.

## Overview of Changes

1. **API Key Configuration**
   - Created a proper `.env` file with all required API keys
   - Updated `.env.template` to match the actual variable names used in the code
   - Added support for additional news API services

2. **Error Handling Improvements**
   - Enhanced the `HttpClient` class with better error messages
   - Added retry logic with exponential backoff for transient errors
   - Improved logging for API request failures

3. **Service Availability Management**
   - Added better detection of API key validity
   - Enhanced the `NewsServiceManager` to provide clearer feedback about service availability
   - Added an endpoint to check API key status

4. **CORS Configuration**
   - Improved CORS configuration to ensure proper client-server communication
   - Added support for multiple client origins in development and production

5. **Testing Tools**
   - Created a test script to verify GraphQL functionality
   - Added endpoints to check API status and refresh service availability

## API Key Configuration

The application uses several news API services, each requiring its own API key. The following API keys are supported:

```
NEWS_API_KEY=your_newsapi_key_here
GNEWS_API_KEY=your_gnews_api_key_here
GUARDIAN_API_KEY=your_guardian_api_key_here
NYT_API_KEY=your_nytimes_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here
MEDIASTACK_API_KEY=your_mediastack_api_key_here
NEWSCATCHER_API_KEY=your_newscatcher_api_key_here
BING_NEWS_API_KEY=your_bing_news_api_key_here
CURRENTS_API_KEY=your_currents_api_key_here
WORLD_NEWS_API_KEY=your_world_news_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

For testing purposes, we've used placeholder keys prefixed with `test_`. In a production environment, these should be replaced with actual API keys.

## Service Fallback Mechanism

The application uses a fallback mechanism to ensure it can retrieve news articles even if some API services are unavailable:

1. The `NewsServiceManager` tries each configured service in order
2. If a service fails or returns no results, it tries the next service
3. If all services fail, it falls back to sample data

This ensures the application remains functional even when API keys are missing or invalid.

## Testing the GraphQL API

We've created a test script to verify the GraphQL API functionality. To run the tests:

1. Start the server:
   ```bash
   cd news-app/server
   npm install
   npm start
   ```

2. In a new terminal, run the test script:
   ```bash
   cd news-app/server
   node tests/test-graphql.js
   ```

The test script will:
- Check server health
- Verify API key configuration
- Test various GraphQL queries
- Determine if the server is using real data or sample data

## API Status Endpoint

We've added an endpoint to check the status of API keys and services:

```
GET http://localhost:4000/api-status
```

This endpoint returns:
- Which API keys are configured
- Which services are available
- The current environment (development/production)

## Service Refresh Endpoint

To force a refresh of service availability:

```
POST http://localhost:4000/refresh-services
```

This is useful after updating API keys to verify they're working correctly.

## Common Issues and Solutions

### Using Sample Data Instead of Real Data

If the application is using sample data instead of real data:

1. Check that your `.env` file contains valid API keys
2. Verify API key validity using the `/api-status` endpoint
3. Check the server logs for API-related errors
4. Try refreshing service availability with the `/refresh-services` endpoint

### CORS Issues

If the client can't connect to the server due to CORS issues:

1. Verify that the client is using the correct GraphQL URL
2. Check that the server's CORS configuration includes the client's origin
3. Ensure the client is sending the correct headers with GraphQL requests

### Rate Limiting

Some news APIs have strict rate limits. If you encounter rate limiting:

1. The enhanced `HttpClient` now includes retry logic with exponential backoff
2. Consider adding more API keys from different services to distribute the load
3. Implement additional caching to reduce the number of API calls

## Next Steps

For further improvements:

1. Implement a more sophisticated caching mechanism
2. Add support for more news API services
3. Enhance the fallback mechanism to consider API reliability and rate limits
4. Add monitoring for API usage to avoid hitting rate limits