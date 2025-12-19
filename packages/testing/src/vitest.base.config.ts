import { defineConfig } from 'vitest/config';

/**
 * Base Vitest configuration for JasaWeb monorepo
 * Provides shared settings that can be extended by app-specific configs
 */
export const baseVitestConfig = defineConfig({
  test: {
    // Common test patterns
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      '.astro',
      '**/*.d.ts',
      '**/*.config.*',
      '**/coverage/**',
    ],

    // Performance optimizations
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Coverage settings (can be overridden by apps)
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/coverage/**',
      ],
    },

    // Global settings
    globals: true,

    // Error handling
    bail: 1, // Stop on first failure in CI

    // Environment-specific reporter
    reporters: process.env.CI ? ['verbose'] : ['default'],
  },
});

/**
 * API-specific configuration
 */
export const apiVitestConfig = defineConfig({
  ...baseVitestConfig,
  test: {
    ...baseVitestConfig.test,
    environment: 'node',
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/coverage/**',
      ],
    },
  },
});

/**
 * Web/Frontend-specific configuration
 */
export const webVitestConfig = defineConfig({
  ...baseVitestConfig,
  test: {
    ...baseVitestConfig.test,
    environment: 'jsdom',
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/coverage/**',
      ],
    },
  },
});

/**
 * Package-specific configuration (lower requirements)
 */
export const packageVitestConfig = defineConfig({
  ...baseVitestConfig,
  test: {
    ...baseVitestConfig.test,
    environment: 'node',
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json'], // Exclude HTML for packages
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/coverage/**',
      ],
    },
  },
});
