import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Fast, targeted testing configuration
    include: ['**/src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '**/*.d.ts',
      '**/*.config.*',
      '**/coverage/**',
    ],

    // Run tests in single thread for faster execution
    pool: 'threads',

    // Reduce timeout for faster feedback
    testTimeout: 5000,
    hookTimeout: 5000,

    // Simple coverage for critical paths only
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },

    // Environment setup
    environment: 'node',
    globals: true,
    setupFiles: ['./env-validation.test.ts'],

    // Minimal reporting for CI
    reporters: process.env.CI ? ['verbose'] : ['default'],
  },
});
