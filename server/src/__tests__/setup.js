import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Global test utilities
global.testUtils = {
  // Mock API responses
  mockApiResponse: (data, status = 200) => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error'
  }),

  // Create test article
  createTestArticle: (overrides = {}) => ({
    id: 'test-article-1',
    title: 'Test Article Title',
    description: 'Test article description',
    content: 'Test article content',
    url: 'https://example.com/test-article',
    imageUrl: 'https://example.com/test-image.jpg',
    source: 'Test Source',
    publishedAt: new Date().toISOString(),
    category: 'technology',
    ...overrides
  }),

  // Create test error
  createTestError: (message = 'Test error', code = 'TEST_ERROR') => ({
    source: 'test',
    message,
    code,
    retryable: true
  }),

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock console methods
  mockConsole: () => {
    const originalConsole = { ...console };
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
    };
  }
};

// Global test timeout
jest.setTimeout(10000);

// Suppress console output during tests unless explicitly needed
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
} 