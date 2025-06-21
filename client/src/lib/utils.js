/**
 * Removes duplicate articles from an array based on the article URL.
 * @param {Array<Object>} articles - An array of article objects.
 * @returns {Array<Object>} A new array with duplicate articles removed.
 */
export function deduplicateArticles(articles) {
  if (!Array.isArray(articles)) {
    return [];
  }
  const seenUrls = new Set();
  return articles.filter(article => {
    if (seenUrls.has(article.url)) {
      return false;
    } else {
      seenUrls.add(article.url);
      return true;
    }
  });
} 