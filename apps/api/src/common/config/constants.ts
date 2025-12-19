/**
 * Application Configuration Constants
 * Centralized configuration values to eliminate hardcoded references
 */

<<<<<<< HEAD
import {
  getEnvNumber,
  getOptionalEnv,
} from '../../../../../packages/config/env-validation';
=======
import { EnvironmentUrlValidator } from './environment-url-validator';
>>>>>>> origin/dev

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
 * Host is now configurable, with localhost as development fallback
 */
export const DEFAULT_EMAIL_CONFIG = {
<<<<<<< HEAD
  HOST: 'localhost',
  PORT: 587,
  FROM: getOptionalEnv('SYSTEM_EMAIL_FROM', 'noreply@jasaweb.dev'),
=======
  HOST:
    process.env.SMTP_HOST ||
    (process.env.NODE_ENV === 'production' ? undefined : 'localhost'),
  PORT: Number(process.env.SMTP_PORT) || 587,
  FROM:
    process.env.EMAIL_FROM ||
    `"${process.env.EMAIL_FROM_NAME || 'JasaWeb'}" <${process.env.NOREPLY_EMAIL || 'noreply@jasaweb.dev'}>`,
>>>>>>> origin/dev
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
  EXTERNAL_URL: 'https://httpbin.org/get',
} as const;

/**
 * System Email Configuration
 */
export const SYSTEM_EMAIL_CONFIG = {
  FROM: process.env.SYSTEM_EMAIL_FROM || 'noreply@jasaweb.dev',
  CONTACT: process.env.SYSTEM_EMAIL_CONTACT || 'contact@jasaweb.com',
  INFO: process.env.SYSTEM_EMAIL_INFO || 'info@jasaweb.com',
  ADMIN: process.env.SYSTEM_EMAIL_ADMIN || 'admin@jasaweb.com',
} as const;

/**
 * External Service URLs
 */
export const EXTERNAL_SERVICE_URLS = {
  HEALTH_CHECK:
    process.env.EXTERNAL_HEALTH_CHECK_URL || 'https://httpbin.org/get',
  CDN_BASE: process.env.CDN_BASE_URL || 'https://cdn.jasaweb.com',
  GOOGLE_FONTS: process.env.GOOGLE_FONTS_URL || 'https://fonts.googleapis.com',
  SITE_BASE: process.env.SITE_BASE_URL || 'https://jasaweb.id',
} as const;

/**
 * Timeout Configuration (in milliseconds)
 */
export const TIMEOUT_CONFIG = {
  API: getEnvNumber('API_TIMEOUT', 30000),
  WEBSOCKET: getEnvNumber('WEBSOCKET_TIMEOUT', 5000),
  NOTIFICATION: getEnvNumber('NOTIFICATION_TIMEOUT', 20000),
  REQUEST: getEnvNumber('REQUEST_TIMEOUT', 10000),
  MAX_RECONNECT_ATTEMPTS: getEnvNumber('MAX_RECONNECT_ATTEMPTS', 5),
  RECONNECT_DELAY: getEnvNumber('RECONNECT_DELAY', 1000),
  SESSION_MAX_AGE: getEnvNumber('SESSION_MAX_AGE', 86400000),
  TOKEN_REFRESH_THRESHOLD: getEnvNumber('TOKEN_REFRESH_THRESHOLD', 3600000),
} as const;

/**
 * Pagination Configuration
 */
export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: getEnvNumber('DEFAULT_PAGE_LIMIT', 10),
  MAX_LIMIT: getEnvNumber('MAX_PAGE_LIMIT', 100),
  DEFAULT_QUERY_LIMIT: getEnvNumber('DEFAULT_QUERY_LIMIT', 6),
} as const;

/**
 * UI Theme Configuration
 */
export const UI_THEME_CONFIG = {
  PRIMARY_COLOR: process.env.PRIMARY_COLOR || '#3B82F6',
  SECONDARY_COLOR: process.env.SECONDARY_COLOR || '#10B981',
  SUCCESS_COLOR: process.env.SUCCESS_COLOR || '#059669',
  WARNING_COLOR: process.env.WARNING_COLOR || '#D97706',
  ERROR_COLOR: process.env.ERROR_COLOR || '#DC2626',
  CONTAINER_MAX_WIDTH: getEnvNumber('CONTAINER_MAX_WIDTH', 1280),
} as const;

/**
 * Social Media Configuration
 */
export const SOCIAL_MEDIA_CONFIG = {
  FACEBOOK: process.env.FACEBOOK_URL || 'https://facebook.com/jasaweb',
  TWITTER: process.env.TWITTER_URL || 'https://twitter.com/jasaweb',
  LINKEDIN: process.env.LINKEDIN_URL || 'https://linkedin.com/company/jasaweb',
  INSTAGRAM: process.env.INSTAGRAM_URL || 'https://instagram.com/jasaweb',
} as const;

/**
 * Content Configuration
 */
export const CONTENT_CONFIG = {
  OG_IMAGE_DEFAULT: process.env.OG_IMAGE_DEFAULT || '/images/og-image.jpg',
  BLOG_DEFAULT_AUTHOR: process.env.BLOG_DEFAULT_AUTHOR || 'JasaWeb Team',
  TEAM_IMAGE_PATH: process.env.TEAM_IMAGE_PATH || '/images/team',
} as const;
