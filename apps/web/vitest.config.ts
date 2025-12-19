/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { webVitestConfig } from '@jasaweb/testing';

export default defineConfig({
  ...webVitestConfig,
  test: {
    ...webVitestConfig.test,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
