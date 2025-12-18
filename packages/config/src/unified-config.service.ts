/**
 * Unified Environment Configuration Service
 *
 * This service provides a single, consistent interface for accessing
 * environment configuration across all JasaWeb applications.
 *
 * Features:
 * - Type-safe configuration access
 * - Environment-specific validation
 * - Build-time compatibility for SSR/SSG
 * - Automatic secret obscuring in summaries
 * - Comprehensive validation with detailed errors
 */

import type {
  JasaWebConfig,
  ConfigSection,
  EnvironmentType,
  ConfigValidationResult,
  ConfigSummaryOptions,
} from './unified-config.types';

// Re-export validation utilities from existing module
export {
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
  getEnvBoolean,
  generateSecureSecret,
} from './env-validation';

/**
 * Environment detection utilities
 */
class EnvironmentDetector {
  static isNode(): boolean {
    return typeof process !== 'undefined' && Boolean(process.versions?.node);
  }

  static isDeno(): boolean {
    return typeof (globalThis as any).Deno !== 'undefined';
  }

  static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  static isBuildTime(): boolean {
    // Detect build-like environments (Vite, Astro build, etc.)
    return (
      // Vite/EnvImport - only check if available, not critical
      (typeof window === 'undefined' &&
        typeof global !== 'undefined' &&
        (global as any).importMeta?.env?.MODE === 'build') ||
      // Next.js build
      (typeof process !== 'undefined' &&
        process.env?.NEXT_PHASE === 'phase-production-build') ||
      // Astro build
      (typeof process !== 'undefined' && process.env?.ASTRO === 'true') ||
      // Generic build detection
      (typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'production' &&
        !this.isBrowser())
    );
  }

  static getEnvironmentType(): EnvironmentType {
    const nodeEnv = process?.env?.NODE_ENV;
    // Fallback to process.env for consistency in Node.js environments
    const mode = process?.env?.MODE || nodeEnv;

    if (nodeEnv === 'production' || mode === 'production') return 'production';
    if (nodeEnv === 'test' || mode === 'test') return 'test';
    return 'development';
  }
}

/**
 * Environment variable access with fallbacks and validation
 */
class EnvironmentAccess {
  /**
   * Get environment variable with type safety
   */
  static getString(key: string, fallback?: string): string {
    // Node.js environment (primary for backend services)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || fallback || '';
    }

