import crypto from 'crypto';
import log from './logger.js';

const logger = log('ArticleUtils');

/**
 * Generate a unique ID for an article
 * @param {string} source - Source name
 * @param {string} url - Article URL
 * @param {string} title - Article title
 * @returns {string} - Unique ID
 */
export function generateArticleId(source, url, title) {
  const input = `${source}:${url || ''}:${title || ''}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Deduplicate articles by URL
 * @param {Array} articles - List of articles
 * @returns {Array} - Deduplicated list of articles
 */
export function deduplicateArticles(articles) {
  if (!articles || articles.length <= 1) {
    return articles;
  }

  const uniqueUrls = new Set();
  return articles.filter(article => {
    if (!article.url || uniqueUrls.has(article.url)) {
      return false;
    }
    uniqueUrls.add(article.url);
    return true;
  });
}

/**
 * Check if articles are duplicates using basic comparison
 * @param {Object} article1 - First article
 * @param {Object} article2 - Second article
 * @returns {boolean} - True if articles are likely duplicates
 */
export function checkBasicDuplicate(article1, article2) {
  // Check for identical URLs
  if (article1.url && article2.url && article1.url === article2.url) {
    return true;
  }

  // Check for identical titles
  if (article1.title === article2.title) {
    return true;
  }

  // Check for significant title overlap
  const title1Words = article1.title.toLowerCase().split(/\s+/);
  const title2Words = article2.title.toLowerCase().split(/\s+/);
  
  // Count matching words
  let matchingWords = 0;
  for (const word of title1Words) {
    if (word.length > 3 && title2Words.includes(word)) {
      matchingWords++;
    }
  }
  
  // Calculate similarity percentage
  const similarity = (matchingWords * 2) / (title1Words.length + title2Words.length);
  
  // Consider duplicates if similarity is high
  return similarity > 0.6;
}

/**
 * Normalize article data structure
 * @param {Object} article - Raw article data
 * @param {string} source - Source name
 * @param {string} category - Category
 * @returns {Object} - Normalized article
 */
export function normalizeArticle(article, source, category = null) {
  if (!article) {
    return null;
  }

  return {
    id: generateArticleId(source, article.url, article.title),
    title: article.title || 'No title available',
    description: article.description || article.summary || article.excerpt || '',
    content: article.content || article.text || article.body || article.description || '',
    url: article.url || article.link || '',
    imageUrl: article.imageUrl || article.image || article.urlToImage || '',
    source: article.source || article.source_name || source || 'Unknown Source',
    publishedAt: article.publishedAt || article.published_at || article.pubDate || article.date || new Date().toISOString(),
    category: category || article.category || article.section || 'general',
    author: article.author || article.byline || '',
    language: article.language || 'en'
  };
}

/**
 * Validate article data
 * @param {Object} article - Article to validate
 * @returns {boolean} - True if article is valid
 */
export function validateArticle(article) {
  if (!article) {
    return false;
  }

  // Must have at least a title or URL
  if (!article.title && !article.url) {
    return false;
  }

  // Title should not be too short or too long
  if (article.title && (article.title.length < 3 || article.title.length > 500)) {
    return false;
  }

  // URL should be valid if present
  if (article.url) {
    try {
      new URL(article.url);
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Filter articles by quality criteria
 * @param {Array} articles - List of articles
 * @param {Object} criteria - Filter criteria
 * @returns {Array} - Filtered articles
 */
export function filterArticlesByQuality(articles, criteria = {}) {
  const {
    minTitleLength = 10,
    maxTitleLength = 200,
    requireUrl = true,
    requireDescription = false,
    minDescriptionLength = 20
  } = criteria;

  return articles.filter(article => {
    // Validate basic structure
    if (!validateArticle(article)) {
      return false;
    }

    // Check title length
    if (article.title && (article.title.length < minTitleLength || article.title.length > maxTitleLength)) {
      return false;
    }

    // Check URL requirement
    if (requireUrl && !article.url) {
      return false;
    }

    // Check description requirement
    if (requireDescription && (!article.description || article.description.length < minDescriptionLength)) {
      return false;
    }

    return true;
  });
}

/**
 * Sort articles by various criteria
 * @param {Array} articles - List of articles
 * @param {string} sortBy - Sort criteria ('date', 'relevance', 'title')
 * @param {string} order - Sort order ('asc', 'desc')
 * @returns {Array} - Sorted articles
 */
export function sortArticles(articles, sortBy = 'date', order = 'desc') {
  const sorted = [...articles];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        const dateA = new Date(a.publishedAt || 0);
        const dateB = new Date(b.publishedAt || 0);
        comparison = dateA - dateB;
        break;
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
      case 'source':
        comparison = (a.source || '').localeCompare(b.source || '');
        break;
      case 'relevance':
        // Use finalScore if available, otherwise use date
        comparison = (b.finalScore || 0) - (a.finalScore || 0);
        break;
      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Group articles by category
 * @param {Array} articles - List of articles
 * @returns {Object} - Articles grouped by category
 */
export function groupArticlesByCategory(articles) {
  return articles.reduce((groups, article) => {
    const category = article.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(article);
    return groups;
  }, {});
}

/**
 * Extract unique sources from articles
 * @param {Array} articles - List of articles
 * @returns {Array} - Unique source names
 */
export function extractUniqueSources(articles) {
  const sources = new Set();
  articles.forEach(article => {
    if (article.source) {
      sources.add(article.source);
    }
  });
  return Array.from(sources);
}

/**
 * Calculate article statistics
 * @param {Array} articles - List of articles
 * @returns {Object} - Statistics object
 */
export function calculateArticleStats(articles) {
  if (!articles || articles.length === 0) {
    return {
      total: 0,
      byCategory: {},
      bySource: {},
      dateRange: { earliest: null, latest: null }
    };
  }

  const stats = {
    total: articles.length,
    byCategory: {},
    bySource: {},
    dateRange: { earliest: null, latest: null }
  };

  articles.forEach(article => {
    // Count by category
    const category = article.category || 'general';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

    // Count by source
    const source = article.source || 'Unknown';
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;

    // Track date range
    if (article.publishedAt) {
      const date = new Date(article.publishedAt);
      if (!stats.dateRange.earliest || date < stats.dateRange.earliest) {
        stats.dateRange.earliest = date;
      }
      if (!stats.dateRange.latest || date > stats.dateRange.latest) {
        stats.dateRange.latest = date;
      }
    }
  });

  return stats;
}

/**
 * Prepare content for AI processing
 * @param {Object} article - Article object
 * @param {boolean} short - Whether to use short content
 * @returns {string} - Prepared content
 */
export function prepareContentForAI(article, short = false) {
  let content = '';

  if (short) {
    // Use title and description for short content
    content = `${article.title || ''}\n${article.description || ''}`;
  } else {
    // Use full content
    content = `${article.title || ''}\n${article.description || ''}\n${article.content || ''}`;
  }

  // Clean and truncate content
  content = content
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, short ? 500 : 2000);

  return content;
}

/**
 * Create standardized error object
 * @param {string} source - Error source
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {boolean} retryable - Whether error is retryable
 * @returns {Object} - Standardized error object
 */
export function createArticleError(source, message, code = 'ERROR', retryable = true) {
  return {
    source,
    message,
    code,
    retryable,
    timestamp: new Date().toISOString()
  };
} 