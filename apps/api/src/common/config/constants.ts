/**
 * Application Configuration Constants
 * DEPRECATED: Use centralized config at src/config/index.ts instead
 * This file maintained for backward compatibility
 */

import { config } from '../../config';

/**
 * Default Port Configuration
 */
export const DEFAULT_PORTS = {
  API: config.api.port,
  WEB: 4321,
  DATABASE: config.database.port,
  REDIS: config.cache.redis.port || 6379,
  MINIO: 9000,
} as const;

/**
 * Default CORS Origins for Development
 */
export const DEFAULT_CORS_ORIGINS = [
  `http://localhost:${DEFAULT_PORTS.WEB}`,
  `http://localhost:${DEFAULT_PORTS.API}`,
  `http://localhost:3001`,
  'http://127.0.0.1:4321',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
] as const;

/**
 * Default Database Configuration
 */
export const DEFAULT_DATABASE_CONFIG = {
  HOST: 'localhost',
  PORT: DEFAULT_PORTS.DATABASE,
  USER: 'test',
  PASSWORD: 'test',
  DATABASE: 'test',
  URL: 'postgresql://test:test@localhost:5432/test',
} as const;

/**
 * Default Email Configuration
 */
export const DEFAULT_EMAIL_CONFIG = {
  HOST: 'localhost',
  PORT: 587,
  FROM: 'noreply@jasaweb.dev',
} as const;

/**
 * Application URLs
 */
export const APP_URLS = {
  FRONTEND_URL:
    process.env.FRONTEND_URL || `http://localhost:${DEFAULT_PORTS.WEB}`,
  API_URL: process.env.API_URL || `http://localhost:${DEFAULT_PORTS.API}`,
} as const;

/**
 * File Upload Configuration
 */
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: config.storage.maxFileSize,
  ALLOWED_MIME_TYPES: config.storage.allowedMimeTypes.slice(0, 6), // Backward compatibility
  UPLOAD_PATH: config.storage.local.uploadDirectory,
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  DEFAULT_TTL: config.cache.ttl.default,
  DASHBOARD_STATS_TTL: config.cache.ttl.dashboardStats,
  PROJECT_CACHE_TTL: config.cache.ttl.projects,
} as const;

/**
 * Cache Keys
 */
export const CACHE_KEYS = {
  DASHBOARD_STATS: (organizationId: string) =>
    `dashboard-stats-${organizationId}`,
  PROJECT_OVERVIEW: (organizationId: string, limit: string) =>
    `project-overview-${organizationId}-${limit}`,
  RECENT_ACTIVITY: (organizationId: string, limit: string) =>
    `recent-activity-${organizationId}-${limit}`,
} as const;

/**
 * Security Configuration
 */
export const SECURITY_CONFIG = {
  JWT_SECRET_MIN_LENGTH: config.security.jwt.secretMinLength,
  BCRYPT_ROUNDS: config.security.password.bcryptRounds,
  MAX_LOGIN_ATTEMPTS: config.security.auth.maxLoginAttempts,
  LOCKOUT_DURATION_MS: config.security.auth.lockoutDurationMs,
} as const;

/**
 * API Rate Limiting Configuration
 */
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  MAX_AUTH_REQUESTS: 10, // Lower limit for auth endpoints
} as const;

/**
 * Environment Configuration
 */
export const ENV_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

/**
 * Logging Configuration
 */
export const LOGGING_CONFIG = {
  LEVEL: ENV_CONFIG.IS_DEVELOPMENT ? 'debug' : 'info',
  ENABLE_HTTP_LOGGING: ENV_CONFIG.IS_DEVELOPMENT,
  ENABLE_PERFORMANCE_LOGGING: !ENV_CONFIG.IS_PRODUCTION,
} as const;

/**
 * Health Check Configuration
 */
export const HEALTH_CHECK_CONFIG = {
  CHECK_INTERVAL_MS: 30000, // 30 seconds
  TIMEOUT_MS: 5000, // 5 seconds
} as const;
