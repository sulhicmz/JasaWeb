import { Injectable, Logger } from '@nestjs/common';
import {
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
  getSiteConfig,
  getEmailConfig,
  getSecurityConfig,
  getNetworkConfig,
  getCacheConfig,
  UrlBuilder,
  isEnvProduction,
  BusinessConfig,
  SiteConfig,
  EmailConfig,
  SecurityConfig,
  NetworkConfig,
  CacheConfig,
  getApiUrl,
  getWebUrl,
} from '@jasaweb/config';
import { DEFAULT_DATABASE_CONFIG, APP_URLS } from './constants';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private readonly nodeEnv: string;
  private readonly apiBaseUrl: string;
  private readonly apiPort: number;
  private readonly corsOrigins: string[];
  private readonly webBaseUrl: string;
  private readonly frontendUrl: string;
  private readonly databaseUrl: string;
  private readonly databaseHost: string;
  private readonly databasePort: number;
  private readonly emailHost: string;
  private readonly emailPort: number;
  private readonly emailUser?: string;
  private readonly emailPass?: string;
  private readonly emailSecure: boolean;
  private readonly websocketOrigin: string;

  constructor() {
    this.logger.log('Application configuration service initialized');
    this.nodeEnv = getOptionalEnv('NODE_ENV', 'development')!;
    const isDevelopment = this.nodeEnv === 'development';

    // API Configuration
    this.apiBaseUrl = getOptionalEnv(
      'API_BASE_URL',
      this.getDefaultApiUrl(isDevelopment)
    )!;
    this.apiPort = getEnvNumber('PORT', 3000);

    // CORS Configuration - Support multiple origins
    const corsOriginEnv = getOptionalEnv('CORS_ORIGIN');
    this.corsOrigins = corsOriginEnv
      ? corsOriginEnv.split(',').map((origin: string) => origin.trim())
      : this.getDefaultCorsOrigins(isDevelopment);

    // Frontend Configuration
    this.webBaseUrl = getOptionalEnv(
      'WEB_BASE_URL',
      this.getDefaultWebUrl(isDevelopment)
    )!;
    this.frontendUrl =
      getOptionalEnv('FRONTEND_URL', this.webBaseUrl) || this.webBaseUrl;

    // Database Configuration
    this.databaseUrl = getRequiredEnv('DATABASE_URL');
    this.databaseHost = getOptionalEnv(
      'POSTGRES_HOST',
      DEFAULT_DATABASE_CONFIG.HOST
    )!;
    this.databasePort = getEnvNumber(
      'POSTGRES_PORT',
      DEFAULT_DATABASE_CONFIG.PORT
    );

    // Email Configuration
    this.emailHost = getOptionalEnv('SMTP_HOST', DEFAULT_DATABASE_CONFIG.HOST)!;
    this.emailPort = getEnvNumber('SMTP_PORT', 587);
    this.emailUser = getOptionalEnv('SMTP_USER');
    this.emailPass = getOptionalEnv('SMTP_PASS');
    this.emailSecure = getOptionalEnv('SMTP_SECURE', 'false') === 'true';

    // WebSocket Configuration
    this.websocketOrigin = this.frontendUrl;
  }

  private getDefaultApiUrl(isDevelopment: boolean): string {
    if (isDevelopment) {
      return APP_URLS.API_URL;
    }
    return getApiUrl();
  }

  private getDefaultWebUrl(isDevelopment: boolean): string {
    if (isDevelopment) {
      return APP_URLS.FRONTEND_URL;
    }
    return getWebUrl();
  }

  private getDefaultCorsOrigins(_isDevelopment: boolean): string[] {
    return UrlBuilder.getAllowedOrigins();
  }

  // Public getters
  get getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  get getApiPort(): number {
    return this.apiPort;
  }

  get getNodeEnv(): string {
    return this.nodeEnv;
  }

  get getCorsOrigins(): string[] {
    return this.corsOrigins;
  }

  get getWebBaseUrl(): string {
    return this.webBaseUrl;
  }

  get getFrontendUrl(): string {
    return this.frontendUrl;
  }

  get getDatabaseUrl(): string {
    return this.databaseUrl;
  }

  get getDatabaseHost(): string {
    return this.databaseHost;
  }

  get getDatabasePort(): number {
    return this.databasePort;
  }

  get getEmailHost(): string {
    return this.emailHost;
  }

  get getEmailPort(): number {
    return this.emailPort;
  }

  get getEmailUser(): string | undefined {
    return this.emailUser;
  }

  get getEmailPass(): string | undefined {
    return this.emailPass;
  }

  get getEmailSecure(): boolean {
    return this.emailSecure;
  }

  get getWebsocketOrigin(): string {
    return this.websocketOrigin;
  }

  // Utility methods
  isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  // Method to get full URL for API endpoints
  getApiUrl(path: string = ''): string {
    const baseUrl = this.apiBaseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  // Method to get full URL for frontend routes
  getWebUrl(path: string = ''): string {
    const baseUrl = this.webBaseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  // Method to validate if origin is allowed
  isOriginAllowed(origin: string): boolean {
    return this.corsOrigins.includes(origin);
  }

  // Business Configuration Methods (from unified config)

  /**
   * Get site configuration
   */
  getSiteConfig(): SiteConfig {
    return getSiteConfig();
  }

  /**
   * Get email configuration
   */
  getEmailConfig(): EmailConfig {
    return getEmailConfig();
  }

  /**
   * Get security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return getSecurityConfig();
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): NetworkConfig {
    return getNetworkConfig();
  }

  /**
   * Get cache configuration
   */
  getCacheConfig(): CacheConfig {
    return getCacheConfig();
  }

  /**
   * Get full configuration
   */
  getAllConfig(): BusinessConfig {
    return {
      site: this.getSiteConfig(),
      emails: this.getEmailConfig(),
      security: this.getSecurityConfig(),
      network: this.getNetworkConfig(),
      cache: this.getCacheConfig(),
    };
  }

  /**
   * Get configuration value by dot notation path
   */
  get<T = unknown>(path: string): T {
    const config = this.getAllConfig();
    const keys = path.split('.');
    let value: unknown = config;

    // Define allowed keys for security
    const allowedKeys = new Set([
      'site',
      'emails',
      'security',
      'network',
      'cache',
      'name',
      'description',
      'contact',
      'urls',
      'api',
      'production',
      'maxFileUploadSize',
      'maxLoginAttempts',
      'bcryptRounds',
      'rateLimit',
      'windowMs',
      'maxRequests',
      'defaultTtl',
      'dashboardTtl',
    ]);

    for (const key of keys) {
      if (!allowedKeys.has(key)) {
        throw new Error(`Configuration key '${key}' is not allowed`);
      }
      if (
        value &&
        typeof value === 'object' &&
        value !== null &&
        Object.prototype.hasOwnProperty.call(value, key)
      ) {
        // Safely access nested property with safe key access
        const recordValue = value as Record<string, unknown>;
        const safeKeys = Object.freeze([
          'database',
          'redis',
          'storage',
          'auth',
          'security',
          'application',
          'aws',
          's3',
          'minio',
        ]);

        if (!safeKeys.includes(key as string)) {
          throw new Error(`Unauthorized configuration key access: ${key}`);
        }

        // Use safe property access to prevent object injection
        if (Object.prototype.hasOwnProperty.call(recordValue, key)) {
          // Additional validation to prevent prototype pollution
          const forbiddenKeys = new Set([
            '__proto__',
            'constructor',
            'prototype',
          ]);
          if (forbiddenKeys.has(key)) {
            throw new Error(`Forbidden configuration key access: ${key}`);
          }
          // Secure access with key validation to prevent Object Injection Sink
          const safeKey = String(key);
          value = Reflect.get(recordValue, safeKey) as unknown;
        } else {
          throw new Error(`Configuration property '${key}' does not exist`);
        }
      } else {
        throw new Error(`Configuration path '${path}' not found`);
      }
    }

    return value as T;
  }

  /**
   * Check if service is healthy (config is loaded and valid)
   */
  isHealthy(): boolean {
    try {
      // Basic validation
      const siteConfig = this.getSiteConfig();
      const emailConfig = this.getEmailConfig();

      return !!(
        siteConfig.name &&
        siteConfig.description &&
        emailConfig.contact
      );
    } catch (error) {
      this.logger.error('Configuration health check failed:', error);
      return false;
    }
  }

  /**
   * Get configuration summary for monitoring
   */
  getConfigSummary(): Record<string, unknown> {
    return {
      site: {
        name: this.get('site.name'),
        environment: this.nodeEnv,
        urls: {
          api: this.get('site.urls.api'),
          production: this.get('site.urls.production'),
        },
      },
      security: {
        maxFileUploadSize: this.get('security.maxFileUploadSize'),
        maxLoginAttempts: this.get('security.maxLoginAttempts'),
        bcryptRounds: this.get('security.bcryptRounds'),
      },
      network: {
        rateLimit: {
          windowMs: this.get('network.rateLimit.windowMs'),
          maxRequests: this.get('network.rateLimit.maxRequests'),
        },
      },
      cache: {
        defaultTtl: this.get('cache.defaultTtl'),
        dashboardTtl: this.get('cache.dashboardTtl'),
      },
    };
  }

  /**
   * Get production status
   */
  get isProductionMode(): boolean {
    return isEnvProduction();
  }

  // Debug method to log configuration (without secrets)
  logConfiguration(): void {
    const config = {
      environment: this.nodeEnv,
      apiBaseUrl: this.apiBaseUrl,
      apiPort: this.apiPort,
      webBaseUrl: this.webBaseUrl,
      frontendUrl: this.frontendUrl,
      databaseHost: `${this.databaseHost}:${this.databasePort}`,
      emailConfig: `${this.emailHost}:${this.emailPort} (secure: ${this.emailSecure})`,
      websocketOrigin: this.websocketOrigin,
      corsOrigins: this.corsOrigins,
    };

    this.logger.debug('Application configuration loaded', config);
  }
}
