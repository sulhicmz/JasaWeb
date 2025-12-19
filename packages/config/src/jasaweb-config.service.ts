/**
 * JasaWeb Configuration Service - Unified Configuration Management
 *
 * This service provides type-safe configuration access with environment-aware
 * dynamic configuration and secure handling of sensitive values.
 *
 * Features:
 * - Single source of truth for all configuration
 * - Type-safe configuration access with strict TypeScript support
 * - Environment-aware dynamic configuration
 * - Secure handling of sensitive values
 * - Network configuration with dynamic port management
 * - CORS origin management
 * - Database and email configuration
 * - Dynamic storage configuration management
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
  getEnvBoolean,
  generateSecureSecret,
} from './env-validation';
import { getApiUrl, getWebUrl } from './url-config';

/**
 * Helper function to get optional environment variable with guaranteed string return
 */
function getEnvString(key: string, defaultValue: string): string {
  return getOptionalEnv(key) ?? defaultValue;
}

// Re-export types for external usage
export type {
  INetworkConfig,
  IDatabaseConfig,
  IEmailConfig,
  ISecurityConfig,
  ICacheConfig,
  IFileUploadConfig,
} from './jasaweb-config.types';

/**
 * Environment type definition
 */
export type EnvironmentType = 'development' | 'production' | 'test';

/**
 * Configuration section type
 */
export type ConfigSection =
  | 'base'
  | 'api'
  | 'database'
  | 'security'
  | 'storage'
  | 'redis'
  | 'email'
  | 'logging'
  | 'cache'
  | 'fileUpload'
  | 'development'
  | 'analytics'
  | 'seo'
  | 'social'
  | 'featureFlags'
  | 'compliance'
  | 'i18n'
  | 'mobile'
  | 'opencode'
  | 'github';

/**
 * Main JasaWeb Configuration interface
 */
