# News App

AI-powered news aggregation: a React app (deployable to Vercel) backed by a Node GraphQL server, Neon Postgres, and fast local transformer models for article summarization and sentiment analysis.

## Tech Stack

- **Frontend**: React 19 + Vite + Apollo Client + Redux Toolkit, hosted on Vercel
- **Backend**: Node.js + Express + Apollo Server (GraphQL)
- **Database**: Neon Postgres — persistent analysis cache, user preferences, reading history
- **AI**: Local ONNX transformer models via `@xenova/transformers` (no API costs) — distilled BART for summarization, DistilBERT for sentiment. Lazy-loaded, chunked divide-and-conquer inference, results cached in Postgres.
- **News sources** (3, chosen for best free limits + quality): The Guardian, GNews, NY Times — plus Weatherstack for the weather widget.

## Project Structure

```
news-app/
├── vercel.json                 # Vercel config (builds the client)
├── client/                     # React frontend
│   └── src/
│       ├── components/         # UI components
│       ├── pages/              # Page components
│       ├── graphql/            # Apollo client + queries
│       ├── hooks/              # usePrefs, useArticleAnalysis, useWeather
│       ├── lib/                # userSync (personalization), utils
│       └── store/              # Redux slices
├── server/                     # Node.js backend
│   ├── scripts/                # test-keys.js, init-db.js
│   └── src/
│       ├── ai/                 # fastAnalyzer (summaries/sentiment), cacheManager
│       ├── db/                 # Neon Postgres pool + schema
│       ├── graphql/            # Schema and resolvers
│       ├── routes/             # REST endpoints (/api/analyze, ...)
│       ├── services/           # Guardian/GNews/NYT integrations, personalization, scrapers
│       └── config/             # Configuration
└── docs/
    └── news-api-guide.md       # API key signup links
```

## Setup

Prerequisites: Node.js 18+.

1. Install everything:
   ```bash
   npm run install:all
   ```

2. Configure `server/.env` (copy from `server/.env.template`):
   - `DATABASE_URL` — your Neon Postgres connection string
   - `GUARDIAN_API_KEY`, `GNEWS_API_KEY`, `NYT_API_KEY` — signup links in [docs/news-api-guide.md](docs/news-api-guide.md)
   - `WEATHER_API_KEY` — optional, for the weather widget

   The app runs with any subset of keys; missing sources are skipped automatically.

3. Initialize the database and verify keys:
   ```bash
   npm run db:init     # creates tables in Neon, confirms connectivity
   npm run test:keys   # live-tests every API key
   ```

4. Run locally (server on :4000, client on :5173):
   ```bash
   npm run dev
   ```

## Deploying

**Frontend → Vercel.** The repo root has a `vercel.json` that builds `client/`:

```bash
npm i -g vercel
vercel deploy --prod
```

In the Vercel project settings, set the environment variable `VITE_API_URL` to your hosted backend URL (e.g. `https://your-server.onrender.com`).

**Backend → any Node host** (Render, Railway, Fly.io). It can't run on Vercel serverless — the AI models and the Puppeteer fallback scraper need a persistent process. Set the same env vars as `server/.env` and run `npm start` from `server/`. Set `WARM_MODELS=true` in production so the first analysis request is instant.

## Features

- Browse and search news by category and location, aggregated across the 3 sources with fallback and deduplication
- One-click AI article analysis: summary, sentiment with confidence, key topics, and related-search suggestions — computed locally, cached in Neon so each article is only analyzed once
- Personalized feed ranking from stored preferences + reading history (category, source, and keyword affinity with recency decay)
- Cross-device preferences via anonymous user IDs stored in Postgres
- Weather widget with location detection

## How Analysis Works

1. Article text is fetched with plain HTTP + Mozilla Readability (~0.5s); Puppeteer is used only as a fallback for JS-rendered pages.
2. Text is split into sentence-boundary chunks; all chunks are summarized and sentiment-scored **in parallel**, then reduced (summary-of-summaries, length-weighted sentiment).
3. Results persist to the `article_analysis` table — repeat requests for the same URL return in milliseconds, for every user, across restarts.

## Useful Commands

| Command | What it does |
|---|---|
| `npm run dev` | Run server + client concurrently |
| `npm run db:init` | Create/verify Neon tables |
| `npm run test:keys` | Live-test all API keys |
| `npm test` | Run server + client tests |
| `npm run build` | Production build of the client |

## License

MIT
