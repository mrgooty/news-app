const express = require('express');
const http = require('http');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');
const BertAnalyzer = require('./ai/bertAnalyzer');
require('dotenv').config();

// Import the config to ensure it's properly loaded
const config = require('./config/config');

async function startServer() {
  // Create Express app and HTTP server
  const app = express();
  const httpServer = http.createServer(app);

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (error) => {
      // Log errors for debugging
      console.error('GraphQL Error:', error);
      
      // Return a sanitized error to the client
      return {
        message: error.message,
        path: error.path,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        },
      };
    },
  });

  // Start the Apollo Server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // You can add authentication and other context here
        return { 
          // Add any context values needed by resolvers
        };
      },
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('Server is running');
  });

  // API keys status endpoint
  app.get('/api-status', (req, res) => {
    // Check if API keys are configured
    const apiStatus = {};
    
    for (const [apiName, apiConfig] of Object.entries(config.newsApis)) {
      apiStatus[apiName] = {
        configured: Boolean(apiConfig.apiKey && apiConfig.apiKey !== 'your_' + apiName + '_key_here'),
      };
    }
    
    res.status(200).json({
      status: 'ok',
      apis: apiStatus,
    });
  });

  // BERT-based summarization and sentiment analysis
  const bert = new BertAnalyzer();
  app.post('/api/analyze', express.json({ limit: '1mb' }), async (req, res) => {
    const { title = '', content = '' } = req.body || {};
    if (!title && !content) {
      return res.status(400).json({ error: 'No article text provided' });
    }

    try {
      const text = `${title}\n${content}`.trim();
      const summary = await bert.summarize(text);
      const sentiment = await bert.analyzeSentiment(text);
      res.json({ summary, sentiment });
    } catch (err) {
      console.error('BERT analysis error:', err);
      res.status(500).json({ error: 'Failed to analyze article' });
    }
  });

  // Start the server
  const PORT = config.server.port;
  await new Promise(resolve => httpServer.listen({ port: PORT }, resolve));
  
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`API status available at http://localhost:${PORT}/api-status`);
}

// Start the server and handle errors
startServer().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});