export interface JasaWebConfig {
  base: {
    NODE_ENV: EnvironmentType;
    PORT: number;
    SITE_NAME: string;
    SITE_DESCRIPTION: string;
    SITE_AUTHOR: string;
    SITE_URL: string;
    APP_VERSION: string;
  };
  api: {
    API_PORT: number;
    API_BASE_URL: string;
    API_PREFIX: string;
    PUBLIC_API_URL: string;
    WEB_BASE_URL: string;
    FRONTEND_URL: string;
    API_TIMEOUT: number;
    API_RETRIES: number;
    API_RETRY_DELAY: number;
    WS_ENABLED: boolean;
    WS_URL: string;
    WS_RECONNECT_ATTEMPTS: number;
    WS_RECONNECT_DELAY: number;
    WS_HEARTBEAT_INTERVAL: number;
    API_RATE_LIMIT_ENABLED: boolean;
    API_RATE_LIMIT_WINDOW: number;
    API_RATE_LIMIT_MAX: number;
    API_RATE_LIMIT_SKIP_SUCCESS: boolean;
    API_RATE_LIMIT_SKIP_FAILED: boolean;
  };
  database: {
    POSTGRES_DB: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    DATABASE_URL: string;
    DOCKER_DATABASE_URL: string;
  };
  security: {
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
    SESSION_SECRET: string;
    SESSION_MAX_AGE: number;
    ENCRYPTION_KEY: string;
    BCRYPT_ROUNDS: number;
    ARGON2_MEMORY: number;
    ARGON2_ITERATIONS: number;
    ARGON2_PARALLELISM: number;
    ARGON2_SALT_LENGTH: number;
    ARGON2_HASH_LENGTH: number;
    RATE_LIMIT_TTL: number;
    RATE_LIMIT_MAX: number;
    THROTTLE_TTL: number;
    THROTTLE_LIMIT: number;
    MAX_LOGIN_ATTEMPTS: number;
    LOCKOUT_DURATION: number;
    CORS_ORIGIN: string;
  };
  storage: {
    STORAGE_TYPE: 'local' | 's3';
    AWS_REGION: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    S3_BUCKET: string;
    S3_REGION: string;
    MINIO_ENDPOINT: string;
    MINIO_ACCESS_KEY: string;
    MINIO_SECRET_KEY: string;
    MINIO_BUCKET: string;
    MINIO_ROOT_USER: string;
    MINIO_ROOT_PASSWORD: string;
    DOCKER_MINIO_ENDPOINT: string;
  };
  redis: {
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string;
    DOCKER_REDIS_HOST: string;
    DOCKER_REDIS_PORT: number;
  };
  email: {
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_USER: string;
    SMTP_PASS: string;
    EMAIL_FROM: string;
    CONTACT_EMAIL: string;
  };
  logging: {
    LOG_LEVEL: string;
    LOG_FILE_PATH: string;
    ENABLE_AUDIT_LOG: boolean;
    ENABLE_VERBOSE_LOGGING: boolean;
    DEBUG: boolean;
  };
  cache: {
    ENABLE_CACHE: boolean;
    CACHE_TTL: number;
    CACHE_MAX: number;
  };
  fileUpload: {
    MAX_FILE_SIZE: number;
    ALLOWED_FILE_TYPES: string;
  };
  development: {
    DEV_MODE: boolean;
    VERBOSE: boolean;
    ENABLE_SWAGGER: boolean;
    ENABLE_EMAIL_NOTIFICATIONS: boolean;
    ENABLE_COVERAGE_REPORT: boolean;
    COVERAGE_THRESHOLD: number;
  };
  analytics: {
    GOOGLE_ANALYTICS_ID: string;
    GOOGLE_TAG_MANAGER_ID: string;
    PUBLIC_GA_ID: string;
    PUBLIC_GTM_ID: string;
  };
  seo: {
    META_TITLE: string;
    META_DESCRIPTION: string;
    META_KEYWORDS: string;
    OG_IMAGE: string;
  };
  social: {
    FACEBOOK_URL: string;
    TWITTER_URL: string;
    INSTAGRAM_URL: string;
    LINKEDIN_URL: string;
  };
  featureFlags: {
    ENABLE_AUTOMATION: boolean;
    ENABLE_SELF_HEALING: boolean;
    ENABLE_AUTO_MERGE: boolean;
    ENABLE_BLOG: boolean;
    ENABLE_PORTFOLIO: boolean;
    ENABLE_CONTACT_FORM: boolean;
  };
  compliance: {
    GDPR_COMPLIANCE_ENABLED: boolean;
    CCPA_COMPLIANCE_ENABLED: boolean;
    WCAG_COMPLIANCE_LEVEL: string;
  };
  i18n: {
    DEFAULT_LOCALE: string;
    SUPPORTED_LOCALES: string;
  };
  mobile: {
    MOBILE_RESPONSIVE_ENABLED: boolean;
  };
  opencode: {
    IFLOW_API_KEY: string;
    IFLOW_MODEL: string;
    OPENCODE_DEBUG: boolean;
  };
  github: {
    GH_TOKEN: string;
  };
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get array from comma-separated environment variable string
 */
function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Network configuration interface
 */
export interface NetworkConfig {
  api: {
    port: number;
    baseUrl: string;
    prefix: string;
    publicUrl: string;
  };
  web: {
    port: number;
    baseUrl: string;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
  websocket: {
    enabled: boolean;
    url: string;
    origin: string;
  };
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  name: string;
  user: string;
  ssl: boolean;
}

/**
 * Email configuration interface
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  contact: string;
}

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  session: {
    secret: string;
    maxAge: number;
  };
  encryption: {
    key: string;
  };
  bcrypt: {
    rounds: number;
  };
  argon2: {
    memory: number;
    iterations: number;
    parallelism: number;
    saltLength: number;
    hashLength: number;
  };
  rateLimit: {
    ttl: number;
    max: number;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  maxLoginAttempts: number;
  lockoutDuration: number;
}

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  max: number;
  redis: {
    host: string;
    port: number;
    password?: string;
  };
}

/**
 * File upload configuration interface
 */
export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  storage: {
    type: 'local' | 's3';
    config: Record<string, string | number | boolean>;
  };
}

/**
 * Dynamic Storage Configuration
 */
export type StorageType = 'local' | 's3' | 'minio' | 'gcs' | 'azure';

export interface StorageConfig {
  type: StorageType;
  name: string;
  displayName: string;
  description: string;
  isAvailable: boolean;
  priority: number;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  validation: StorageValidation;
}

export interface StorageValidation {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  bucketRequired?: boolean;
  regionRequired?: boolean;
  encryptionRequired?: boolean;
  customValidation?: (config: JasaWebConfig) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
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
   * Get environment type
   */
  static getEnvironmentType(): EnvironmentType {
    const nodeEnv = process?.env?.NODE_ENV;
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'test') return 'test';
    return 'development';
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
    const isProduction = this.getEnvironmentType() === 'production';
    if (isProduction) {
      const requiredSecrets = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SESSION_SECRET',
        'ENCRYPTION_KEY',
      ];

