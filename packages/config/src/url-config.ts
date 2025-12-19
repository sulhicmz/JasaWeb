/**
 * Dynamic URL Configuration Service
 *
 * This module centralizes all URL configuration and eliminates hardcoded production URLs.
 * It supports multi-tenant deployments and environment-specific configurations.
 */

export interface UrlConfig {
  api: {
    development: string;
    production: string;
    staging: string;
    test: string;
  };
  web: {
    development: string;
    production: string;
    staging: string;
    test: string;
  };
  cdn: {
    development: string;
    production: string;
    staging: string;
  };
  websocket: {
    development: string;
    production: string;
    staging: string;
  };
}

class UrlConfigurationService {
  private config: UrlConfig;

  constructor() {
    this.config = this.buildConfig();
  }

  private rebuildConfig(): void {
    this.config = this.buildConfig();
  }

  private buildConfig(): UrlConfig {
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Production URLs configurable via environment variables
    const prodApiUrl =
      process.env.PRODUCTION_API_URL &&
      process.env.PRODUCTION_API_URL.trim() !== ''
        ? process.env.PRODUCTION_API_URL
        : 'https://api.jasaweb.com';
    const prodWebUrl =
      process.env.PRODUCTION_WEB_URL &&
      process.env.PRODUCTION_WEB_URL.trim() !== ''
        ? process.env.PRODUCTION_WEB_URL
        : 'https://jasaweb.com';
    const prodCdnUrl =
      process.env.PRODUCTION_CDN_URL &&
      process.env.PRODUCTION_CDN_URL.trim() !== ''
        ? process.env.PRODUCTION_CDN_URL
        : 'https://cdn.jasaweb.com';

    // Staging URLs configurable via environment variables
    const stagingApiUrl =
      process.env.STAGING_API_URL || 'https://api-staging.jasaweb.com';
    const stagingWebUrl =
      process.env.STAGING_WEB_URL || 'https://staging.jasaweb.com';
    const stagingCdnUrl =
      process.env.STAGING_CDN_URL || 'https://cdn-staging.jasaweb.com';

    // Development URLs
    const devApiPort = process.env.DEV_API_PORT || '3000';
    const devWebPort = process.env.DEV_WEB_PORT || '4321';
    const devApiHost = process.env.DEV_API_HOST || 'localhost';
    const devWebHost = process.env.DEV_WEB_HOST || 'localhost';

    const devApiUrl = `http://${devApiHost}:${devApiPort}`;
    const devWebUrl = `http://${devWebHost}:${devWebPort}`;

    // Test URLs
    const testApiUrl = process.env.TEST_API_URL || 'http://localhost:3001';
    const testWebUrl = process.env.TEST_WEB_URL || 'http://localhost:4322';

    return {
      api: {
        development: devApiUrl,
        production: prodApiUrl,
        staging: stagingApiUrl,
        test: testApiUrl,
      },
      web: {
        development: devWebUrl,
        production: prodWebUrl,
        staging: stagingWebUrl,
        test: testWebUrl,
      },
      cdn: {
        development: '', // No CDN in development
        production: prodCdnUrl,
        staging: stagingCdnUrl,
      },
      websocket: {
        development: `ws://${devApiHost}:${devApiPort}`,
        production: prodApiUrl.replace('https', 'wss'),
        staging: stagingApiUrl.replace('https', 'wss'),
      },
    };
  }

  /**
   * Get current environment URL for a specific service
   */
  public getApiUrl(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Rebuild configuration to capture environment changes
    this.rebuildConfig();

    switch (nodeEnv) {
      case 'production':
        return this.config.api.production;
      case 'staging':
        return this.config.api.staging;
      case 'test':
        return this.config.api.test;
      default:
        return this.config.api.development;
    }
  }

  public getWebUrl(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Rebuild configuration to capture environment changes
    this.rebuildConfig();

    switch (nodeEnv) {
      case 'production':
        return this.config.web.production;
      case 'staging':
        return this.config.web.staging;
      case 'test':
        return this.config.web.test;
      default:
        return this.config.web.development;
    }
  }

