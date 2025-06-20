# News App

A full-stack web application for AI-powered news aggregation from multiple sources.

## Project Overview

This application aggregates news from multiple free news APIs, categorizes them, and provides a clean interface for browsing news by category. It uses AI to enhance the news aggregation process.

## Tech Stack

- **Frontend**: React with Apollo Client for GraphQL
- **Backend**: Node.js with Express and Apollo Server
- **API**: GraphQL
- **AI**: LangChain and LangGraph orchestrate advanced language models (ALMs)
  for Natural Language Processing (NLP) tasks such as summarizing articles,
  deduplicating similar content, and ranking results. This provides concise,
  relevant news across sources.

## Project Structure

```
news-app/
├── client/                      # React frontend
│   ├── public/                  # Static assets
│   └── src/                     # React source code
│       ├── components/          # UI components
│       ├── pages/               # Page components
│       └── graphql/             # GraphQL queries
├── server/                      # Node.js backend
│   ├── src/                     # Server source code
│   │   ├── graphql/             # GraphQL schema and resolvers
│   │   ├── services/            # News API integrations
│   │   ├── ai/                  # LangChain and LangGraph orchestration
│   │   └── config/              # Configuration including API keys
│   └── .env                     # Environment variables (gitignored)
└── research/                    # API research findings
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/mrgooty/news-app.git
   cd news-app
   ```

2. Install dependencies for the server:
   ```
   cd server
   npm install
   ```

3. Install dependencies for the client:
   ```
   cd ../client
   npm install
   ```

4. Set up environment variables:
   - Copy `server/.env.template` to `server/.env`.
   - Add your API keys for the news services **and** set `OPENAI_API_KEY` with your ChatGPT key.
   - (Optional) copy `client/.env.template` to `client/.env` to override the GraphQL URL.
   - The server integrates [NewsAPI.org](https://newsapi.org/) via `newsApiService`. The older `newsService` file is deprecated and not used.

### Running the Application

1. Start the server:
   ```
   cd server
   npm run dev
   ```

2. Start the client:
   ```
   cd client
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal)


### Docker Compose

You can run the entire stack with Docker:

```bash
docker-compose up --build
```

The client will be available on `http://localhost:5173` and the GraphQL server on `http://localhost:4000`.

## Features

- Browse news by categories
- Search for specific news topics
- AI-enhanced news aggregation from multiple sources
- Clean and responsive user interface
- Color-coded category tabs in the preferences flow for a design similar to Apple News

## Data Flow & Logging

1. **Client Interaction** – React components trigger GraphQL queries on button clicks using Apollo Client.
2. **GraphQL Layer** – Resolvers log each request via a shared logger and delegate to `NewsServiceManager`.
3. **Service Manager** – Coordinates the configured news services, logging which service is used and aggregating results with fallbacks.
4. **HTTP Client** – Handles API calls with caching and rate limiting while logging every request.

Logs prefixed with component names make it easy to trace each step from the UI to external APIs.

## License

ISC

