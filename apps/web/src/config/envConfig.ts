/**
 * Environment Configuration Service
 * Production-ready environment configuration with build-safe defaults
 */

interface EnvironmentConfig {
  NODE_ENV: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
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
  APP_VERSION: string;
  SITE_NAME: string;
}

export class EnvConfigService {
  private static instance: EnvConfigService;
  private readonly config: EnvironmentConfig;

  private constructor() {
    this.config = this.buildConfig();
  }

  public static getInstance(): EnvConfigService {
    if (!EnvConfigService.instance) {
      EnvConfigService.instance = new EnvConfigService();
    }
    return EnvConfigService.instance;
  }

  /**
   * Build environment-aware API base URL with dynamic port handling
   */
  private getApiBaseUrl(): string {
    // Check for explicit API URL configuration first
    const explicitApiUrl = this.getEnv('PUBLIC_API_URL', '');
    if (explicitApiUrl && explicitApiUrl !== 'undefined') {
      return explicitApiUrl;
    }

    // Build dynamic URL based on environment
    const isBuildTime = this.isBuildLikeEnvironment();
    const apiHost = this.getEnv('API_HOST', 'localhost');
    const apiPort = this.getNumber('API_PORT', 3000);

    if (isBuildTime) {
      // During build time, use a placeholder or known default
      return 'http://localhost:3000';
    }

    const protocol = this.getEnv('API_PROTOCOL', 'http');
    return `${protocol}://${apiHost}:${apiPort}`;
  }

  private getWebSocketUrl(): string {
    // Check for explicit WebSocket URL
    const explicitWsUrl = this.getEnv('WS_URL', '');
    if (explicitWsUrl && explicitWsUrl !== 'undefined') {
      return explicitWsUrl;
    }

    // Derive from API URL
    const apiBaseUrl = this.getApiBaseUrl();
    return apiBaseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  }

  private buildConfig(): EnvironmentConfig {
    // Determine if we're in a build-like environment
    this.isBuildLikeEnvironment();
    const apiBaseUrl = this.getApiBaseUrl();
    const wsUrl = this.getWebSocketUrl();

    return {
      // Basic environment info
      NODE_ENV: this.getEnv('NODE_ENV', 'development'),
      MODE: this.getEnv('MODE', 'development'),
      DEV: this.isDev(),
      PROD: this.isProd(),

      // API Configuration with safe fallbacks
      PUBLIC_API_URL: apiBaseUrl,
      API_PREFIX: this.getEnv('API_PREFIX', 'api'),
      API_TIMEOUT: this.getNumber('API_TIMEOUT', 30000),
      API_RETRIES: this.getNumber('API_RETRIES', 3),
      API_RETRY_DELAY: this.getNumber('API_RETRY_DELAY', 1000),

      // WebSocket Configuration
      WS_ENABLED: this.getBoolean('WS_ENABLED', true),
      WS_URL: wsUrl,
      WS_RECONNECT_ATTEMPTS: this.getNumber('WS_RECONNECT_ATTEMPTS', 5),
      WS_RECONNECT_DELAY: this.getNumber('WS_RECONNECT_DELAY', 1000),
      WS_HEARTBEAT_INTERVAL: this.getNumber('WS_HEARTBEAT_INTERVAL', 30000),

      // Rate Limiting Configuration
      API_RATE_LIMIT_ENABLED: this.getBoolean('API_RATE_LIMIT_ENABLED', true),
      API_RATE_LIMIT_WINDOW: this.getNumber('API_RATE_LIMIT_WINDOW', 60000),
      API_RATE_LIMIT_MAX: this.getNumber('API_RATE_LIMIT_MAX', 100),
      API_RATE_LIMIT_SKIP_SUCCESS: this.getBoolean(
        'API_RATE_LIMIT_SKIP_SUCCESS',
        false
      ),
      API_RATE_LIMIT_SKIP_FAILED: this.getBoolean(
        'API_RATE_LIMIT_SKIP_FAILED',
        true
      ),

      // Application Configuration
      APP_VERSION: this.getEnv('APP_VERSION', '1.0.0'),
      SITE_NAME: this.getEnv('SITE_NAME', 'JasaWeb'),
    };
  }

  private isBuildLikeEnvironment(): boolean {
    // Multiple strategies to detect build-time environments
    return (
      import.meta.env.MODE === 'build' ||
      import.meta.env.MODE === 'development' ||
      import.meta.env.DEV ||
      // Check if we're in a Node.js environment (SSR/build time)
      typeof window === 'undefined' ||
      // Check for specific build conditions
      (typeof process === 'undefined' && typeof window === 'undefined')
    );
  }

  private isDev(): boolean {
    return (
      this.isBuildLikeEnvironment() ||
      import.meta.env.DEV ||
      import.meta.env.MODE === 'development'
    );
  }

