/**
 * JasaWeb Configuration Service - Unified Configuration Management
 *
 * This service consolidates the three existing configuration services:
 * 1. UnifiedConfigService (packages/config/src/unified-config.service.ts)
 * 2. AppConfigService (apps/api/src/common/config/app.config.service.ts)
 * 3. Environment config (apps/web/src/config/envConfig.ts)
 *
 * Features:
 * - Single source of truth for all configuration
 * - Type-safe configuration access with strict TypeScript support
 * - Environment-aware dynamic configuration
 * - Secure handling of sensitive values
 * - Backward compatibility with existing code
 * - Network configuration with dynamic port management
 * - CORS origin management
 * - Database and email configuration
 */

import { Injectable, Logger } from '@nestjs/common';
import type {
  JasaWebConfig,
  ConfigSection,
  EnvironmentType,
  ConfigValidationResult,
} from '@jasaweb/config';

// Import the comprehensive unified configuration
import {
  UnifiedConfigService,
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
  getEnvBoolean,
} from '@jasaweb/config';

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
 * Main JasaWeb Configuration Service
 *
 * This replaces the three scattered configuration services with a single,
 * unified approach while maintaining backward compatibility.
 */
@Injectable()
export class JasaWebConfigService {
  private readonly logger = new Logger(JasaWebConfigService.name);
  private readonly unifiedConfig: UnifiedConfigService;
  private readonly env: EnvironmentType;

  constructor() {
    this.logger.log('Initializing JasaWeb unified configuration service');
    this.unifiedConfig = UnifiedConfigService.getInstance();
    this.env = this.unifiedConfig.getSection('base').NODE_ENV;

    // Validate configuration on initialization
    if (!this.unifiedConfig.isValid()) {
      const validation = this.unifiedConfig.getValidation();
      this.logger.error('Configuration validation failed:', validation.errors);
      throw new Error(
        `Configuration validation failed: ${validation.errors.join(', ')}`
      );
    }

    this.logger.log(`JasaWeb configuration loaded for ${this.env} environment`);
  }

  // Core configuration getters

  /**
   * Get complete configuration object
   */
  public getConfig(): JasaWebConfig {
    return this.unifiedConfig.getConfig();
  }

  /**
   * Get specific configuration section
   */
  public getSection<T extends ConfigSection>(section: T): JasaWebConfig[T] {
    return this.unifiedConfig.getSection(section);
  }

  /**
   * Get configuration value by dot notation path
   */
  public get<T = unknown>(path: string): T {
    try {
      return this.unifiedConfig.get<T>(path);
    } catch (error) {
      // Enhanced error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to get configuration value at path '${path}': ${errorMessage}`
      );

      if (this.env === 'production') {
        throw new Error(`Configuration access failed: ${errorMessage}`);
      }

      // In development, provide more helpful error
      throw new Error(
        `Configuration path '${path}' not found. Available sections: ${Object.keys(this.getConfig()).join(', ')}`
      );
    }
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
    const config = this.getConfig();

