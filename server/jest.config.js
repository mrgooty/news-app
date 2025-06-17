module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/newsServiceManager.js'
  ],
  testPathIgnorePatterns: ['/src/ai/test.js']
};
