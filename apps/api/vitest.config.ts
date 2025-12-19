import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
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
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
