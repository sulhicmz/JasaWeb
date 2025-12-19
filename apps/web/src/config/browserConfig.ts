/**
 * Browser-Safe Configuration for JasaWeb Web App
 *
 * This file provides browser-safe configuration access without pulling in
 * any NestJS server-side dependencies or Node.js modules.
 */

// Basic environment detection
export const isBrowser = typeof window !== 'undefined';
export const isServer =
  typeof process !== 'undefined' && process.versions?.node;

// Environment type for browser
export type EnvironmentType = 'development' | 'production' | 'test';

// Interface for browser-safe configuration
export interface BrowserConfig {
  base: {
    NODE_ENV: EnvironmentType;
    SITE_NAME: string;
    SITE_DESCRIPTION: string;
    SITE_AUTHOR: string;
    SITE_URL: string;
    APP_VERSION: string;
  };
  api: {
    PUBLIC_API_URL: string;
    API_PREFIX: string;
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
}

/**
 * Safe environment variable getter for browser
 */
function getEnv(key: string, fallback: string): string {
  // Build-time environment variables from Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || fallback;
  }

  // Runtime fallback (should not happen in production)
  return fallback;
}

/**
 * Get environment variable as number
 */
function getEnvNumber(key: string, fallback: number): number {
  const value = getEnv(key, String(fallback));
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Get environment variable as boolean
 */
function getEnvBoolean(key: string, fallback: boolean): boolean {
  const value = getEnv(key, String(fallback));
  return value.toLowerCase() === 'true';
}

/**
 * Get environment type
 */
function getEnvironmentType(): EnvironmentType {
  const nodeEnv = getEnv('NODE_ENV', 'development');
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'test') return 'test';
  return 'development';
}

/**
 * Build browser-safe configuration
 */
function buildConfig(): BrowserConfig {
  const nodeEnv = getEnvironmentType();
  const isDev = nodeEnv === 'development';

  // Dynamic API URL based on environment
  const getApiUrl = (): string => {
    const envUrl = getEnv('VITE_PUBLIC_API_URL', '');
    if (envUrl) return envUrl;

    // Build-time detection for proper URLs
    if (isDev) {
      return getEnv('VITE_DEV_API_URL', 'http://localhost:3000');
    }

    // Production should have the URL set
    return getEnv('VITE_PUBLIC_API_URL', 'https://api.jasaweb.com');
  };

  // Dynamic WebSocket URL
  const getWsUrl = (): string => {
    if (!getEnvBoolean('VITE_WS_ENABLED', true)) return '';

    const envWsUrl = getEnv('VITE_WS_URL', '');
    if (envWsUrl) return envWsUrl;

    // Convert HTTP URL to WS URL
    const apiUrl = getApiUrl();
    return apiUrl.replace(/^http/, 'ws');
  };

  return {
    base: {
      NODE_ENV: nodeEnv,
      SITE_NAME: getEnv('VITE_SITE_NAME', 'JasaWeb'),
      SITE_DESCRIPTION: getEnv(
        'VITE_SITE_DESCRIPTION',
        'Professional Web Development Services'
      ),
      SITE_AUTHOR: getEnv('VITE_SITE_AUTHOR', 'JasaWeb Team'),
      SITE_URL: getEnv(
        'VITE_SITE_URL',
        isDev ? 'http://localhost:4321' : 'https://jasaweb.com'
      ),
      APP_VERSION: getEnv('VITE_APP_VERSION', '1.0.0'),
    },

    api: {
      PUBLIC_API_URL: getApiUrl(),
      API_PREFIX: getEnv('VITE_API_PREFIX', 'api'),
      API_TIMEOUT: getEnvNumber('VITE_API_TIMEOUT', 30000),
      API_RETRIES: getEnvNumber('VITE_API_RETRIES', 3),
      API_RETRY_DELAY: getEnvNumber('VITE_API_RETRY_DELAY', 1000),

      WS_ENABLED: getEnvBoolean('VITE_WS_ENABLED', true),
      WS_URL: getWsUrl(),
      WS_RECONNECT_ATTEMPTS: getEnvNumber('VITE_WS_RECONNECT_ATTEMPTS', 5),
      WS_RECONNECT_DELAY: getEnvNumber('VITE_WS_RECONNECT_DELAY', 1000),
      WS_HEARTBEAT_INTERVAL: getEnvNumber('VITE_WS_HEARTBEAT_INTERVAL', 30000),

      API_RATE_LIMIT_ENABLED: getEnvBoolean(
        'VITE_API_RATE_LIMIT_ENABLED',
        true
      ),
      API_RATE_LIMIT_WINDOW: getEnvNumber('VITE_API_RATE_LIMIT_WINDOW', 60000),
      API_RATE_LIMIT_MAX: getEnvNumber('VITE_API_RATE_LIMIT_MAX', 100),
      API_RATE_LIMIT_SKIP_SUCCESS: getEnvBoolean(
        'VITE_API_RATE_LIMIT_SKIP_SUCCESS',
        false
      ),
      API_RATE_LIMIT_SKIP_FAILED: getEnvBoolean(
        'VITE_API_RATE_LIMIT_SKIP_FAILED',
        true
      ),
    },

    analytics: {
      GOOGLE_ANALYTICS_ID: getEnv('VITE_PUBLIC_GA_ID', ''),
      GOOGLE_TAG_MANAGER_ID: getEnv('VITE_PUBLIC_GTM_ID', ''),
      PUBLIC_GA_ID: getEnv('VITE_PUBLIC_GA_ID', ''),
      PUBLIC_GTM_ID: getEnv('VITE_PUBLIC_GTM_ID', ''),
    },

    seo: {
      META_TITLE: getEnv(
        'VITE_META_TITLE',
        'JasaWeb - Professional Web Development Services'
      ),
      META_DESCRIPTION: getEnv(
        'VITE_META_DESCRIPTION',
        'Professional web development services for schools, news portals, and company profiles'
      ),
      META_KEYWORDS: getEnv(
        'VITE_META_KEYWORDS',
        'web development, website design, school website, news portal, company profile'
      ),
      OG_IMAGE: getEnv('VITE_OG_IMAGE', '/images/og-image.jpg'),
    },

    social: {
      FACEBOOK_URL: getEnv('VITE_FACEBOOK_URL', ''),
      TWITTER_URL: getEnv('VITE_TWITTER_URL', ''),
      INSTAGRAM_URL: getEnv('VITE_INSTAGRAM_URL', ''),
      LINKEDIN_URL: getEnv('VITE_LINKEDIN_URL', ''),
    },

    featureFlags: {
      ENABLE_AUTOMATION: getEnvBoolean('VITE_ENABLE_AUTOMATION', true),
      ENABLE_SELF_HEALING: getEnvBoolean('VITE_ENABLE_SELF_HEALING', true),
      ENABLE_AUTO_MERGE: getEnvBoolean('VITE_ENABLE_AUTO_MERGE', true),
      ENABLE_BLOG: getEnvBoolean('VITE_ENABLE_BLOG', true),
      ENABLE_PORTFOLIO: getEnvBoolean('VITE_ENABLE_PORTFOLIO', true),
      ENABLE_CONTACT_FORM: getEnvBoolean('VITE_ENABLE_CONTACT_FORM', true),
    },
  };
}

