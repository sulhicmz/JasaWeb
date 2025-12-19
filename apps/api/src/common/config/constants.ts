/**
 * Application Configuration Constants
 * Centralized configuration values to eliminate hardcoded references
 */

import { EnvironmentUrlValidator } from './environment-url-validator';

/**
 * Default Port Configuration
 */
export const DEFAULT_PORTS = {
  API: 3000,
  WEB: 4321,
  DATABASE: 5432,
  REDIS: 6379,
  MINIO: 9000,
} as const;

/**
 * Dynamic CORS Origins - Built from environment configuration
 * This replaces hardcoded localhost references with environment-aware defaults
 */
export const DEFAULT_CORS_ORIGINS = (() => {
  try {
    const config = EnvironmentUrlValidator.buildEnvironmentUrls();
    return config.corsOrigins;
  } catch {
    // Fallback to safe defaults for build-time or test environments
    return [
      `http://localhost:${DEFAULT_PORTS.WEB}`,
      `http://localhost:${DEFAULT_PORTS.API}`,
      'http://127.0.0.1:4321',
      'http://127.0.0.1:3000',
    ];
  }
})() as readonly string[];

/**
 * Default Database Configuration
 * Note: Sensitive credentials are loaded from environment variables
 */
export const DEFAULT_DATABASE_CONFIG = {
  HOST: process.env.POSTGRES_HOST || 'localhost',
  PORT: Number(process.env.POSTGRES_PORT) || DEFAULT_PORTS.DATABASE,
  USER: process.env.POSTGRES_USER,
  PASSWORD: process.env.POSTGRES_PASSWORD,
  DATABASE: process.env.POSTGRES_DB,
  URL: process.env.DATABASE_URL,
} as const;

/**
 * Default Email Configuration
 * Host is now configurable, with localhost as development fallback
 */
export const DEFAULT_EMAIL_CONFIG = {
  HOST:
    process.env.SMTP_HOST ||
    (process.env.NODE_ENV === 'production' ? undefined : 'localhost'),
  PORT: Number(process.env.SMTP_PORT) || 587,
  FROM:
    process.env.EMAIL_FROM ||
    `"${process.env.EMAIL_FROM_NAME || 'JasaWeb'}" <${process.env.NOREPLY_EMAIL || 'noreply@jasaweb.dev'}>`,
} as const;

/**
 * Dynamic Application URLs - Built from environment configuration
 * This replaces hardcoded localhost references with environment-aware values
 */
export const APP_URLS = (() => {
  try {
    const config = EnvironmentUrlValidator.buildEnvironmentUrls();
    return {
      FRONTEND_URL: config.frontendUrl,
      API_URL: config.apiBaseUrl,
    };
  } catch {
    // Fallback to environment variables with localhost defaults for safe operation
    return {
      FRONTEND_URL:
        process.env.FRONTEND_URL || `http://localhost:${DEFAULT_PORTS.WEB}`,
      API_URL:
        process.env.API_BASE_URL ||
        process.env.PUBLIC_API_URL ||
        `http://localhost:${DEFAULT_PORTS.API}`,
    };
  }
})();

/**
 * File Upload Configuration
 */
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  DEFAULT_TTL: Number(process.env.CACHE_DEFAULT_TTL) || 300, // 5 minutes
  DASHBOARD_STATS_TTL: Number(process.env.CACHE_DASHBOARD_TTL) || 600, // 10 minutes
  PROJECT_CACHE_TTL: Number(process.env.CACHE_PROJECT_TTL) || 180, // 3 minutes
  KNOWLEDGE_BASE_TTL: Number(process.env.CACHE_KNOWLEDGE_BASE_TTL) || 900, // 15 minutes
  SEARCH_RESULTS_TTL: Number(process.env.CACHE_SEARCH_RESULTS_TTL) || 300, // 5 minutes
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
  KNOWLEDGE_BASE_CATEGORIES: 'kb-categories',
  KNOWLEDGE_BASE_ANALYTICS: 'kb-analytics',
  SEARCH_RESULTS: (query: string, filters: string) =>
    `search-${query}-${filters}`,
} as const;

/**
 * Security Configuration
 */
export const SECURITY_CONFIG = {
  JWT_SECRET_MIN_LENGTH: Number(process.env.JWT_SECRET_MIN_LENGTH) || 32,
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 12,
  MAX_LOGIN_ATTEMPTS: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOCKOUT_DURATION_MS:
    Number(process.env.LOCKOUT_DURATION_MS) || 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * API Rate Limiting Configuration
 */
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  MAX_AUTH_REQUESTS: Number(process.env.RATE_LIMIT_MAX_AUTH_REQUESTS) || 10, // Lower limit for auth endpoints
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
