import { Injectable, Logger } from '@nestjs/common';
import {
  getSiteConfig,
  getEmailConfig,
  getSecurityConfig,
  getNetworkConfig,
  getCacheConfig,
  isEnvProduction,
  BusinessConfig,
  SiteConfig,
  EmailConfig,
  SecurityConfig,
  NetworkConfig,
  CacheConfig,
} from '@jasaweb/config';

/**
 * Simple Configuration Service
 *
 * Provides access to centralized business configuration with validation
 */
@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor() {
    this.logger.log('Configuration service initialized');
  }

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
        value = (value as Record<string, unknown>)[key];
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
        environment: process.env.NODE_ENV,
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
  get isProduction(): boolean {
    return isEnvProduction();
  }
}