      for (const secret of requiredSecrets) {
        const value = process.env[secret];
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
 * Storage Configuration Registry
 */
export class StorageConfigRegistry {
  private static instance: StorageConfigRegistry;
  private configurations: Map<StorageType, StorageConfig> = new Map();
  private currentType: StorageType = 'local';

  private constructor() {
    this.initializeConfigurations();
    this.determineOptimalStorage();
  }

  public static getInstance(): StorageConfigRegistry {
    if (!StorageConfigRegistry.instance) {
      StorageConfigRegistry.instance = new StorageConfigRegistry();
    }
    return StorageConfigRegistry.instance;
  }

  /**
   * Initialize all storage configurations
   */
  private initializeConfigurations(): void {
    const env = {
      getString: getEnvString,
      getNumber: getEnvNumber,
      getBoolean: getEnvBoolean,
    };

    // Local Storage Configuration
    this.configurations.set('local', {
      type: 'local',
      name: 'local',
      displayName: 'Local File System',
      description: 'Store files on the local file system',
      isAvailable: true,
      priority: 1,
      requiredEnvVars: [],
      optionalEnvVars: ['LOCAL_STORAGE_PATH'],
      validation: {
        maxFileSize: env.getNumber('MAX_FILE_SIZE', 10485760),
        allowedMimeTypes: this.parseAllowedTypes(
          env.getString('ALLOWED_FILE_TYPES', '')
        ),
        bucketRequired: false,
        regionRequired: false,
        encryptionRequired: false,
      },
    });

    // S3 Storage Configuration
    const s3Config = {
      type: 's3' as StorageType,
      name: 's3',
      displayName: 'Amazon S3',
      description: 'Store files in Amazon S3 cloud storage',
      isAvailable: this.validateS3Config(),
      priority: 3,
      requiredEnvVars: [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'S3_BUCKET',
      ],
      optionalEnvVars: ['AWS_REGION', 'S3_REGION'],
      validation: {
        maxFileSize: 5 * 1024 * 1024 * 1024,
        allowedMimeTypes: this.parseAllowedTypes(
          env.getString('ALLOWED_FILE_TYPES', '')
        ),
        bucketRequired: true,
        regionRequired: false,
        encryptionRequired: true,
      },
    };

    this.configurations.set('s3', s3Config);

    // MinIO Configuration
    const minioConfig = {
      type: 'minio' as StorageType,
      name: 'minio',
      displayName: 'MinIO',
      description: 'Store files in MinIO S3-compatible storage',
      isAvailable: this.validateMinioConfig(),
      priority: 2,
      requiredEnvVars: ['MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET'],
      optionalEnvVars: ['MINIO_ENDPOINT', 'MINIO_REGION'],
      validation: {
        maxFileSize: 2 * 1024 * 1024 * 1024,
        allowedMimeTypes: this.parseAllowedTypes(
          env.getString('ALLOWED_FILE_TYPES', '')
        ),
        bucketRequired: true,
        regionRequired: false,
        encryptionRequired: false,
      },
    };

    this.configurations.set('minio', minioConfig);
  }

  private validateS3Config(): boolean {
    return !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET
    );
  }

  private validateMinioConfig(): boolean {
    return !!(
      process.env.MINIO_ACCESS_KEY &&
      process.env.MINIO_SECRET_KEY &&
      process.env.MINIO_BUCKET
    );
  }

  private parseAllowedTypes(typesString: string): string[] {
    if (!typesString) return [];
    return typesString
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);
  }

  private determineOptimalStorage(): void {
    const requestedType = process.env.STORAGE_TYPE as StorageType;

    if (requestedType && this.configurations.has(requestedType)) {
      const config = this.configurations.get(requestedType)!;
      if (config.isAvailable) {
        this.currentType = requestedType;
        return;
      }
    }

    // Fallback to highest priority available storage
    const availableConfigs = Array.from(this.configurations.values())
      .filter((c) => c.isAvailable)
      .sort((a, b) => b.priority - a.priority);

    if (availableConfigs.length > 0) {
      this.currentType = availableConfigs[0]!.type;
    }
  }

  public getCurrentStorageType(): StorageType {
    return this.currentType;
  }

  public getStorageConfig(type: StorageType): StorageConfig | undefined {
    return this.configurations.get(type);
  }

  public getCurrentStorageConfig(): StorageConfig | undefined {
    return this.configurations.get(this.currentType);
  }

  public getAvailableStorageConfigs(): StorageConfig[] {
    return Array.from(this.configurations.values())
      .filter((config) => config.isAvailable)
      .sort((a, b) => b.priority - a.priority);
  }

  public validateCurrentStorage(): ValidationResult {
    const config = this.getCurrentStorageConfig();
    if (!config) {
      return {
        isValid: false,
        errors: ['No storage configuration available'],
        warnings: ['Local storage will be used as fallback'],
      };
    }

    return {
      isValid: config.isAvailable,
      errors: [],
      warnings: [],
    };
  }

  public getStorageSummary(): Record<string, unknown> {
    const currentConfig = this.getCurrentStorageConfig();
    const availableConfigs = this.getAvailableStorageConfigs();

    return {
      current: {
        type: this.currentType,
        name: currentConfig?.displayName || 'Unknown',
        available: currentConfig?.isAvailable || false,
      },
      available: availableConfigs.map((config) => ({
        type: config.type,
        name: config.displayName,
        priority: config.priority,
      })),
      total: this.configurations.size,
      validation: this.validateCurrentStorage(),
    };
  }

  public autoSelectBestStorage(): {
    previousType: StorageType;
    newType: StorageType;
    reason: string;
  } {
    const previousType = this.currentType;
    const previousConfig = this.configurations.get(previousType);

    if (previousConfig?.isAvailable) {
      return {
        previousType,
        newType: previousType,
        reason: 'Current storage is optimal',
      };
    }

    this.determineOptimalStorage();
    const newConfig = this.configurations.get(this.currentType);

    return {
      previousType,
      newType: this.currentType,
      reason: previousConfig?.isAvailable
        ? `Previous storage '${previousType}' became unavailable, switched to '${this.currentType}'`
        : `Selected best available storage: '${newConfig?.displayName}'`,
    };
  }

