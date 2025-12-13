/**
 * Configuration Service - Centralized environment variable management
 *
 * This service provides type-safe access to all environment variables
 * with sensible defaults and validation.
 */

export interface AppConfig {
  // Application
  app: {
    name: string;
    env: 'development' | 'staging' | 'production';
    port: number;
    url: string;
  };

  // API Configuration
  api: {
    port: number;
    prefix: string;
    baseUrl: string;
    docsUrl: string;
    timeout: number;
  };

  // Database
  database: {
    url: string;
    poolMin: number;
    poolMax: number;
    connectionTimeout: number;
  };

  // Security
  security: {
    jwtSecret: string;
    jwtRefreshSecret: string;
    jwtExpiry: string;
    jwtRefreshExpiry: string;
    bcryptRounds: number;
    sessionSecret: string;
    passwordMinLength: number;
    passwordMaxLength: number;
    lockoutMaxAttempts: number;
    lockoutDuration: number;
    rateLimitTtl: number;
    rateLimitMax: number;
  };

  // External Services
  services: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
      from: string;
    };
    storage: {
      bucket: string;
      region: string;
      accessKey: string;
      secretKey: string;
      endpoint?: string;
    };
  };

  // Frontend Configuration
  frontend: {
    url: string;
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
  };

  // Business Logic
  business: {
    maxFileSize: number;
    allowedFileTypes: string[];
    projectDefaultStatus: string;
    milestoneDefaultStatus: string;
    ticketDefaultPriority: string;
    invoiceDefaultStatus: string;
    notificationTimeout: number;
    notificationRetryAttempts: number;
    cacheTtl: number;
    maxCacheItems: number;
  };

  // Monitoring & Logging
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    enableTracing: boolean;
    healthCheckInterval: number;
  };
}