    // Fallback
    return fallback || '';
  }

  /**
   * Get number environment variable
   */
  static getNumber(key: string, fallback: number): number {
    const value = this.getString(key);
    if (!value) return fallback;

    const parsed = Number(value);
    if (isNaN(parsed)) {
      console.warn(
        `⚠️ Environment variable ${key} must be a number, using fallback: ${fallback}`
      );
      return fallback;
    }

    return parsed;
  }

  /**
   * Get boolean environment variable
   */
  static getBoolean(key: string, fallback: boolean): boolean {
    const value = this.getString(key);
    if (!value) return fallback;

    return value.toLowerCase() === 'true';
  }

  /**
   * Get required environment variable (throws if missing)
   */
  static getRequired(key: string): string {
    const value = this.getString(key);
    if (!value) {
      if (EnvironmentDetector.isBuildTime()) {
        console.warn(
          `⚠️ Required environment variable ${key} not set during build`
        );
        return '';
      }
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Get array from comma-separated string
   */
  static getArray(key: string, fallback: string[] = []): string[] {
    const value = this.getString(key);
    if (!value) return fallback;
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

/**
 * Configuration validation service
 */
class ConfigValidator {
  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate WebSocket URL
   */
  static isValidWebSocketUrl(url: string): boolean {
    const wsRegex = /^(wss?):\/\/.+/;
    return wsRegex.test(url);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate configuration
   */
  static validate(config: Partial<JasaWebConfig>): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate base URLs
    if (config.base?.SITE_URL && !this.isValidUrl(config.base.SITE_URL)) {
      errors.push(`Invalid SITE_URL: ${config.base.SITE_URL}`);
    }

    if (
      config.api?.PUBLIC_API_URL &&
      !this.isValidUrl(config.api.PUBLIC_API_URL)
    ) {
      errors.push(`Invalid PUBLIC_API_URL: ${config.api.PUBLIC_API_URL}`);
    }

    if (config.api?.WEB_BASE_URL && !this.isValidUrl(config.api.WEB_BASE_URL)) {
      errors.push(`Invalid WEB_BASE_URL: ${config.api.WEB_BASE_URL}`);
    }

    // Validate WebSocket URL if enabled
    if (
      config.api?.WS_ENABLED &&
      config.api?.WS_URL &&
      !this.isValidWebSocketUrl(config.api.WS_URL)
    ) {
      errors.push(`Invalid WS_URL: ${config.api.WS_URL}`);
    }

    // Validate email configuration
    if (
      config.email?.CONTACT_EMAIL &&
      !this.isValidEmail(config.email.CONTACT_EMAIL)
    ) {
      errors.push(`Invalid CONTACT_EMAIL: ${config.email.CONTACT_EMAIL}`);
    }

    // Validate required secrets in production
    const isProduction =
      EnvironmentDetector.getEnvironmentType() === 'production';
    if (isProduction) {
      const requiredSecrets = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SESSION_SECRET',
        'ENCRYPTION_KEY',
      ];

      for (const secret of requiredSecrets) {
        const value = EnvironmentAccess.getString(secret);
        if (!value || value.length < 32) {
          errors.push(
            `Production requires ${secret} to be set (min 32 characters)`
          );
        }
      }
    }

    // Warnings
    if (config.security?.BCRYPT_ROUNDS && config.security.BCRYPT_ROUNDS < 10) {
      warnings.push('BCRYPT_ROUNDS should be at least 10 for security');
    }

    if (
      config.api?.API_RATE_LIMIT_MAX &&
      config.api.API_RATE_LIMIT_MAX > 1000
    ) {
      warnings.push('High API_RATE_LIMIT_MAX may impact performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Main Unified Configuration Service
 */
export class UnifiedConfigService {
  private static instance: UnifiedConfigService;
  private readonly config: JasaWebConfig;
  private readonly validation: ConfigValidationResult;

  private constructor() {
    this.config = this.buildConfig();
    this.validation = ConfigValidator.validate(this.config);

    // Log validation results
    if (!this.validation.isValid) {
      console.error(
        '❌ Configuration validation failed:',
        this.validation.errors
      );
      if (EnvironmentDetector.getEnvironmentType() !== 'test') {
        throw new Error(
          `Configuration validation failed: ${this.validation.errors.join(', ')}`
        );
      }
    }

    if (this.validation.warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:', this.validation.warnings);
    }
  }

  public static getInstance(): UnifiedConfigService {
    if (!UnifiedConfigService.instance) {
      UnifiedConfigService.instance = new UnifiedConfigService();
    }
    return UnifiedConfigService.instance;
  }

  /**
   * Build complete configuration
   */
  private buildConfig(): JasaWebConfig {
    const env = EnvironmentAccess;

    return {
      base: {
        NODE_ENV: env.getString('NODE_ENV', 'development') as EnvironmentType,
        PORT: env.getNumber('PORT', 4321),
        SITE_NAME: env.getString('SITE_NAME', 'JasaWeb'),
        SITE_DESCRIPTION: env.getString(
          'SITE_DESCRIPTION',
          'Professional Web Development Services'
        ),
        SITE_AUTHOR: env.getString('SITE_AUTHOR', 'JasaWeb Team'),
        SITE_URL: env.getString('SITE_URL', 'http://localhost:4321'),
        APP_VERSION: env.getString('APP_VERSION', '1.0.0'),
      },

      api: {
        API_PORT: env.getNumber('API_PORT', 3000),
        API_BASE_URL: env.getString('API_BASE_URL', 'http://localhost:3000'),
        API_PREFIX: env.getString('API_PREFIX', 'api'),
        PUBLIC_API_URL: env.getString(
          'PUBLIC_API_URL',
          'http://localhost:3000'
        ),
        WEB_BASE_URL: env.getString('WEB_BASE_URL', 'http://localhost:4321'),
        FRONTEND_URL: env.getString('FRONTEND_URL', 'http://localhost:4321'),

        API_TIMEOUT: env.getNumber('API_TIMEOUT', 30000),
        API_RETRIES: env.getNumber('API_RETRIES', 3),
        API_RETRY_DELAY: env.getNumber('API_RETRY_DELAY', 1000),

        WS_ENABLED: env.getBoolean('WS_ENABLED', true),
        WS_URL: env.getString('WS_URL', 'ws://localhost:3000'),
        WS_RECONNECT_ATTEMPTS: env.getNumber('WS_RECONNECT_ATTEMPTS', 5),
        WS_RECONNECT_DELAY: env.getNumber('WS_RECONNECT_DELAY', 1000),
        WS_HEARTBEAT_INTERVAL: env.getNumber('WS_HEARTBEAT_INTERVAL', 30000),

        API_RATE_LIMIT_ENABLED: env.getBoolean('API_RATE_LIMIT_ENABLED', true),
        API_RATE_LIMIT_WINDOW: env.getNumber('API_RATE_LIMIT_WINDOW', 60000),
        API_RATE_LIMIT_MAX: env.getNumber('API_RATE_LIMIT_MAX', 100),
        API_RATE_LIMIT_SKIP_SUCCESS: env.getBoolean(
          'API_RATE_LIMIT_SKIP_SUCCESS',
          false
        ),
        API_RATE_LIMIT_SKIP_FAILED: env.getBoolean(
          'API_RATE_LIMIT_SKIP_FAILED',
          true
        ),
      },

      database: {
        POSTGRES_DB: env.getString('POSTGRES_DB', 'jasaweb'),
        POSTGRES_USER: env.getString('POSTGRES_USER', 'postgres'),
        POSTGRES_PASSWORD: env.getString('POSTGRES_PASSWORD', ''),
        DATABASE_URL: env.getString('DATABASE_URL', ''),
        DOCKER_DATABASE_URL: env.getString('DOCKER_DATABASE_URL', ''),
      },

      security: {
        JWT_SECRET: env.getString('JWT_SECRET', ''),
        JWT_EXPIRES_IN: env.getString('JWT_EXPIRES_IN', '1d'),
        JWT_REFRESH_SECRET: env.getString('JWT_REFRESH_SECRET', ''),
        JWT_REFRESH_EXPIRES_IN: env.getString('JWT_REFRESH_EXPIRES_IN', '7d'),

        SESSION_SECRET: env.getString('SESSION_SECRET', ''),
        SESSION_MAX_AGE: env.getNumber('SESSION_MAX_AGE', 86400000),

        ENCRYPTION_KEY: env.getString('ENCRYPTION_KEY', ''),

        BCRYPT_ROUNDS: env.getNumber('BCRYPT_ROUNDS', 12),
        ARGON2_MEMORY: env.getNumber('ARGON2_MEMORY', 65536),
        ARGON2_ITERATIONS: env.getNumber('ARGON2_ITERATIONS', 3),
        ARGON2_PARALLELISM: env.getNumber('ARGON2_PARALLELISM', 1),
        ARGON2_SALT_LENGTH: env.getNumber('ARGON2_SALT_LENGTH', 32),
        ARGON2_HASH_LENGTH: env.getNumber('ARGON2_HASH_LENGTH', 32),

        RATE_LIMIT_TTL: env.getNumber('RATE_LIMIT_TTL', 60),
        RATE_LIMIT_MAX: env.getNumber('RATE_LIMIT_MAX', 100),
        THROTTLE_TTL: env.getNumber('THROTTLE_TTL', 60),
        THROTTLE_LIMIT: env.getNumber('THROTTLE_LIMIT', 10),

        MAX_LOGIN_ATTEMPTS: env.getNumber('MAX_LOGIN_ATTEMPTS', 5),
        LOCKOUT_DURATION: env.getNumber('LOCKOUT_DURATION', 900000),

        CORS_ORIGIN: env.getString('CORS_ORIGIN', 'http://localhost:4321'),
      },

      storage: {
        STORAGE_TYPE: env.getString('STORAGE_TYPE', 'local') as 'local' | 's3',

        AWS_REGION: env.getString('AWS_REGION', 'us-east-1'),
        AWS_ACCESS_KEY_ID: env.getString('AWS_ACCESS_KEY_ID', ''),
        AWS_SECRET_ACCESS_KEY: env.getString('AWS_SECRET_ACCESS_KEY', ''),
        S3_BUCKET: env.getString('S3_BUCKET', 'jasaweb-storage'),
        S3_REGION: env.getString('S3_REGION', 'us-east-1'),

        MINIO_ENDPOINT: env.getString(
          'MINIO_ENDPOINT',
          'http://localhost:9000'
        ),
        MINIO_ACCESS_KEY: env.getString('MINIO_ACCESS_KEY', ''),
        MINIO_SECRET_KEY: env.getString('MINIO_SECRET_KEY', ''),
        MINIO_BUCKET: env.getString('MINIO_BUCKET', 'jasaweb-storage'),
        MINIO_ROOT_USER: env.getString('MINIO_ROOT_USER', ''),
        MINIO_ROOT_PASSWORD: env.getString('MINIO_ROOT_PASSWORD', ''),
        DOCKER_MINIO_ENDPOINT: env.getString(
          'DOCKER_MINIO_ENDPOINT',
          'http://minio:9000'
        ),
      },

      redis: {
        REDIS_HOST: env.getString('REDIS_HOST', 'localhost'),
        REDIS_PORT: env.getNumber('REDIS_PORT', 6379),
        REDIS_PASSWORD: env.getString('REDIS_PASSWORD', ''),
        DOCKER_REDIS_HOST: env.getString('DOCKER_REDIS_HOST', 'redis'),
        DOCKER_REDIS_PORT: env.getNumber('DOCKER_REDIS_PORT', 6379),
      },

      email: {
        SMTP_HOST: env.getString('SMTP_HOST', 'smtp.gmail.com'),
        SMTP_PORT: env.getNumber('SMTP_PORT', 587),
        SMTP_SECURE: env.getBoolean('SMTP_SECURE', false),
        SMTP_USER: env.getString('SMTP_USER', ''),
        SMTP_PASS: env.getString('SMTP_PASS', ''),
        EMAIL_FROM: env.getString(
          'EMAIL_FROM',
          '"JasaWeb" <noreply@jasaweb.com>'
        ),
        CONTACT_EMAIL: env.getString('CONTACT_EMAIL', 'contact@jasaweb.com'),
      },

      logging: {
        LOG_LEVEL: env.getString('LOG_LEVEL', 'info'),
        LOG_FILE_PATH: env.getString('LOG_FILE_PATH', './logs'),
        ENABLE_AUDIT_LOG: env.getBoolean('ENABLE_AUDIT_LOG', true),
        ENABLE_VERBOSE_LOGGING: env.getBoolean('ENABLE_VERBOSE_LOGGING', false),
        DEBUG: env.getBoolean('DEBUG', false),
      },

      cache: {
        ENABLE_CACHE: env.getBoolean('ENABLE_CACHE', true),
        CACHE_TTL: env.getNumber('CACHE_TTL', 3600),
        CACHE_MAX: env.getNumber('CACHE_MAX', 100),
      },

      fileUpload: {
        MAX_FILE_SIZE: env.getNumber('MAX_FILE_SIZE', 10485760),
        ALLOWED_FILE_TYPES: env.getString(
          'ALLOWED_FILE_TYPES',
          'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx'
        ),
      },

      development: {
        DEV_MODE: env.getBoolean('DEV_MODE', true),
        VERBOSE: env.getBoolean('VERBOSE', false),
        ENABLE_SWAGGER: env.getBoolean('ENABLE_SWAGGER', true),
        ENABLE_EMAIL_NOTIFICATIONS: env.getBoolean(
          'ENABLE_EMAIL_NOTIFICATIONS',
          true
        ),
        ENABLE_COVERAGE_REPORT: env.getBoolean('ENABLE_COVERAGE_REPORT', true),
        COVERAGE_THRESHOLD: env.getNumber('COVERAGE_THRESHOLD', 80),
      },

      analytics: {
        GOOGLE_ANALYTICS_ID: env.getString('GOOGLE_ANALYTICS_ID', ''),
        GOOGLE_TAG_MANAGER_ID: env.getString('GOOGLE_TAG_MANAGER_ID', ''),
        PUBLIC_GA_ID: env.getString('PUBLIC_GA_ID', ''),
        PUBLIC_GTM_ID: env.getString('PUBLIC_GTM_ID', ''),
      },

      seo: {
        META_TITLE: env.getString(
          'META_TITLE',
          'JasaWeb - Professional Web Development Services'
        ),
        META_DESCRIPTION: env.getString(
          'META_DESCRIPTION',
          'Professional web development services for schools, news portals, and company profiles'
        ),
        META_KEYWORDS: env.getString(
          'META_KEYWORDS',
          'web development, website design, school website, news portal, company profile'
        ),
        OG_IMAGE: env.getString('OG_IMAGE', '/images/og-image.jpg'),
      },

      social: {
        FACEBOOK_URL: env.getString('FACEBOOK_URL', ''),
        TWITTER_URL: env.getString('TWITTER_URL', ''),
        INSTAGRAM_URL: env.getString('INSTAGRAM_URL', ''),
        LINKEDIN_URL: env.getString('LINKEDIN_URL', ''),
      },

      featureFlags: {
        ENABLE_AUTOMATION: env.getBoolean('ENABLE_AUTOMATION', true),
        ENABLE_SELF_HEALING: env.getBoolean('ENABLE_SELF_HEALING', true),
        ENABLE_AUTO_MERGE: env.getBoolean('ENABLE_AUTO_MERGE', true),
        ENABLE_BLOG: env.getBoolean('ENABLE_BLOG', true),
        ENABLE_PORTFOLIO: env.getBoolean('ENABLE_PORTFOLIO', true),
        ENABLE_CONTACT_FORM: env.getBoolean('ENABLE_CONTACT_FORM', true),
      },

      compliance: {
        GDPR_COMPLIANCE_ENABLED: env.getBoolean(
          'GDPR_COMPLIANCE_ENABLED',
          true
        ),
        CCPA_COMPLIANCE_ENABLED: env.getBoolean(
          'CCPA_COMPLIANCE_ENABLED',
          true
        ),
        WCAG_COMPLIANCE_LEVEL: env.getString('WCAG_COMPLIANCE_LEVEL', 'AA'),
      },

      i18n: {
        DEFAULT_LOCALE: env.getString('DEFAULT_LOCALE', 'en'),
        SUPPORTED_LOCALES: env.getString('SUPPORTED_LOCALES', 'en,id,es,fr'),
      },

      mobile: {
        MOBILE_RESPONSIVE_ENABLED: env.getBoolean(
          'MOBILE_RESPONSIVE_ENABLED',
          true
        ),
      },

      opencode: {
        IFLOW_API_KEY: env.getString('IFLOW_API_KEY', ''),
        IFLOW_MODEL: env.getString('IFLOW_MODEL', 'iflowcn/qwen3-max'),
        OPENCODE_DEBUG: env.getBoolean('OPENCODE_DEBUG', false),
      },

      github: {
        GH_TOKEN: env.getString('GH_TOKEN', ''),
      },
    };
  }

  /**
   * Get complete configuration
   */
  public getConfig(): JasaWebConfig {
    return this.config;
  }

  /**
   * Get specific configuration section
   */
  public getSection<T extends ConfigSection>(section: T): JasaWebConfig[T] {
    return this.config[section];
  }

  /**
   * Get nested configuration value by dot notation
   */
  public get<T = unknown>(path: string): T {
    const keys = path.split('.');
    let value: unknown = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        throw new Error(`Configuration path '${path}' not found`);
      }
    }

    return value as T;
  }

  /**
   * Check if configuration is valid
   */
  public isValid(): boolean {
    return this.validation.isValid;
  }

  /**
   * Get validation result
   */
  public getValidation(): ConfigValidationResult {
    return this.validation;
  }

  /**
   * Get configuration summary with options
   */
  public getSummary(options: ConfigSummaryOptions = {}): Record<string, any> {
    const {
      obscureSecrets = true,
      sections = Object.keys(this.config) as ConfigSection[],
    } = options;

    const summary: Record<string, any> = {};

    for (const section of sections) {
      if (section in this.config) {
        summary[section] = this.processSection(
          this.config[section],
          obscureSecrets
        );
      }
    }

    return {
      environment: EnvironmentDetector.getEnvironmentType(),
      isBuildTime: EnvironmentDetector.isBuildTime(),
      isValid: this.validation.isValid,
      validation: {
        errors: this.validation.errors,
        warnings: this.validation.warnings,
      },
      config: summary,
    };
  }

  /**
   * Process configuration section for summary
   */
  private processSection(section: unknown, obscureSecrets: boolean): unknown {
    if (typeof section !== 'object' || section === null) {
      return section;
    }

    const processed: Record<string, unknown> = {};
    const secretKeys = [
      'SECRET',
      'PASSWORD',
      'KEY',
      'TOKEN',
      'PASS',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET',
      'ENCRYPTION_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'MINIO_SECRET_KEY',
      'MINIO_ROOT_PASSWORD',
      'REDIS_PASSWORD',
      'GH_TOKEN',
      'IFLOW_API_KEY',
    ];

    for (const [key, value] of Object.entries(
      section as Record<string, unknown>
    )) {
      if (
        obscureSecrets &&
        secretKeys.some((secret) => key.toUpperCase().includes(secret))
      ) {
        processed[key] = this.obscureValue(value);
      } else if (typeof value === 'string' && value.length > 100) {
        processed[key] = value.substring(0, 100) + '...';
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }

  /**
   * Obscure sensitive values
   */
  private obscureValue(value: unknown): string {
    if (!value) return '[EMPTY]';

    const str = String(value);
    if (str.length <= 8) {
      return '[***]';
    }

    return str.substring(0, 4) + '[***]' + str.substring(str.length - 4);
  }

  public isProduction(): boolean {
    return EnvironmentDetector.getEnvironmentType() === 'production';
  }

  public isTest(): boolean {
    return EnvironmentDetector.getEnvironmentType() === 'test';
  }

  public isBuildTime(): boolean {
    return EnvironmentDetector.isBuildTime();
  }
}

// Export singleton instance
export const unifiedConfig = UnifiedConfigService.getInstance();

// Export types
export type {
  JasaWebConfig,
  ConfigSection,
  EnvironmentType,
  ConfigValidationResult,
  ConfigSummaryOptions,
};

// Export dynamic storage configuration
export {
  storageConfigRegistry,
  StorageConfigRegistry,
} from './dynamic-storage-config.service';

// Re-export types from the dynamic storage config directly
export type {
  StorageType as DynamicStorageType,
  StorageConfig as DynamicStorageConfig,
  StorageValidation as DynamicStorageValidation,
  ValidationResult as DynamicValidationResult,
  StorageAdapter as DynamicStorageAdapter,
  StorageUploadOptions as DynamicStorageUploadOptions,
  StorageUploadResult as DynamicStorageUploadResult,
  StorageDownloadOptions as DynamicStorageDownloadOptions,
  StorageListItem as DynamicStorageListItem,
} from './dynamic-storage-config.service';