  public switchStorageType(type: StorageType): ValidationResult {
    const config = this.configurations.get(type);

    if (!config) {
      return {
        isValid: false,
        errors: [`Storage type '${type}' is not supported`],
        warnings: [],
      };
    }

    if (!config.isAvailable) {
      return {
        isValid: false,
        errors: [`Storage type '${type}' is not available`],
        warnings: [],
      };
    }

    this.currentType = type;

    return {
      isValid: true,
      errors: [],
      warnings:
        config.type === 'local'
          ? ['Using local storage - ensure proper backup strategy']
          : [],
    };
  }
}

// Export singleton instance
export const storageConfigRegistry = StorageConfigRegistry.getInstance();

/**
 * Main JasaWeb Configuration Service
 */
@Injectable()
export class JasaWebConfigService {
  private readonly logger = new Logger(JasaWebConfigService.name);
  private readonly config: JasaWebConfig;
  private readonly validation: ConfigValidationResult;
  private readonly env: EnvironmentType;

  constructor() {
    this.logger.log('Initializing JasaWeb unified configuration service');
    this.config = this.buildConfig();
    this.env = this.config.base.NODE_ENV;
    this.validation = ConfigValidator.validate(this.config);

    // Validate configuration on initialization
    if (!this.validation.isValid) {
      this.logger.error(
        'Configuration validation failed:',
        this.validation.errors
      );
      if (this.env !== 'test') {
        throw new Error(
          `Configuration validation failed: ${this.validation.errors.join(', ')}`
        );
      }
    }

    if (this.validation.warnings.length > 0) {
      this.logger.warn('Configuration warnings:', this.validation.warnings);
    }

    this.logger.log(`JasaWeb configuration loaded for ${this.env} environment`);
  }

