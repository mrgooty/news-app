/**
 * Utility functions for date handling
 */

/**
 * Format a date in YYYY-MM-DD format
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get the current date in YYYY-MM-DD format
 * @returns {string} - Current date string
 */
function getCurrentDate() {
  return formatDate(new Date());
}

/**
 * Get a date N days ago in YYYY-MM-DD format
 * @param {number} days - Number of days ago
 * @returns {string} - Date string from N days ago
 */
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

/**
 * Format a date string to a human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Human-readable date string
 */
function formatHumanReadable(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Check if a date string is valid
 * @param {string} dateString - Date string to check
 * @returns {boolean} - True if valid
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} - Relative time string
 */
function getRelativeTimeString(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 30) {
      return formatHumanReadable(dateString);
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return dateString;
  }
}

module.exports = {
  formatDate,
  getCurrentDate,
  getDateDaysAgo,
  formatHumanReadable,
  isValidDate,
  getRelativeTimeString,
};