    return {
      api: {
        port: config.base.PORT, // Web port for backwards compatibility
        baseUrl: config.base.SITE_URL,
        prefix: config.api.API_PREFIX,
        publicUrl: config.api.PUBLIC_API_URL,
      },
      web: {
        port: config.base.PORT,
        baseUrl: config.base.SITE_URL,
      },
      cors: {
        origins: this.getDynamicCorsOrigins(),
        credentials: true,
      },
      websocket: {
        enabled: config.api.WS_ENABLED,
        url: config.api.WS_URL,
        origin: config.api.WEB_BASE_URL,
      },
    };
  }

  /**
   * Get dynamic CORS origins based on environment
   */
  private getDynamicCorsOrigins(): string[] {
    const config = this.getConfig();
    const corsOrigin = config.security.CORS_ORIGIN;

    // If CORS_ORIGIN is set, use it (single origin or comma-separated)
    if (corsOrigin) {
      return corsOrigin.split(',').map((origin) => origin.trim());
    }

    // Dynamic origins based on environment
    if (this.isDevelopment()) {
      return [
        `${config.base.SITE_URL}`,
        `${config.api.PUBLIC_API_URL}`,
        'http://localhost:4321',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:4321',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];
    }

    // Production origins
    return [
      config.base.SITE_URL,
      config.api.PUBLIC_API_URL,
      'https://jasaweb.com',
      'https://www.jasaweb.com',
      'https://api.jasaweb.com',
    ];
  }

  // Database configuration

  /**
   * Get database configuration
   */
  public getDatabaseConfig(): DatabaseConfig {
    const config = this.getConfig();

    return {
      url: config.database.DATABASE_URL || this.buildDatabaseUrl(),
      host:
        this.extractHostFromUrl(config.database.DATABASE_URL) || 'localhost',
      port: this.extractPortFromUrl(config.database.DATABASE_URL) || 5432,
      name: config.database.POSTGRES_DB,
      user: config.database.POSTGRES_USER,
      ssl: this.isProduction(),
    };
  }

  /**
   * Build database URL from components if needed
   */
  private buildDatabaseUrl(): string {
    const config = this.getConfig();
    const host = config.database.DOCKER_DATABASE_URL
      ? this.extractHostFromUrl(config.database.DOCKER_DATABASE_URL)
      : 'localhost';
    const port = this.extractPortFromUrl(config.database.DATABASE_URL) || 5432;

    return `postgresql://${config.database.POSTGRES_USER}:${config.database.POSTGRES_PASSWORD}@${host}:${port}/${config.database.POSTGRES_DB}`;
  }

  /**
   * Extract host from database URL
   */
  private extractHostFromUrl(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  /**
   * Extract port from database URL
   */
  private extractPortFromUrl(url: string): number | null {
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
    const config = this.getConfig();

    return {
      host: config.email.SMTP_HOST,
      port: config.email.SMTP_PORT,
      secure: config.email.SMTP_SECURE,
      user: config.email.SMTP_USER || undefined,
      pass: config.email.SMTP_PASS || undefined,
      from: config.email.EMAIL_FROM,
      contact: config.email.CONTACT_EMAIL,
    };
  }

  // Security configuration

  /**
   * Get security configuration
   */
  public getSecurityConfig(): SecurityConfig {
    const config = this.getConfig();

    return {
      jwt: {
        secret: config.security.JWT_SECRET,
        expiresIn: config.security.JWT_EXPIRES_IN,
        refreshSecret: config.security.JWT_REFRESH_SECRET,
        refreshExpiresIn: config.security.JWT_REFRESH_EXPIRES_IN,
      },
      session: {
        secret: config.security.SESSION_SECRET,
        maxAge: config.security.SESSION_MAX_AGE,
      },
      encryption: {
        key: config.security.ENCRYPTION_KEY,
      },
      bcrypt: {
        rounds: config.security.BCRYPT_ROUNDS,
      },
      argon2: {
        memory: config.security.ARGON2_MEMORY,
        iterations: config.security.ARGON2_ITERATIONS,
        parallelism: config.security.ARGON2_PARALLELISM,
        saltLength: config.security.ARGON2_SALT_LENGTH,
        hashLength: config.security.ARGON2_HASH_LENGTH,
      },
      rateLimit: {
        ttl: config.security.RATE_LIMIT_TTL,
        max: config.security.RATE_LIMIT_MAX,
      },
      throttle: {
        ttl: config.security.THROTTLE_TTL,
        limit: config.security.THROTTLE_LIMIT,
      },
      maxLoginAttempts: config.security.MAX_LOGIN_ATTEMPTS,
      lockoutDuration: config.security.LOCKOUT_DURATION,
    };
  }

  // Cache configuration

  /**
   * Get cache configuration
   */
  public getCacheConfig(): CacheConfig {
    const config = this.getConfig();

    return {
      enabled: config.cache.ENABLE_CACHE,
      ttl: config.cache.CACHE_TTL,
      max: config.cache.CACHE_MAX,
      redis: {
        host: config.redis.REDIS_HOST,
        port: config.redis.REDIS_PORT,
        password: config.redis.REDIS_PASSWORD || undefined,
      },
    };
  }

  // File upload configuration

  /**
   * Get file upload configuration
   */
  public getFileUploadConfig(): FileUploadConfig {
    const config = this.getConfig();

    return {
      maxSize: config.fileUpload.MAX_FILE_SIZE,
      allowedTypes: config.fileUpload.ALLOWED_FILE_TYPES.split(',').map(
        (type) => type.trim()
      ),
      storage: {
        type: config.storage.STORAGE_TYPE,
        config: {
          ...(config.storage.STORAGE_TYPE === 's3' && {
            region: config.storage.S3_REGION,
            bucket: config.storage.S3_BUCKET,
            accessKeyId: config.storage.AWS_ACCESS_KEY_ID,
            secretAccessKey: config.storage.AWS_SECRET_ACCESS_KEY,
          }),
          ...(config.storage.STORAGE_TYPE === 'local' && {
            endpoint: config.storage.MINIO_ENDPOINT,
            bucket: config.storage.MINIO_BUCKET,
            accessKey: config.storage.MINIO_ACCESS_KEY,
            secretKey: config.storage.MINIO_SECRET_KEY,
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
      const config = this.getConfig();
      return !!(
        config.base.SITE_NAME &&
        config.base.SITE_URL &&
        config.email.CONTACT_EMAIL &&
        this.unifiedConfig.isValid()
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
    return this.unifiedConfig.getSummary({
      obscureSecrets: true,
    });
  }

  /**
   * Get validation results
   */
  public getValidation(): ConfigValidationResult {
    return this.unifiedConfig.getValidation();
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

// Export types for external usage
export type {
  INetworkConfig,
  IDatabaseConfig,
  IEmailConfig,
  ISecurityConfig,
  ICacheConfig,
  IFileUploadConfig,
} from './jasaweb-config.types';