  /**
   * Build complete configuration
   */
  private buildConfig(): JasaWebConfig {
    return {
      base: {
        NODE_ENV: getEnvString('NODE_ENV', 'development') as EnvironmentType,
        PORT: getEnvNumber('PORT', 4321),
        SITE_NAME: getEnvString('SITE_NAME', 'JasaWeb'),
        SITE_DESCRIPTION: getEnvString(
          'SITE_DESCRIPTION',
          'Professional Web Development Services'
        ),
        SITE_AUTHOR: getEnvString('SITE_AUTHOR', 'JasaWeb Team'),
        SITE_URL: getEnvString('SITE_URL', getWebUrl()),
        APP_VERSION: getEnvString('APP_VERSION', '1.0.0'),
      },

      api: {
        API_PORT: getEnvNumber('API_PORT', 3000),
        API_BASE_URL: getEnvString('API_BASE_URL', getApiUrl())!,
        API_PREFIX: getEnvString('API_PREFIX', 'api'),
        PUBLIC_API_URL: getEnvString('PUBLIC_API_URL', getApiUrl()),
        WEB_BASE_URL: getEnvString('WEB_BASE_URL', getWebUrl()),
        FRONTEND_URL: getEnvString('FRONTEND_URL', getWebUrl()),

        API_TIMEOUT: getEnvNumber('API_TIMEOUT', 30000),
        API_RETRIES: getEnvNumber('API_RETRIES', 3),
        API_RETRY_DELAY: getEnvNumber('API_RETRY_DELAY', 1000),

        WS_ENABLED: getEnvBoolean('WS_ENABLED', true),
        WS_URL: getEnvString('WS_URL', 'ws://localhost:3000'),
        WS_RECONNECT_ATTEMPTS: getEnvNumber('WS_RECONNECT_ATTEMPTS', 5),
        WS_RECONNECT_DELAY: getEnvNumber('WS_RECONNECT_DELAY', 1000),
        WS_HEARTBEAT_INTERVAL: getEnvNumber('WS_HEARTBEAT_INTERVAL', 30000),

        API_RATE_LIMIT_ENABLED: getEnvBoolean('API_RATE_LIMIT_ENABLED', true),
        API_RATE_LIMIT_WINDOW: getEnvNumber('API_RATE_LIMIT_WINDOW', 60000),
        API_RATE_LIMIT_MAX: getEnvNumber('API_RATE_LIMIT_MAX', 100),
        API_RATE_LIMIT_SKIP_SUCCESS: getEnvBoolean(
          'API_RATE_LIMIT_SKIP_SUCCESS',
          false
        ),
        API_RATE_LIMIT_SKIP_FAILED: getEnvBoolean(
          'API_RATE_LIMIT_SKIP_FAILED',
          true
        ),
      },

      database: {
        POSTGRES_DB: getEnvString('POSTGRES_DB', 'jasaweb'),
        POSTGRES_USER: getEnvString('POSTGRES_USER', 'postgres'),
        POSTGRES_PASSWORD: getEnvString('POSTGRES_PASSWORD', ''),
        DATABASE_URL: getEnvString('DATABASE_URL', ''),
        DOCKER_DATABASE_URL: getEnvString('DOCKER_DATABASE_URL', ''),
      },

      security: {
        JWT_SECRET: getEnvString('JWT_SECRET', ''),
        JWT_EXPIRES_IN: getEnvString('JWT_EXPIRES_IN', '1d'),
        JWT_REFRESH_SECRET: getEnvString('JWT_REFRESH_SECRET', ''),
        JWT_REFRESH_EXPIRES_IN: getEnvString('JWT_REFRESH_EXPIRES_IN', '7d'),

        SESSION_SECRET: getEnvString('SESSION_SECRET', ''),
        SESSION_MAX_AGE: getEnvNumber('SESSION_MAX_AGE', 86400000),

        ENCRYPTION_KEY: getEnvString('ENCRYPTION_KEY', ''),

        BCRYPT_ROUNDS: getEnvNumber('BCRYPT_ROUNDS', 12),
        ARGON2_MEMORY: getEnvNumber('ARGON2_MEMORY', 65536),
        ARGON2_ITERATIONS: getEnvNumber('ARGON2_ITERATIONS', 3),
        ARGON2_PARALLELISM: getEnvNumber('ARGON2_PARALLELISM', 1),
        ARGON2_SALT_LENGTH: getEnvNumber('ARGON2_SALT_LENGTH', 32),
        ARGON2_HASH_LENGTH: getEnvNumber('ARGON2_HASH_LENGTH', 32),

        RATE_LIMIT_TTL: getEnvNumber('RATE_LIMIT_TTL', 60),
        RATE_LIMIT_MAX: getEnvNumber('RATE_LIMIT_MAX', 100),
        THROTTLE_TTL: getEnvNumber('THROTTLE_TTL', 60),
        THROTTLE_LIMIT: getEnvNumber('THROTTLE_LIMIT', 10),

        MAX_LOGIN_ATTEMPTS: getEnvNumber('MAX_LOGIN_ATTEMPTS', 5),
        LOCKOUT_DURATION: getEnvNumber('LOCKOUT_DURATION', 900000),

        CORS_ORIGIN: getEnvString('CORS_ORIGIN', getWebUrl()),
      },

      storage: {
        STORAGE_TYPE: getEnvString('STORAGE_TYPE', 'local') as 'local' | 's3',

        AWS_REGION: getEnvString('AWS_REGION', 'us-east-1'),
        AWS_ACCESS_KEY_ID: getEnvString('AWS_ACCESS_KEY_ID', ''),
        AWS_SECRET_ACCESS_KEY: getEnvString('AWS_SECRET_ACCESS_KEY', ''),
        S3_BUCKET: getEnvString('S3_BUCKET', 'jasaweb-storage'),
        S3_REGION: getEnvString('S3_REGION', 'us-east-1'),

        MINIO_ENDPOINT: getEnvString('MINIO_ENDPOINT', 'http://localhost:9000'),
        MINIO_ACCESS_KEY: getEnvString('MINIO_ACCESS_KEY', ''),
        MINIO_SECRET_KEY: getEnvString('MINIO_SECRET_KEY', ''),
        MINIO_BUCKET: getEnvString('MINIO_BUCKET', 'jasaweb-storage'),
        MINIO_ROOT_USER: getEnvString('MINIO_ROOT_USER', ''),
        MINIO_ROOT_PASSWORD: getEnvString('MINIO_ROOT_PASSWORD', ''),
        DOCKER_MINIO_ENDPOINT: getEnvString(
          'DOCKER_MINIO_ENDPOINT',
          'http://minio:9000'
        ),
      },

      redis: {
        REDIS_HOST: getEnvString('REDIS_HOST', 'localhost'),
        REDIS_PORT: getEnvNumber('REDIS_PORT', 6379),
        REDIS_PASSWORD: getEnvString('REDIS_PASSWORD', ''),
        DOCKER_REDIS_HOST: getEnvString('DOCKER_REDIS_HOST', 'redis'),
        DOCKER_REDIS_PORT: getEnvNumber('DOCKER_REDIS_PORT', 6379),
      },

      email: {
        SMTP_HOST: getEnvString('SMTP_HOST', 'smtp.gmail.com'),
        SMTP_PORT: getEnvNumber('SMTP_PORT', 587),
        SMTP_SECURE: getEnvBoolean('SMTP_SECURE', false),
        SMTP_USER: getEnvString('SMTP_USER', ''),
        SMTP_PASS: getEnvString('SMTP_PASS', ''),
        EMAIL_FROM: getEnvString(
          'EMAIL_FROM',
          '"JasaWeb" <noreply@jasaweb.com>'
        ),
        CONTACT_EMAIL: getEnvString('CONTACT_EMAIL', 'contact@jasaweb.com'),
      },

      logging: {
        LOG_LEVEL: getEnvString('LOG_LEVEL', 'info'),
        LOG_FILE_PATH: getEnvString('LOG_FILE_PATH', './logs'),
        ENABLE_AUDIT_LOG: getEnvBoolean('ENABLE_AUDIT_LOG', true),
        ENABLE_VERBOSE_LOGGING: getEnvBoolean('ENABLE_VERBOSE_LOGGING', false),
        DEBUG: getEnvBoolean('DEBUG', false),
      },

      cache: {
        ENABLE_CACHE: getEnvBoolean('ENABLE_CACHE', true),
        CACHE_TTL: getEnvNumber('CACHE_TTL', 3600),
        CACHE_MAX: getEnvNumber('CACHE_MAX', 100),
      },

      fileUpload: {
        MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', 10485760),
        ALLOWED_FILE_TYPES: getEnvString(
          'ALLOWED_FILE_TYPES',
          'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx'
        ),
      },

      development: {
        DEV_MODE: getEnvBoolean('DEV_MODE', true),
        VERBOSE: getEnvBoolean('VERBOSE', false),
        ENABLE_SWAGGER: getEnvBoolean('ENABLE_SWAGGER', true),
        ENABLE_EMAIL_NOTIFICATIONS: getEnvBoolean(
          'ENABLE_EMAIL_NOTIFICATIONS',
          true
        ),
        ENABLE_COVERAGE_REPORT: getEnvBoolean('ENABLE_COVERAGE_REPORT', true),
        COVERAGE_THRESHOLD: getEnvNumber('COVERAGE_THRESHOLD', 80),
      },

      analytics: {
        GOOGLE_ANALYTICS_ID: getEnvString('GOOGLE_ANALYTICS_ID', ''),
        GOOGLE_TAG_MANAGER_ID: getEnvString('GOOGLE_TAG_MANAGER_ID', ''),
        PUBLIC_GA_ID: getEnvString('PUBLIC_GA_ID', ''),
        PUBLIC_GTM_ID: getEnvString('PUBLIC_GTM_ID', ''),
      },

      seo: {
        META_TITLE: getEnvString(
          'META_TITLE',
          'JasaWeb - Professional Web Development Services'
        ),
        META_DESCRIPTION: getEnvString(
          'META_DESCRIPTION',
          'Professional web development services for schools, news portals, and company profiles'
        ),
        META_KEYWORDS: getEnvString(
          'META_KEYWORDS',
          'web development, website design, school website, news portal, company profile'
        ),
        OG_IMAGE: getEnvString('OG_IMAGE', '/images/og-image.jpg'),
      },

      social: {
        FACEBOOK_URL: getEnvString('FACEBOOK_URL', ''),
        TWITTER_URL: getEnvString('TWITTER_URL', ''),
        INSTAGRAM_URL: getEnvString('INSTAGRAM_URL', ''),
        LINKEDIN_URL: getEnvString('LINKEDIN_URL', ''),
      },

      featureFlags: {
        ENABLE_AUTOMATION: getEnvBoolean('ENABLE_AUTOMATION', true),
        ENABLE_SELF_HEALING: getEnvBoolean('ENABLE_SELF_HEALING', true),
        ENABLE_AUTO_MERGE: getEnvBoolean('ENABLE_AUTO_MERGE', true),
        ENABLE_BLOG: getEnvBoolean('ENABLE_BLOG', true),
        ENABLE_PORTFOLIO: getEnvBoolean('ENABLE_PORTFOLIO', true),
        ENABLE_CONTACT_FORM: getEnvBoolean('ENABLE_CONTACT_FORM', true),
      },

      compliance: {
        GDPR_COMPLIANCE_ENABLED: getEnvBoolean('GDPR_COMPLIANCE_ENABLED', true),
        CCPA_COMPLIANCE_ENABLED: getEnvBoolean('CCPA_COMPLIANCE_ENABLED', true),
        WCAG_COMPLIANCE_LEVEL: getEnvString('WCAG_COMPLIANCE_LEVEL', 'AA'),
      },

      i18n: {
        DEFAULT_LOCALE: getEnvString('DEFAULT_LOCALE', 'en'),
        SUPPORTED_LOCALES: getEnvString('SUPPORTED_LOCALES', 'en,id,es,fr'),
      },

      mobile: {
        MOBILE_RESPONSIVE_ENABLED: getEnvBoolean(
          'MOBILE_RESPONSIVE_ENABLED',
          true
        ),
      },

      opencode: {
        IFLOW_API_KEY: getEnvString('IFLOW_API_KEY', ''),
        IFLOW_MODEL: getEnvString('IFLOW_MODEL', 'iflowcn/qwen3-max'),
        OPENCODE_DEBUG: getEnvBoolean('OPENCODE_DEBUG', false),
      },

      github: {
        GH_TOKEN: getEnvString('GH_TOKEN', ''),
      },
    };
  }

