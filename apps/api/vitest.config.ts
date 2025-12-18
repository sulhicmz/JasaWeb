import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { apiVitestConfig } from '@jasaweb/testing';

export default defineConfig({
  ...apiVitestConfig,
  test: {
    ...apiVitestConfig.test,
    setupFiles: ['./test/setup.ts'],
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
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
