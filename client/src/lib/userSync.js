// Lightweight server sync for personalization.
// Generates a stable anonymous user id and mirrors preferences /
// read events to the server (Neon Postgres) with fire-and-forget calls.

const USER_ID_KEY = 'newsAppUserId';
const GRAPHQL_URL = `${import.meta.env?.VITE_API_URL || 'http://localhost:4000'}/graphql`;

export function getUserId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `u_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

async function gql(query, variables) {
  try {
    await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      keepalive: true,
    });
  } catch {
    // offline / server down — local storage still has the data
  }
}

/** Mirror preferences to the server. Never blocks the UI. */
export function syncPreferences({ categories = [], location, zipCode = null }) {
  const userId = getUserId();
  if (!userId) return;
  gql(
    `mutation SyncPrefs($userId: String!, $categories: [String!], $locations: [String!], $zipCode: String) {
      savePreferences(userId: $userId, categories: $categories, locations: $locations, zipCode: $zipCode) {
        selectedCategories
      }
    }`,
    { userId, categories, locations: location ? [location] : [], zipCode }
  );
}

/** Record that the user opened an article — powers personalized ranking. */
export function recordArticleRead({ url, title, category, source }) {
  const userId = getUserId();
  if (!userId || !url) return;
  gql(
    `mutation RecordRead($userId: String!, $url: String!, $title: String, $category: String, $source: String) {
      recordArticleRead(userId: $userId, url: $url, title: $title, category: $category, source: $source)
    }`,
    { userId, url, title, category, source }
  );
}