  private isProd(): boolean {
    return (
      !this.isDev() &&
      (import.meta.env.MODE === 'production' || import.meta.env.PROD)
    );
  }

  private getEnv(key: string, fallback: string): string {
    // Security: Use safe property access to prevent object injection
    return Object.prototype.hasOwnProperty.call(import.meta.env, key)
      ? import.meta.env[key] || fallback
      : fallback;
  }

  private getNumber(key: string, fallback: number): number {
    // Security: Use safe property access to prevent object injection
    const value = Object.prototype.hasOwnProperty.call(import.meta.env, key)
      ? import.meta.env[key]
      : undefined;

    if (!value) return fallback;

    const num = parseInt(value, 10);
    return isNaN(num) ? fallback : num;
  }

  private getBoolean(key: string, fallback: boolean): boolean {
    // Security: Validate key before accessing environment
    const ALLOWED_BOOLEAN_KEYS = [
      'DEV',
      'PROD',
      'WS_ENABLED',
      'ENABLE_ANALYTICS',
      'ENABLE_SENTRY',
      'API_RATE_LIMIT_ENABLED',
      'API_RATE_LIMIT_SKIP_SUCCESS',
      'API_RATE_LIMIT_SKIP_FAILED',
    ];

    if (!ALLOWED_BOOLEAN_KEYS.includes(key)) {
      throw new Error(`Boolean key '${key}' is not allowed`);
    }

    const value = import.meta.env[key];
    if (!value) return fallback;
    return value.toLowerCase() === 'true';
  }

  private getRequiredWithFallback(
    key: string,
    fallback: string,
    useFallback: boolean
  ): string {
    // Security: Use safe property access
    const value = Object.prototype.hasOwnProperty.call(import.meta.env, key)
      ? import.meta.env[key]
      : undefined;

    if (!value) {
      if (useFallback || this.isBuildLikeEnvironment()) {
        console.warn(
          `⚠️ Environment variable ${key} not set, using fallback: ${fallback}`
        );
        return fallback;
      }

      throw new Error(
        `Required environment variable ${key} is not set in production environment. ` +
          `Please configure your deployment environment properly.`
      );
    }

    return value;
  }

  // Getters
  public get envConfig(): EnvironmentConfig {
    return this.config;
  }

  public get(key: keyof EnvironmentConfig): string | number | boolean {
    // Security: Use safe property access to prevent object injection
    return Object.prototype.hasOwnProperty.call(this.config, key)
      ? this.config[key]
      : ('' as string | number | boolean); // Default fallback
  }

  public isProduction(): boolean {
    return this.config.PROD && !this.isBuildLikeEnvironment();
  }

  public isDevelopment(): boolean {
    return this.config.DEV || this.isBuildLikeEnvironment();
  }

  public getConfigSummary(): Record<string, unknown> {
    return {
      environment: {
        nodeEnv: this.config.NODE_ENV,
        mode: this.config.MODE,
        isDev: this.config.DEV,
        isProd: this.config.PROD,
      },
      api: {
        baseUrl: this.config.PUBLIC_API_URL,
        prefix: this.config.API_PREFIX,
        timeout: this.config.API_TIMEOUT,
        retries: this.config.API_RETRIES,
      },
      websocket: {
        enabled: this.config.WS_ENABLED,
        url: this.config.WS_URL,
        reconnectAttempts: this.config.WS_RECONNECT_ATTEMPTS,
      },
      rateLimit: {
        enabled: this.config.API_RATE_LIMIT_ENABLED,
        window: this.config.API_RATE_LIMIT_WINDOW,
        maxRequests: this.config.API_RATE_LIMIT_MAX,
      },
      application: {
        version: this.config.APP_VERSION,
        siteName: this.config.SITE_NAME,
      },
    };
  }

  // Validation for runtime (not during build)
  public validateConfig(): { isValid: boolean; errors: string[] } {
    if (this.isBuildLikeEnvironment()) {
      return {
        isValid: true,
        errors: [],
      };
    }

    const errors: string[] = [];

    // Validate URLs only when not in build mode
    try {
      new URL(this.config.PUBLIC_API_URL);
    } catch {
      errors.push(`Invalid PUBLIC_API_URL: ${this.config.PUBLIC_API_URL}`);
    }

    if (this.config.WS_ENABLED) {
      try {
        // WebSocket URLs don't follow the URL constructor rules precisely, so use regex
        const wsRegex = /^(wss?):\/\/.+/;
        if (!wsRegex.test(this.config.WS_URL)) {
          errors.push(`Invalid WS_URL: ${this.config.WS_URL}`);
        }
      } catch {
        errors.push(`Invalid WS_URL: ${this.config.WS_URL}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const envConfig = EnvConfigService.getInstance();
export type { EnvironmentConfig };
