import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.next', '.astro'],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
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
});
