import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    displayName: 'API',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: [
      'node_modules',
      'dist',
      '**/*.d.ts',
      '**/*.config.*',
      '**/coverage/**',
    ],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.dto.ts',
        '**/*.entity.ts',
        '**/*.interface.ts',
        '**/main.ts',
        '**/*.config.*',
      ],
    },
  },
});
