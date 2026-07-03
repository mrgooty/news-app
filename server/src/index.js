import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import './config/config.js'; // loads .env before anything else
import typeDefs from './graphql/schema.js';
import resolvers from './graphql/resolvers.js';
import apiRoutes from './routes/api.js';
import { initDb, isDbAvailable } from './db/index.js';
import { warmModels } from './ai/fastAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
});

await server.start();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: isDbAvailable(), uptime: process.uptime() });
});

app.use('/graphql', cors(), expressMiddleware(server));
app.use('/api', apiRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 4000;

// Connect to Neon Postgres (non-fatal if unavailable)
await initDb();

// Optionally pre-load AI models in the background so the first
// analysis request doesn't pay the warm-up cost.
if (process.env.WARM_MODELS === 'true') {
  warmModels();
}

httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
  console.log(`🗄️  Database: ${isDbAvailable() ? 'Neon Postgres connected' : 'not connected (in-memory mode)'}`);
});
