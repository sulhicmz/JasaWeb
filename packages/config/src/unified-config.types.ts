/**
 * Configuration Schema Types
 * Unified type definitions for all JasaWeb configuration
 */

// =============================================================================
// BASE CONFIGURATION
// =============================================================================

export interface BaseConfig {
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  SITE_NAME: string;
  SITE_DESCRIPTION: string;
  SITE_AUTHOR: string;
  SITE_URL: string;
  APP_VERSION: string;
}

// =============================================================================
// API CONFIGURATION
// =============================================================================

export interface ApiConfig {
  // Base URLs
  API_PORT: number;
  API_BASE_URL: string;
  API_PREFIX: string;
  PUBLIC_API_URL: string;
  WEB_BASE_URL: string;
  FRONTEND_URL: string;

  // Client Settings
  API_TIMEOUT: number;
  API_RETRIES: number;
  API_RETRY_DELAY: number;

  // WebSocket
  WS_ENABLED: boolean;
  WS_URL: string;
  WS_RECONNECT_ATTEMPTS: number;
  WS_RECONNECT_DELAY: number;
  WS_HEARTBEAT_INTERVAL: number;

  // Rate Limiting
  API_RATE_LIMIT_ENABLED: boolean;
  API_RATE_LIMIT_WINDOW: number;
  API_RATE_LIMIT_MAX: number;
  API_RATE_LIMIT_SKIP_SUCCESS: boolean;
  API_RATE_LIMIT_SKIP_FAILED: boolean;
}

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================

export interface DatabaseConfig {
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  DATABASE_URL: string;
  DOCKER_DATABASE_URL: string;
}

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

export interface SecurityConfig {
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // Session
  SESSION_SECRET: string;
  SESSION_MAX_AGE: number;

  // Encryption
  ENCRYPTION_KEY: string;

  // Password Security
  BCRYPT_ROUNDS: number;
  ARGON2_MEMORY: number;
  ARGON2_ITERATIONS: number;
  ARGON2_PARALLELISM: number;
  ARGON2_SALT_LENGTH: number;
  ARGON2_HASH_LENGTH: number;

  // Rate Limiting
  RATE_LIMIT_TTL: number;
  RATE_LIMIT_MAX: number;
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;

  // Login Protection
  MAX_LOGIN_ATTEMPTS: number;
  LOCKOUT_DURATION: number;

  // CORS
  CORS_ORIGIN: string;
}

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================

export interface StorageConfig {
  STORAGE_TYPE: 'local' | 's3';

  // AWS S3
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  S3_BUCKET: string;
  S3_REGION: string;

  // MinIO
  MINIO_ENDPOINT: string;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_BUCKET: string;
  MINIO_ROOT_USER: string;
  MINIO_ROOT_PASSWORD: string;
  DOCKER_MINIO_ENDPOINT: string;
}

// =============================================================================
// REDIS CONFIGURATION
// =============================================================================

export interface RedisConfig {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  DOCKER_REDIS_HOST: string;
  DOCKER_REDIS_PORT: number;
}

// =============================================================================
// EMAIL CONFIGURATION
// =============================================================================

export interface EmailConfig {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
  CONTACT_EMAIL: string;
}

// =============================================================================
// LOGGING CONFIGURATION
// =============================================================================

export interface LoggingConfig {
  LOG_LEVEL: string;
  LOG_FILE_PATH: string;
  ENABLE_AUDIT_LOG: boolean;
  ENABLE_VERBOSE_LOGGING: boolean;
  DEBUG: boolean;
}

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

export interface CacheConfig {
  ENABLE_CACHE: boolean;
  CACHE_TTL: number;
  CACHE_MAX: number;
}

// =============================================================================
// FILE UPLOAD CONFIGURATION
// =============================================================================

export interface FileUploadConfig {
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string;
}

// =============================================================================
// DEVELOPMENT CONFIGURATION
// =============================================================================

export interface DevelopmentConfig {
  DEV_MODE: boolean;
  VERBOSE: boolean;
  ENABLE_SWAGGER: boolean;
  ENABLE_EMAIL_NOTIFICATIONS: boolean;
  ENABLE_COVERAGE_REPORT: boolean;
  COVERAGE_THRESHOLD: number;
}

// =============================================================================
// ANALYTICS & MARKETING
// =============================================================================

export interface AnalyticsConfig {
  GOOGLE_ANALYTICS_ID: string;
  GOOGLE_TAG_MANAGER_ID: string;
  PUBLIC_GA_ID: string;
  PUBLIC_GTM_ID: string;
}

// =============================================================================
// SEO & METADATA
// =============================================================================

export interface SeoConfig {
  META_TITLE: string;
  META_DESCRIPTION: string;
  META_KEYWORDS: string;
  OG_IMAGE: string;
}

// =============================================================================
// SOCIAL MEDIA
// =============================================================================

export interface SocialConfig {
  FACEBOOK_URL: string;
  TWITTER_URL: string;
  INSTAGRAM_URL: string;
  LINKEDIN_URL: string;
}

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export interface FeatureFlagsConfig {
  ENABLE_AUTOMATION: boolean;
  ENABLE_SELF_HEALING: boolean;
  ENABLE_AUTO_MERGE: boolean;
  ENABLE_BLOG: boolean;
  ENABLE_PORTFOLIO: boolean;
  ENABLE_CONTACT_FORM: boolean;
}

// =============================================================================
// COMPLIANCE CONFIGURATION
// =============================================================================

export interface ComplianceConfig {
  GDPR_COMPLIANCE_ENABLED: boolean;
  CCPA_COMPLIANCE_ENABLED: boolean;
  WCAG_COMPLIANCE_LEVEL: string;
}

// =============================================================================
// INTERNATIONALIZATION
// =============================================================================

export interface I18nConfig {
  DEFAULT_LOCALE: string;
  SUPPORTED_LOCALES: string;
}

// =============================================================================
// MOBILE CONFIGURATION
// =============================================================================

export interface MobileConfig {
  MOBILE_RESPONSIVE_ENABLED: boolean;
}

// =============================================================================
// OPENCODE CONFIGURATION
// =============================================================================

export interface OpencodeConfig {
  IFLOW_API_KEY: string;
  IFLOW_MODEL: string;
  OPENCODE_DEBUG: boolean;
}

// =============================================================================
// GITHUB CONFIGURATION
// =============================================================================

export interface GithubConfig {
  GH_TOKEN: string;
}

// =============================================================================
// MAIN CONFIGURATION INTERFACE
// =============================================================================

export interface JasaWebConfig {
  base: BaseConfig;
  api: ApiConfig;
  database: DatabaseConfig;
  security: SecurityConfig;
  storage: StorageConfig;
  redis: RedisConfig;
  email: EmailConfig;
  logging: LoggingConfig;
  cache: CacheConfig;
  fileUpload: FileUploadConfig;
  development: DevelopmentConfig;
  analytics: AnalyticsConfig;
  seo: SeoConfig;
  social: SocialConfig;
  featureFlags: FeatureFlagsConfig;
  compliance: ComplianceConfig;
  i18n: I18nConfig;
  mobile: MobileConfig;
  opencode: OpencodeConfig;
  github: GithubConfig;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ConfigSection = keyof JasaWebConfig;
export type EnvironmentType = 'development' | 'production' | 'test';
export type StorageType = 'local' | 's3';

// =============================================================================
// VALIDATION INTERFACES
// =============================================================================

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigSummaryOptions {
  obscureSecrets?: boolean;
  includeDefaults?: boolean;
  sections?: ConfigSection[];
}
