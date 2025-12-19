import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '**/*.d.ts',
      '**/*.config.*',
      '**/coverage/**',
    ],
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
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
    globals: true,
    bail: 0, // Don't stop on first failure
    reporters: process.env.CI ? ['verbose'] : ['default'],
  },
  optimizeDeps: {
    include: [
      '@nestjs/testing',
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/platform-express',
      '@nestjs/config',
      '@nestjs/jwt',
      '@nestjs/passport',
      '@nestjs/cache-manager',
      '@nestjs/websockets',
      '@nestjs/microservices',
      '@nestjs/swagger',
      '@nestjs/throttler',
      '@nestjs/terminus',
      '@nestjs/schedule',
      '@nestjs-modules/mailer',
      'reflect-metadata',
      'class-validator',
      'class-transformer',
      'rxjs',
      'uuid',
      'bcrypt',
      'argon2',
      'joi',
      'nodemailer',
      'passport',
      'passport-jwt',
      'passport-local',
      'cache-manager',
      'luxon',
      'compression',
      'helmet',
      'socket.io',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
