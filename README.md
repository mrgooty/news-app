# News App

A full-stack web application for AI-powered news aggregation from multiple sources.

## Project Overview

This application aggregates news from multiple free news APIs, categorizes them, and provides a clean interface for browsing news by category. It uses AI to enhance the news aggregation process.

## Tech Stack

- **Frontend**: React with Apollo Client for GraphQL
- **Backend**: Node.js with Express and Apollo Server
- **API**: GraphQL
- **AI**: LangChain and LangGraph for news processing and aggregation

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
   - Copy the `.env.template` file in the server directory to `.env`
   - Add your API keys for the news services

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

## Features

- Browse news by categories
- Search for specific news topics
- AI-enhanced news aggregation from multiple sources
- Clean and responsive user interface

## License

ISC