export class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): AppConfig {
    const parseNumber = (
      env: string | undefined,
      defaultValue: number
    ): number => {
      if (env === undefined || env === '') return defaultValue;
      const parsed = parseInt(env, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    const parseBoolean = (
      env: string | undefined,
      defaultValue: boolean
    ): boolean => {
      if (env === undefined || env === '') return defaultValue;
      return env.toLowerCase() === 'true';
    };

    const parseArray = (
      env: string | undefined,
      defaultValue: string[]
    ): string[] => {
      if (!env) return defaultValue;
      try {
        return JSON.parse(env);
      } catch {
        return env
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    };

    return {
      app: {
        name: process.env.APP_NAME || 'JasaWeb',
        env:
          (process.env.NODE_ENV as 'development' | 'staging' | 'production') ||
          'development',
        port: parseNumber(process.env.PORT, 4321),
        url: process.env.APP_URL || 'http://localhost:4321',
      },

      api: {
        port: parseNumber(process.env.API_PORT, 3000),
        prefix: process.env.API_PREFIX || 'api',
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        docsUrl: process.env.API_DOCS_URL || 'http://localhost:3000/api/docs',
        timeout: parseNumber(process.env.API_TIMEOUT, 30000),
      },

      database: {
        url:
          process.env.DATABASE_URL ||
          'postgresql://postgres:password@localhost:5432/jasaweb',
        poolMin: parseNumber(process.env.DB_POOL_MIN, 2),
        poolMax: parseNumber(process.env.DB_POOL_MAX, 10),
        connectionTimeout: parseNumber(
          process.env.DB_CONNECTION_TIMEOUT,
          30000
        ),
      },

      security: {
        jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        jwtRefreshSecret:
          process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
        jwtExpiry: process.env.JWT_EXPIRY || '1h',
        jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
        bcryptRounds: parseNumber(process.env.BCRYPT_ROUNDS, 12),
        sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
        passwordMinLength: parseNumber(process.env.PASSWORD_MIN_LENGTH, 8),
        passwordMaxLength: parseNumber(process.env.PASSWORD_MAX_LENGTH, 128),
        lockoutMaxAttempts: parseNumber(process.env.LOCKOUT_MAX_ATTEMPTS, 5),
        lockoutDuration: parseNumber(process.env.LOCKOUT_DURATION, 900000), // 15 minutes
        rateLimitTtl: parseNumber(process.env.RATE_LIMIT_TTL, 60),
        rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 100),
      },

      services: {
        smtp: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseNumber(process.env.SMTP_PORT, 587),
          secure: parseBoolean(process.env.SMTP_SECURE, false),
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
          from: process.env.SMTP_FROM || 'noreply@jasaweb.com',
        },
        storage: {
          bucket: process.env.S3_BUCKET || 'jasaweb-storage',
          region: process.env.S3_REGION || 'us-east-1',
          accessKey: process.env.S3_ACCESS_KEY || '',
          secretKey: process.env.S3_SECRET_KEY || '',
          endpoint: process.env.S3_ENDPOINT,
        },
      },

      frontend: {
        url:
          process.env.FRONTEND_URL ||
          process.env.SITE_URL ||
          'http://localhost:4321',
        siteName: process.env.SITE_NAME || 'JasaWeb',
        siteDescription:
          process.env.SITE_DESCRIPTION ||
          'Professional Web Development Services',
        contactEmail: process.env.CONTACT_EMAIL || 'contact@jasaweb.com',
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
        googleTagManagerId: process.env.GOOGLE_TAG_MANAGER_ID,
      },

      business: {
        maxFileSize: parseNumber(process.env.MAX_FILE_SIZE, 50 * 1024 * 1024), // 50MB
        allowedFileTypes: parseArray(process.env.ALLOWED_FILE_TYPES, [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]),
        projectDefaultStatus: process.env.PROJECT_DEFAULT_STATUS || 'planning',
        milestoneDefaultStatus:
          process.env.MILESTONE_DEFAULT_STATUS || 'pending',
        ticketDefaultPriority: process.env.TICKET_DEFAULT_PRIORITY || 'medium',
        invoiceDefaultStatus: process.env.INVOICE_DEFAULT_STATUS || 'draft',
        notificationTimeout: parseNumber(
          process.env.NOTIFICATION_TIMEOUT,
          5000
        ),
        notificationRetryAttempts: parseNumber(
          process.env.NOTIFICATION_RETRY_ATTEMPTS,
          5
        ),
        cacheTtl: parseNumber(process.env.CACHE_TTL, 300000), // 5 minutes
        maxCacheItems: parseNumber(process.env.MAX_CACHE_ITEMS, 1000),
      },

      monitoring: {
        logLevel:
          (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') ||
          'info',
        enableMetrics: parseBoolean(process.env.ENABLE_METRICS, true),
        enableTracing: parseBoolean(process.env.ENABLE_TRACING, false),
        healthCheckInterval: parseNumber(
          process.env.HEALTH_CHECK_INTERVAL,
          30000
        ),
      },
    };
  }

  private validateConfig(): void {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0 && this.config.app.env === 'production') {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }

    // Security validations for production
    if (this.config.app.env === 'production') {
      if (this.config.security.jwtSecret.length < 32) {
        throw new Error(
          'JWT_SECRET must be at least 32 characters in production'
        );
      }
      if (this.config.security.jwtRefreshSecret.length < 32) {
        throw new Error(
          'JWT_REFRESH_SECRET must be at least 32 characters in production'
        );
      }
      if (this.config.security.bcryptRounds < 12) {
        throw new Error('BCRYPT_ROUNDS must be at least 12 in production');
      }
    }
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  public getAll(): AppConfig {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.app.env === 'development';
  }

  public isProduction(): boolean {
    return this.config.app.env === 'production';
  }

  public isStaging(): boolean {
    return this.config.app.env === 'staging';
  }
}

// Export singleton instance
export const config = ConfigService.getInstance();

// Export types for use in other modules
// AppConfig is already exported above in the interface declaration
