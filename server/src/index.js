const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger')('Server');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = process.env.PORT || 4000;

  // Pre-routing logger to see all incoming requests for debugging
  app.use((req, res, next) => {
    logger(`INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
    next();
  });

  // Set up Apollo Server for GraphQL
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  // Middleware
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  }));
  app.use(express.json());

  // Set up both GraphQL and REST API endpoints
  app.use('/graphql', expressMiddleware(server));
  app.use('/api', apiRoutes);

  // Serve static files from the React app in production
  if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientBuildPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }

  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  logger(`🚀 Server ready at http://localhost:${PORT}`);
  logger(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
}

startServer().catch(error => {
  logger('ERROR: Failed to start the server:', error);
});