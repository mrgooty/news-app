const express = require('express');
const http = require('http');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');
require('dotenv').config();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  // Start the Apollo Server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server)
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('Server is running');
  });

  // Start the server
  const PORT = process.env.PORT || 4000;
  await new Promise(resolve => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

startServer().catch(err => {
  console.error('Error starting server:', err);
});