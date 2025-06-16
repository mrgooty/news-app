/**
 * Utility functions for error handling and logging
 */

/**
 * Create a standardized API error object
 * @param {string} source - Error source (e.g., API name)
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} - Standardized error object
 */
function createApiError(source, message, code = 'ERROR') {
  return {
    source,
    message,
    code,
  };
}

/**
 * Log an error with context information
 * @param {string} context - Context where the error occurred
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object
 */
function logError(context, message, error) {
  console.error(`[${context}] ${message}:`, error);
  
  // Log stack trace if available
  if (error && error.stack) {
    console.error(`[${context}] Stack trace:`, error.stack);
  }
}

/**
 * Handle API response errors
 * @param {string} apiName - Name of the API
 * @param {Error} error - Error object
 * @returns {Object} - Standardized error object
 */
function handleApiError(apiName, error) {
  let errorMessage = 'Unknown error';
  let errorCode = 'ERROR';
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    errorMessage = error.response.data?.message || `Status ${error.response.status}: ${error.response.statusText}`;
    errorCode = `HTTP_${error.response.status}`;
    
    logError(apiName, 'API response error', {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
    });
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response received from server';
    errorCode = 'NO_RESPONSE';
    
    logError(apiName, 'No response from API', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message || 'Request setup error';
    errorCode = 'REQUEST_ERROR';
    
    logError(apiName, 'Request setup error', error);
  }
  
  return createApiError(apiName, errorMessage, errorCode);
}

/**
 * Create a GraphQL error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} - GraphQL error object
 */
function createGraphQLError(message, code = 'INTERNAL_SERVER_ERROR') {
  return {
    message,
    extensions: { code },
  };
}

module.exports = {
  createApiError,
  logError,
  handleApiError,
  createGraphQLError,
};