  // Core configuration getters

  /**
   * Get specific configuration section
   */
  public getSection<T extends ConfigSection>(section: T): JasaWebConfig[T] {
    return this.config[section];
  }

  /**
   * Get configuration value by dot notation path
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

  // Environment detection methods

  public isDevelopment(): boolean {
    return this.env === 'development';
  }

  public isProduction(): boolean {
    return this.env === 'production';
  }

  public isTest(): boolean {
    return this.env === 'test';
  }

  public getEnvironmentType(): EnvironmentType {
    return this.env;
  }

  // Network configuration (eliminates hardcoded values)

  /**
   * Get network configuration with dynamic port management
   */
  public getNetworkConfig(): NetworkConfig {
    return {
      api: {
        port: this.config.base.PORT,
        baseUrl: this.config.base.SITE_URL,
        prefix: this.config.api.API_PREFIX,
        publicUrl: this.config.api.PUBLIC_API_URL,
      },
      web: {
        port: this.config.base.PORT,
        baseUrl: this.config.base.SITE_URL,
      },
      cors: {
        origins: this.getDynamicCorsOrigins(),
        credentials: true,
      },
      websocket: {
        enabled: this.config.api.WS_ENABLED,
        url: this.config.api.WS_URL,
        origin: this.config.api.WEB_BASE_URL,
      },
    };
  }