/**
 * Browser-safe configuration service
 */
export class BrowserConfigService {
  private static instance: BrowserConfigService;
  private readonly config: BrowserConfig;
  private readonly environment: EnvironmentType;

  private constructor() {
    // BrowserConfigService primarily intended for browser use
    // Server-side initialization with default config for build process
    this.config = buildConfig();
    this.environment = this.config.base.NODE_ENV;
  }

  public static getInstance(): BrowserConfigService {
    if (!BrowserConfigService.instance) {
      BrowserConfigService.instance = new BrowserConfigService();
    }
    return BrowserConfigService.instance;
  }

  /**
   * Get complete configuration
   */
  public getConfig(): BrowserConfig {
    return this.config;
  }

  /**
   * Get configuration section by key
   */
  public get<K extends keyof BrowserConfig>(section: K): BrowserConfig[K] {
    return this.config[section];
  }

  /**
   * Environment detection
   */
  public isDevelopment(): boolean {
    return this.environment === 'development';
  }

  public isProduction(): boolean {
    return this.environment === 'production';
  }

  public isTest(): boolean {
    return this.environment === 'test';
  }

  public getEnvironment(): EnvironmentType {
    return this.environment;
  }

  // Convenience methods

  /**
   * Get API URL with optional path
   */
  public getApiUrl(path: string = ''): string {
    const baseUrl = this.config.api.PUBLIC_API_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Get site URL with optional path
   */
  public getSiteUrl(path: string = ''): string {
    const baseUrl = this.config.base.SITE_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * WebSocket configuration
   */
  public isWebSocketEnabled(): boolean {
    return this.config.api.WS_ENABLED && !!this.config.api.WS_URL;
  }

  public getWebSocketConfig() {
    return {
      enabled: this.config.api.WS_ENABLED,
      url: this.config.api.WS_URL,
      reconnectAttempts: this.config.api.WS_RECONNECT_ATTEMPTS,
      reconnectDelay: this.config.api.WS_RECONNECT_DELAY,
      heartbeatInterval: this.config.api.WS_HEARTBEAT_INTERVAL,
    };
  }

  /**
   * API timeout and retry configuration
   */
  public getTimeoutConfig() {
    return {
      timeout: this.config.api.API_TIMEOUT,
      retries: this.config.api.API_RETRIES,
      retryDelay: this.config.api.API_RETRY_DELAY,
    };
  }

  /**
   * Rate limiting configuration
   */
  public getRateLimitConfig() {
    return {
      enabled: this.config.api.API_RATE_LIMIT_ENABLED,
      window: this.config.api.API_RATE_LIMIT_WINDOW,
      max: this.config.api.API_RATE_LIMIT_MAX,
      skipSuccess: this.config.api.API_RATE_LIMIT_SKIP_SUCCESS,
      skipFailed: this.config.api.API_RATE_LIMIT_SKIP_FAILED,
    };
  }

  /**
   * App metadata for headers and monitoring
   */
  public getAppMeta() {
    return {
      name: this.config.base.SITE_NAME,
      version: this.config.base.APP_VERSION,
      environment: this.environment,
    };
  }

  /**
   * Check if feature flag is enabled
   */
  public isFeatureEnabled(flag: keyof BrowserConfig['featureFlags']): boolean {
    return this.config.featureFlags[flag];
  }

  /**
   * Get analytics IDs for tracking
   */
  public getAnalyticsConfig() {
    return {
      gaId: this.config.analytics.PUBLIC_GA_ID,
      gtmId: this.config.analytics.PUBLIC_GTM_ID,
      enabled: !!(
        this.config.analytics.PUBLIC_GA_ID ||
        this.config.analytics.PUBLIC_GTM_ID
      ),
    };
  }

  /**
   * Get SEO metadata
   */
  public getSeoConfig() {
    return this.config.seo;
  }

  /**
   * Get social media links
   */
  public getSocialConfig() {
    return this.config.social;
  }
}

// Export singleton instance
export const browserConfig = BrowserConfigService.getInstance();

// Default export for convenience
export default browserConfig;
