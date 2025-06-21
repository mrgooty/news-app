import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // File patterns to test
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/__tests__/**/*.{js,jsx,ts,tsx}'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/main.jsx',
        'src/setupTests.js',
        '**/*.config.js',
        '**/*.config.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Setup files
    setupFiles: ['./src/setupTests.js'],
    
    // Test timeout
    testTimeout: 10000,
    
    // Global test utilities
    globals: true,
    
    // Mock configuration
    deps: {
      inline: ['@testing-library/jest-dom']
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
      '@store': '/src/store',
      '@utils': '/src/utils',
      '@styles': '/src/styles'
    }
  }
}); 