  /**
   * Get dynamic CORS origins based on environment
   */
  private getDynamicCorsOrigins(): string[] {
    const corsOrigin = this.config.security.CORS_ORIGIN;

    // If CORS_ORIGIN is set, use it (single origin or comma-separated)
    if (corsOrigin) {
      return corsOrigin.split(',').map((origin) => origin.trim());
    }

    // Dynamic origins based on environment
    if (this.isDevelopment()) {
      return [
        `${this.config.base.SITE_URL}`,
        `${this.config.api.PUBLIC_API_URL}`,
        getWebUrl(),
        getApiUrl(),
        'http://127.0.0.1:4321',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];
    }

    // Production origins
    return [
      this.config.base.SITE_URL,
      this.config.api.PUBLIC_API_URL,
      getWebUrl(),
      `https://www.${getWebUrl().replace('https://', '')}`,
      getApiUrl(),
    ];
  }

  // Database configuration

  /**
   * Get database configuration
   */
  public getDatabaseConfig(): DatabaseConfig {
    return {
      url: this.config.database.DATABASE_URL || this.buildDatabaseUrl(),
      host:
        this.extractHostFromUrl(this.config.database.DATABASE_URL) ||
        'localhost',
      port: this.extractPortFromUrl(this.config.database.DATABASE_URL) || 5432,
      name: this.config.database.POSTGRES_DB,
      user: this.config.database.POSTGRES_USER,
      ssl: this.isProduction(),
    };
  }

