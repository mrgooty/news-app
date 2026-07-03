#!/usr/bin/env node
/**
 * One-shot Neon Postgres setup + connectivity check.
 * Run locally:  cd server && npm run db:init
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { initDb, getPool } = await import('../src/db/index.js');

console.log('Connecting to Neon Postgres...');
const ok = await initDb();
if (!ok) {
  console.error('❌ Could not connect. Check DATABASE_URL in server/.env');
  process.exit(1);
}

const pool = getPool();
const { rows } = await pool.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
);
console.log('✅ Connected. Tables ready:');
rows.forEach((r) => console.log(`   - ${r.table_name}`));
await pool.end();
