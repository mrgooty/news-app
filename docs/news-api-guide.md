# News API Keys

The app uses exactly 3 news sources (chosen for the best free limits, content quality, and reliability) plus one weather API. Add keys to `server/.env`, then verify with `cd server && npm run test:keys`.

## The 3 sources

| Provider | Why it made the cut | Free tier | Signup | Docs |
|---|---|---|---|---|
| **The Guardian** | Full article text in responses, generous limit, instant key, production use allowed | 500 req/day | https://open-platform.theguardian.com/access/ | https://open-platform.theguardian.com/documentation/ |
| **GNews** | Best category + country coverage, aggregates thousands of outlets | 100 req/day | https://gnews.io/register | https://gnews.io/docs/v4 |
| **NY Times** | Highest editorial quality, strong top-stories and search APIs | 500 req/day (5/min) | https://developer.nytimes.com/get-started | https://developer.nytimes.com/apis |

Sources that were evaluated and removed: NewsAPI.org (free tier forbids production use), World News API (only 50 pts/day), Mediastack (100 req/month), Currents and NewsData.io (lower quality/limit ratio than the three above).

## Weather widget

| Provider | Free tier | Signup |
|---|---|---|
| **Weatherstack** | 100 req/month | https://weatherstack.com/signup/free |

## Tips

- Keys usually arrive instantly (Guardian/GNews) or within minutes (NYT).
- Keep keys ONLY in `server/.env` (gitignored) — never commit them.
- The aggregator automatically skips any source whose key is missing or broken, and the Neon + memory caching keeps you well under free-tier limits.
- Want unlimited, key-free sources later? Most outlets publish free RSS feeds — a good future addition.
