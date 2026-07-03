#!/usr/bin/env node
/**
 * Tests every API key in server/.env with a real request.
 * Run locally:  cd server && npm run test:keys
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PROVIDERS = [
  {
    name: 'The Guardian',
    env: 'GUARDIAN_API_KEY',
    test: (key) => `https://content.guardianapis.com/search?page-size=1&api-key=${key}`,
  },
  {
    name: 'GNews',
    env: 'GNEWS_API_KEY',
    test: (key) => `https://gnews.io/api/v4/top-headlines?lang=en&max=1&apikey=${key}`,
  },
  {
    name: 'NY Times',
    env: 'NYT_API_KEY',
    test: (key) => `https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${key}`,
  },
  {
    name: 'Weatherstack',
    env: 'WEATHER_API_KEY',
    test: (key) => `http://api.weatherstack.com/current?access_key=${key}&query=New%20York`,
  },
];

function verdict(status, data) {
  if (status === 200) {
    // Weatherstack returns 200 with an error body for bad keys
    if (data?.error || data?.success === false) {
      return { ok: false, label: `INVALID (${data.error?.code || data.error?.type || 'error body'})` };
    }
    return { ok: true, label: 'WORKING' };
  }
  if (status === 401 || status === 403) return { ok: false, label: 'INVALID KEY' };
  if (status === 429) return { ok: false, label: 'RATE-LIMITED (key may still be valid — retry later)' };
  return { ok: false, label: `HTTP ${status}` };
}

const results = [];
for (const p of PROVIDERS) {
  const key = process.env[p.env]?.trim();
  if (!key || key.startsWith('your_')) {
    results.push({ ...p, label: 'NOT SET', ok: null });
    continue;
  }
  try {
    const res = await axios.get(p.test(key), { timeout: 12000, validateStatus: () => true });
    results.push({ ...p, ...verdict(res.status, res.data) });
  } catch (err) {
    results.push({ ...p, ok: false, label: `NETWORK ERROR (${err.code || err.message})` });
  }
}

console.log('\n=== API Key Test Results ===\n');
for (const r of results) {
  const icon = r.ok === true ? '✅' : r.ok === false ? '❌' : '⬜';
  console.log(`${icon} ${r.name.padEnd(14)} ${r.env.padEnd(18)} ${r.label}`);
}

const broken = results.filter((r) => r.ok === false);
const working = results.filter((r) => r.ok === true);
console.log(`\n${working.length} working, ${broken.length} broken, ${results.length - working.length - broken.length} not set.`);
if (broken.length) {
  console.log('\nFix or replace these lines in server/.env:');
  broken.forEach((r) => console.log(`  ${r.env}=...   → ${r.label}`));
}
console.log('\nSignup links: see docs/news-api-guide.md\n');
