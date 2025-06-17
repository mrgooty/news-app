const express = require('express');
const http = require('http');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const cookieSession = require('cookie-session');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');
const BertAnalyzer = require('./ai/bertAnalyzer');
const NewsServiceManager = require('./services/newsServiceManager');
require('dotenv').config();

// Import the config to ensure it's properly loaded
const config = require('./config/config');

// Create a news service manager instance for API status checks
const newsServiceManager = new NewsServiceManager();

async function startServer() {
  // Create Express app and HTTP server
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'keyboard cat'],
    maxAge: 24 * 60 * 60 * 1000,
  }));

  // Enable CORS for all routes
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://github.com/rakshit444/news-sample-app'] // Replace with actual production domain
      : ['http://localhost:3000', 'http://localhost:5173'], // Development domains
    credentials: true
  }));

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
    cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://github.com/rakshit444/news-sample-app'] // Replace with actual production domain
        : ['http://localhost:3000', 'http://localhost:5173'], // Development domains
      credentials: true
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        prefs: req.session?.prefs || null,
        setPrefs: (p) => { req.session.prefs = p }
      })
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('Server is running');
  });

  // API keys status endpoint
  app.get('/api-status', async (req, res) => {
    // Check if API keys are configured
    const apiStatus = {};
    
    for (const [apiName, apiConfig] of Object.entries(config.newsApis)) {
      apiStatus[apiName] = {
        configured: Boolean(apiConfig.apiKey && apiConfig.apiKey !== 'your_' + apiName + '_key_here' && !apiConfig.apiKey.startsWith('test_')),
        key: apiConfig.apiKey ? `${apiConfig.apiKey.substring(0, 3)}...${apiConfig.apiKey.substring(apiConfig.apiKey.length - 3)}` : null,
      };
    }
    
    // Get service availability status
    const serviceStatus = newsServiceManager.getServiceStatus();
    
    res.status(200).json({
      status: 'ok',
      apis: apiStatus,
      services: serviceStatus,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Endpoint to refresh service availability
  app.post('/refresh-services', async (req, res) => {
    try {
      const status = await newsServiceManager.refreshServiceAvailability();
      res.status(200).json({
        status: 'ok',
        services: status,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
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
  console.log(`Service refresh available at http://localhost:${PORT}/refresh-services (POST)`);
}

// Start the server and handle errors
startServer().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});