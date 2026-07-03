import { safeQuery } from '../db/index.js';
import log from '../utils/logger.js';

const logger = log('Personalization');

/**
 * DB-backed personalization: preferences + reading history in Neon,
 * with an affinity model used to re-rank article feeds.
 */
class PersonalizationService {
  async getPreferences(userId) {
    if (!userId) return null;
    const res = await safeQuery(
      'SELECT categories, locations, zip_code FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    if (!res?.rows?.length) return null;
    const row = res.rows[0];
    return {
      selectedCategories: row.categories || [],
      locations: row.locations || [],
      zipCode: row.zip_code,
    };
  }

  async savePreferences(userId, { categories = [], locations = [], zipCode = null }) {
    if (!userId) return null;
    await safeQuery(
      `INSERT INTO user_preferences (user_id, categories, locations, zip_code, updated_at)
       VALUES ($1,$2,$3,$4,now())
       ON CONFLICT (user_id) DO UPDATE SET
         categories = EXCLUDED.categories,
         locations = EXCLUDED.locations,
         zip_code = EXCLUDED.zip_code,
         updated_at = now()`,
      [userId, categories, locations, zipCode]
    );
    return { selectedCategories: categories, locations, zipCode };
  }

  async recordRead(userId, { url, title, category, source, keywords = [] }) {
    if (!userId || !url) return false;
    await safeQuery(
      `INSERT INTO reading_history (user_id, url, title, category, source, keywords)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, url, title || null, category || null, source || null, keywords]
    );
    return true;
  }

  /**
   * Build an affinity profile from the user's last 200 reads:
   * which categories, sources, and keywords they actually engage with.
   */
  async getAffinityProfile(userId) {
    const res = await safeQuery(
      `SELECT category, source, keywords, read_at
       FROM reading_history WHERE user_id = $1
       ORDER BY read_at DESC LIMIT 200`,
      [userId]
    );
    if (!res?.rows?.length) return null;

    const categories = new Map();
    const sources = new Map();
    const keywords = new Map();
    const now = Date.now();

    for (const row of res.rows) {
      // Recency decay: a read today counts ~3x a read a month ago
      const ageDays = (now - new Date(row.read_at).getTime()) / 86400000;
      const w = 1 / (1 + ageDays / 14);
      if (row.category) categories.set(row.category, (categories.get(row.category) || 0) + w);
      if (row.source) sources.set(row.source, (sources.get(row.source) || 0) + w);
      for (const k of row.keywords || []) {
        keywords.set(k.toLowerCase(), (keywords.get(k.toLowerCase()) || 0) + w);
      }
    }
    return { categories, sources, keywords };
  }

  /**
   * Re-rank articles for a user. Score =
   *   preference category match + history affinity (category/source/keywords) + freshness.
   * Falls back to input order when no user data exists.
   */
  async rankArticles(articles, userId) {
    if (!userId || !articles?.length) return articles;

    const [prefs, profile] = await Promise.all([
      this.getPreferences(userId),
      this.getAffinityProfile(userId),
    ]);
    if (!prefs && !profile) return articles;

    const prefCategories = new Set(prefs?.selectedCategories || []);
    const maxCat = profile ? Math.max(1, ...profile.categories.values()) : 1;
    const maxSrc = profile ? Math.max(1, ...profile.sources.values()) : 1;
    const now = Date.now();

    const scored = articles.map((a) => {
      let score = 0;

      if (a.category && prefCategories.has(a.category)) score += 2.0;

      if (profile) {
        if (a.category) score += 1.5 * ((profile.categories.get(a.category) || 0) / maxCat);
        if (a.source) score += 1.0 * ((profile.sources.get(a.source) || 0) / maxSrc);

        const haystack = `${a.title || ''} ${a.description || ''}`.toLowerCase();
        let kwHits = 0;
        for (const [kw, weight] of profile.keywords) {
          if (kwHits >= 5) break;
          if (haystack.includes(kw)) {
            score += 0.4 * Math.min(weight, 3);
            kwHits++;
          }
        }
      }

      // Freshness: full boost < 6h old, fading over 48h
      if (a.publishedAt) {
        const ageH = (now - new Date(a.publishedAt).getTime()) / 3600000;
        if (!Number.isNaN(ageH)) score += Math.max(0, 1.5 * (1 - ageH / 48));
      }

      return { article: a, score };
    });

    scored.sort((x, y) => y.score - x.score);
    logger(`Re-ranked ${articles.length} articles for user ${userId}`);
    return scored.map((s) => s.article);
  }
}

export default new PersonalizationService();
