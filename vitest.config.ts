import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Root-level test configuration
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'apps/**',
      'packages/**',
      '**/*.d.ts',
      '**/*.config.*',
      '**/coverage/**',
    ],

    // Global settings
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    hookTimeout: 10000,

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

    // Reporting
    reporters: process.env.CI ? ['verbose'] : ['default'],
  },
});