  public getCdnUrl(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Rebuild configuration to capture environment changes
    this.rebuildConfig();

    switch (nodeEnv) {
      case 'production':
        return this.config.cdn.production;
      case 'staging':
        return this.config.cdn.staging;
      default:
        return this.config.cdn.development;
    }
  }

  public getWebSocketUrl(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Rebuild configuration to capture environment changes
    this.rebuildConfig();

    switch (nodeEnv) {
      case 'production':
        return this.config.websocket.production;
      case 'staging':
        return this.config.websocket.staging;
      default:
        return this.config.websocket.development;
    }
  }

  /**
   * Get all configuration for debugging
   */
  public getAllConfig(): UrlConfig {
    this.rebuildConfig();
    return { ...this.config };
  }

  /**
   * Generate CORS origins based on current environment
   */
  public getAllowedOrigins(): string[] {
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Rebuild configuration to capture environment changes
    this.rebuildConfig();

    const origins: string[] = [];

    // Add development origins
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      const devApiHost = process.env.DEV_API_HOST || 'localhost';
      const devWebHost = process.env.DEV_WEB_HOST || 'localhost';
      const devApiPort = process.env.DEV_API_PORT || '3000';
      const devWebPort = process.env.DEV_WEB_PORT || '4321';

      origins.push(
        `http://${devWebHost}:${devWebPort}`,
        `http://${devApiHost}:${devApiPort}`,
        `http://127.0.0.1:${devWebPort}`,
        `http://127.0.0.1:${devApiPort}`
      );
    }

    // Add staging origins
    if (
      process.env.NODE_ENV === 'staging' ||
      process.env.INCLUDE_STAGING_ORIGINS === 'true'
    ) {
      origins.push(
        this.config.web.staging,
        this.config.api.staging,
        this.config.cdn.staging
      );
    }

    // Add production origins
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.INCLUDE_PRODUCTION_ORIGINS === 'true'
    ) {
      origins.push(
        this.config.web.production,
        `https://www.${this.config.web.production.replace('https://', '')}`,
        this.config.api.production,
        this.config.cdn.production
      );
    }

    // Allow additional origins from environment
    if (process.env.ADDITIONAL_CORS_ORIGINS) {
      origins.push(
        ...process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(
          (origin: string) => origin.trim()
        )
      );
    }

    return [...new Set(origins)]; // Remove duplicates
  }

  /**
   * Validate URL configuration
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Rebuild configuration to capture environment changes
    this.rebuildConfig();

    const nodeEnv = process.env.NODE_ENV || 'development';
    let api: string, web: string;

    // Check required URLs and get current values
    switch (nodeEnv) {
      case 'production':
        api = this.config.api.production;
        web = this.config.web.production;
        break;
      case 'staging':
        api = this.config.api.staging;
        web = this.config.web.staging;
        break;
      case 'test':
        api = this.config.api.test;
        web = this.config.web.test;
        break;
      default:
        api = this.config.api.development;
        web = this.config.web.development;
    }

    if (!api || api.trim() === '') errors.push('API URL is required');
    if (!web || web.trim() === '') errors.push('Web URL is required');

    // Check SSL in production
    if (nodeEnv === 'production') {
      if (api && !api.startsWith('https://'))
        errors.push('API URL must use HTTPS in production');
      if (web && !web.startsWith('https://'))
        errors.push('Web URL must use HTTPS in production');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const urlConfig = new UrlConfigurationService();

// Export shorthand functions
export const getApiUrl = () => urlConfig.getApiUrl();
export const getWebUrl = () => urlConfig.getWebUrl();
export const getCdnUrl = () => urlConfig.getCdnUrl();
export const getWebSocketUrl = () => urlConfig.getWebSocketUrl();
export const getAllowedOrigins = () => urlConfig.getAllowedOrigins();

export default urlConfig;