  /**
   * Build database URL from components if needed
   */
  private buildDatabaseUrl(): string {
    const host = this.config.database.DOCKER_DATABASE_URL
      ? this.extractHostFromUrl(this.config.database.DOCKER_DATABASE_URL)
      : 'localhost';
    const port =
      this.extractPortFromUrl(this.config.database.DATABASE_URL) || 5432;

    const user = this.config.database.POSTGRES_USER || 'postgres';
    const password = this.config.database.POSTGRES_PASSWORD || '';
    const database = this.config.database.POSTGRES_DB || 'jasaweb';

    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  /**
   * Extract host from database URL
   */
  private extractHostFromUrl(url: string | undefined): string | null {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  /**
   * Extract port from database URL
   */
  private extractPortFromUrl(url: string | undefined): number | null {
    if (!url) return null;
    try {
      return new URL(url).port ? parseInt(new URL(url).port, 10) : null;
    } catch {
      return null;
    }
  }

  // Email configuration

  /**
   * Get email configuration
   */
  public getEmailConfig(): EmailConfig {
    return {
      host: this.config.email.SMTP_HOST || 'smtp.gmail.com',
      port: this.config.email.SMTP_PORT || 587,
      secure: this.config.email.SMTP_SECURE || false,
      user: this.config.email.SMTP_USER || undefined,
      pass: this.config.email.SMTP_PASS || undefined,
      from: this.config.email.EMAIL_FROM || '"JasaWeb" <noreply@jasaweb.com>',
      contact: this.config.email.CONTACT_EMAIL || 'contact@jasaweb.com',
    };
  }

  // Security configuration

  /**
   * Get security configuration
   */
  public getSecurityConfig(): SecurityConfig {
    return {
      jwt: {
        secret: this.config.security.JWT_SECRET,
        expiresIn: this.config.security.JWT_EXPIRES_IN,
        refreshSecret: this.config.security.JWT_REFRESH_SECRET,
        refreshExpiresIn: this.config.security.JWT_REFRESH_EXPIRES_IN,
      },
      session: {
        secret: this.config.security.SESSION_SECRET,
        maxAge: this.config.security.SESSION_MAX_AGE,
      },
      encryption: {
        key: this.config.security.ENCRYPTION_KEY,
      },
      bcrypt: {
        rounds: this.config.security.BCRYPT_ROUNDS,
      },
      argon2: {
        memory: this.config.security.ARGON2_MEMORY,
        iterations: this.config.security.ARGON2_ITERATIONS,
        parallelism: this.config.security.ARGON2_PARALLELISM,
        saltLength: this.config.security.ARGON2_SALT_LENGTH,
        hashLength: this.config.security.ARGON2_HASH_LENGTH,
      },
      rateLimit: {
        ttl: this.config.security.RATE_LIMIT_TTL,
        max: this.config.security.RATE_LIMIT_MAX,
      },
      throttle: {
        ttl: this.config.security.THROTTLE_TTL,
        limit: this.config.security.THROTTLE_LIMIT,
      },
      maxLoginAttempts: this.config.security.MAX_LOGIN_ATTEMPTS,
      lockoutDuration: this.config.security.LOCKOUT_DURATION,
    };
  }

  // Cache configuration

  /**
   * Get cache configuration
   */
  public getCacheConfig(): CacheConfig {
    return {
      enabled: this.config.cache.ENABLE_CACHE,
      ttl: this.config.cache.CACHE_TTL,
      max: this.config.cache.CACHE_MAX,
      redis: {
        host: this.config.redis.REDIS_HOST,
        port: this.config.redis.REDIS_PORT,
        password: this.config.redis.REDIS_PASSWORD || undefined,
      },
    };
  }

  // File upload configuration

  /**
   * Get file upload configuration
   */
  public getFileUploadConfig(): FileUploadConfig {
    return {
      maxSize: this.config.fileUpload.MAX_FILE_SIZE,
      allowedTypes: this.config.fileUpload.ALLOWED_FILE_TYPES.split(',').map(
        (type) => type.trim()
      ),
      storage: {
        type: this.config.storage.STORAGE_TYPE,
        config: {
          ...(this.config.storage.STORAGE_TYPE === 's3' && {
            region: this.config.storage.S3_REGION,
            bucket: this.config.storage.S3_BUCKET,
            accessKeyId: this.config.storage.AWS_ACCESS_KEY_ID,
            secretAccessKey: this.config.storage.AWS_SECRET_ACCESS_KEY,
          }),
          ...(this.config.storage.STORAGE_TYPE === 'local' && {
            endpoint: this.config.storage.MINIO_ENDPOINT,
            bucket: this.config.storage.MINIO_BUCKET,
            accessKey: this.config.storage.MINIO_ACCESS_KEY,
            secretKey: this.config.storage.MINIO_SECRET_KEY,
          }),
        },
      },
    };
  }

  // Utility methods for backward compatibility

  /**
   * Get API URL with path (backward compatibility)
   */
  public getApiUrl(path: string = ''): string {
    const networkConfig = this.getNetworkConfig();
    const baseUrl = networkConfig.api.baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Get Web URL with path (backward compatibility)
   */
  public getWebUrl(path: string = ''): string {
    const networkConfig = this.getNetworkConfig();
    const baseUrl = networkConfig.web.baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Check if origin is allowed for CORS
   */
  public isOriginAllowed(origin: string): boolean {
    const networkConfig = this.getNetworkConfig();
    return networkConfig.cors.origins.includes(origin);
  }

  /**
   * Health check for configuration
   */
  public isHealthy(): boolean {
    try {
      return !!(
        this.config.base.SITE_NAME &&
        this.config.base.SITE_URL &&
        this.config.email.CONTACT_EMAIL &&
        this.validation.isValid
      );
    } catch (error) {
      this.logger.error('Configuration health check failed:', error);
      return false;
    }
  }

  /**
   * Get configuration summary for monitoring (without secrets)
   */
  public getConfigSummary(): Record<string, unknown> {
    return this.getSummary({
      obscureSecrets: true,
    });
  }

  /**
   * Get configuration summary with options
   */
  public getSummary(
    options: { obscureSecrets?: boolean; sections?: ConfigSection[] } = {}
  ): Record<string, unknown> {
    const {
      obscureSecrets = true,
      sections = Object.keys(this.config) as ConfigSection[],
    } = options;

    const summary: Record<string, unknown> = {};

    for (const section of sections) {
      if (section in this.config) {
        summary[section] = this.processSection(
          this.config[section],
          obscureSecrets
        );
      }
    }

    return {
      environment: this.env,
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

  /**
   * Get validation results
   */
  public getValidation(): ConfigValidationResult {
    return this.validation;
  }

  /**
   * Log configuration (without secrets) for debugging
   */
  public logConfiguration(): void {
    const networkConfig = this.getNetworkConfig();
    const databaseConfig = this.getDatabaseConfig();
    const emailConfig = this.getEmailConfig();

    this.logger.debug('JasaWeb configuration loaded', {
      environment: this.env,
      network: {
        api: `${networkConfig.api.baseUrl}:${networkConfig.api.port}`,
        web: `${networkConfig.web.baseUrl}:${networkConfig.web.port}`,
        corsOrigins: networkConfig.cors.origins,
        websocket: {
          enabled: networkConfig.websocket.enabled,
          url: networkConfig.websocket.url,
        },
      },
      database: {
        host: databaseConfig.host,
        port: databaseConfig.port,
        name: databaseConfig.name,
        ssl: databaseConfig.ssl,
      },
      email: {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        from: emailConfig.from,
        contact: emailConfig.contact,
      },
    });
  }
}

// Export singleton instance for non-injected usage
export const jasaWebConfig = new JasaWebConfigService();
