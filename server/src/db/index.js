import pg from 'pg';
import log from '../utils/logger.js';

const logger = log('DB');

let pool = null;
let dbAvailable = false;

/**
 * Lazily create the pg pool. The app runs fine without a DB
 * (falls back to in-memory caching) but persistence, cross-restart
 * analysis caching, and personalization require DATABASE_URL.
 */
export function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  pool = new pg.Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: url.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });
  pool.on('error', (err) => logger.error('Unexpected pool error:', err.message));
  return pool;
}

export function isDbAvailable() {
  return dbAvailable;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS article_analysis (
  url_hash        TEXT PRIMARY KEY,
  url             TEXT NOT NULL,
  title           TEXT,
  summary         TEXT,
  sentiment       TEXT,
  sentiment_score REAL,
  sentiment_label TEXT,
  confidence      REAL,
  keywords        TEXT[] DEFAULT '{}',
  suggestions     JSONB DEFAULT '[]',
  model           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id    TEXT PRIMARY KEY,
  categories TEXT[] DEFAULT '{}',
  locations  TEXT[] DEFAULT '{}',
  zip_code   TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_history (
  id       BIGSERIAL PRIMARY KEY,
  user_id  TEXT NOT NULL,
  url      TEXT NOT NULL,
  title    TEXT,
  category TEXT,
  source   TEXT,
  keywords TEXT[] DEFAULT '{}',
  read_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history (user_id, read_at DESC);

CREATE TABLE IF NOT EXISTS article_cache (
  cache_key  TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_article_cache_expiry ON article_cache (expires_at);
`;

/**
 * Initialize the schema. Safe to call repeatedly. Never throws —
 * the server must boot even when the DB is unreachable.
 */
export async function initDb() {
  const p = getPool();
  if (!p) {
    logger('DATABASE_URL not set — running without persistence.');
    return false;
  }
  try {
    await p.query(SCHEMA_SQL);
    dbAvailable = true;
    logger('Neon Postgres connected, schema ready.');
    return true;
  } catch (err) {
    dbAvailable = false;
    logger.error('Could not initialize database (continuing without persistence):', err.message);
    return false;
  }
}

/** Convenience query helper that returns null on failure instead of throwing. */
export async function safeQuery(text, params = []) {
  const p = getPool();
  if (!p || !dbAvailable) return null;
  try {
    return await p.query(text, params);
  } catch (err) {
    logger.error('Query failed:', err.message);
    return null;
  }
}

export default { getPool, initDb, safeQuery, isDbAvailable };
