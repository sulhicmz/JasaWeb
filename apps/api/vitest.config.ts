import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.next', '.astro'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@jasaweb/config': resolve(__dirname, '../packages/config'),
      '@jasaweb/ui': resolve(__dirname, '../packages/ui'),
      '@jasaweb/testing': resolve(__dirname, '../packages/testing'),
    },
  },
});
