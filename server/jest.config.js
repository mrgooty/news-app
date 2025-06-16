module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/utils/httpClient.js',
    'src/services/newsServiceManager.js'
  ],
  testPathIgnorePatterns: ['/src/ai/test.js']
};
