import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.nyc_output', 'coverage'],
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'coverage/**',
        'dist/**',
        'vitest.config.ts',
        'playwright.config.ts',
        '.eslintrc.js',
        '.prettierrc.js',
      ],
    },
  },
});