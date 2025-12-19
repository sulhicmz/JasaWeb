import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
<<<<<<< HEAD
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
=======
    environment: 'node',
    setupFiles: ['./test/helpers/setup.ts'],
    bail: 0, // Don't stop on first failure for API testing
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
>>>>>>> origin/dev
  },
  plugins: [
    // Required for NestJS dependency injection with decorators
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
