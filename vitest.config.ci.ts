import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Optimize for CI/CD environment
    globals: true,
    environment: 'node',
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'apps/web/dist/**',
        'apps/api/dist/**',
        'packages/*/dist/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test timeout for CI environment
    testTimeout: 30000,
    hookTimeout: 10000,
    
    // Parallel execution for faster CI
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2
      }
    },
    
    // Smart file watching (disabled in CI)
    watch: false,
    
    // Reporter configuration
    reporter: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml'
    },
    
    // Include patterns
    include: [
      'tests/**/*.{test,spec}.{js,ts,tsx}',
      'apps/*/src/**/*.{test,spec}.{js,ts,tsx}',
      'packages/*/src/**/*.{test,spec}.{js,ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts',
      '**/coverage/**'
    ],
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Global test environment
    env: {
      NODE_ENV: 'test',
      CI: process.env.CI || 'false'
    }
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@web': resolve(__dirname, './apps/web/src'),
      '@api': resolve(__dirname, './apps/api/src'),
      '@ui': resolve(__dirname, './packages/ui/src'),
      '@testing': resolve(__dirname, './packages/testing/src')
    }
  }
});