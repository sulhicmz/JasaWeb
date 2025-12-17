/**
 * API Configuration Service
 * Centralized configuration management for API client and service configuration
 */

interface ApiEndpoints {
  auth: {
    login: string;
    register: string;
    refresh: string;
    logout: string;
    profile: string;
  };
  projects: {
    list: string;
    create: string;
    get: string;
    update: string;
    delete: string;
  };
  dashboard: {
    stats: string;
    charts: string;
    notifications: string;
  };
  files: {
    upload: string;
    download: string;
    list: string;
    delete: string;
  };
  invoices: {
    list: string;
    create: string;
    get: string;
    update: string;
    delete: string;
  };
  tickets: {
    list: string;
    create: string;
    get: string;
    update: string;
    delete: string;
  };
}

interface ApiConfig {
  baseUrl: string;
  prefix: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  endpoints: ApiEndpoints;
  headers: Record<string, string>;
}

interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

interface WebSocketConfig {
  enabled: boolean;
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
}

export class ApiConfigService {
  private static instance: ApiConfigService;
  private readonly config: ApiConfig;
  private readonly rateLimit: RateLimitConfig;
  private readonly websocket: WebSocketConfig;

  private constructor() {
    this.config = this.buildApiConfig();
    this.rateLimit = this.buildRateLimitConfig();
    this.websocket = this.buildWebSocketConfig();
  }

  public static getInstance(): ApiConfigService {
    if (!ApiConfigService.instance) {
      ApiConfigService.instance = new ApiConfigService();
    }
    return ApiConfigService.instance;
  }

  private buildApiConfig(): ApiConfig {
    const baseUrl = this.getRequiredEnv(
      'PUBLIC_API_URL',
      'http://localhost:3000'
    );
    const prefix = this.getRequiredEnv('API_PREFIX', 'api');
    const timeout = this.getEnvNumber('API_TIMEOUT', 30000);
    const retries = this.getEnvNumber('API_RETRIES', 3);
    const retryDelay = this.getEnvNumber('API_RETRY_DELAY', 1000);

    // Validate configuration
    this.validateApiConfig(baseUrl, timeout, retries, retryDelay);

    return {
      baseUrl: this.normalizeUrl(baseUrl),
      prefix,
      timeout,
      retries,
      retryDelay,
      endpoints: this.buildEndpoints(baseUrl, prefix),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': this.getUserAgent(),
      },
    };
  }

  private buildEndpoints(baseUrl: string, prefix: string): ApiEndpoints {
    const base = `${this.normalizeUrl(baseUrl)}/${prefix}`;

    return {
      auth: {
        login: `${base}/auth/login`,
        register: `${base}/auth/register`,
        refresh: `${base}/auth/refresh`,
        logout: `${base}/auth/logout`,
        profile: `${base}/auth/profile`,
      },
      projects: {
        list: `${base}/projects`,
        create: `${base}/projects`,
        get: `${base}/projects`,
        update: `${base}/projects`,
        delete: `${base}/projects`,
      },
      dashboard: {
        stats: `${base}/dashboard/stats`,
        charts: `${base}/dashboard/charts`,
        notifications: `${base}/dashboard/notifications`,
      },
      files: {
        upload: `${base}/files/upload`,
        download: `${base}/files/download`,
        list: `${base}/files`,
        delete: `${base}/files`,
      },
      invoices: {
        list: `${base}/invoices`,
        create: `${base}/invoices`,
        get: `${base}/invoices`,
        update: `${base}/invoices`,
        delete: `${base}/invoices`,
      },
      tickets: {
        list: `${base}/tickets`,
        create: `${base}/tickets`,
        get: `${base}/tickets`,
        update: `${base}/tickets`,
        delete: `${base}/tickets`,
      },
    };
  }

  private buildRateLimitConfig(): RateLimitConfig {
    return {
      enabled: this.getEnvBoolean('API_RATE_LIMIT_ENABLED', true),
      windowMs: this.getEnvNumber('API_RATE_LIMIT_WINDOW', 60000),
      maxRequests: this.getEnvNumber('API_RATE_LIMIT_MAX', 100),
      skipSuccessfulRequests: this.getEnvBoolean(
        'API_RATE_LIMIT_SKIP_SUCCESS',
        false
      ),
      skipFailedRequests: this.getEnvBoolean(
        'API_RATE_LIMIT_SKIP_FAILED',
        true
      ),
    };
  }

  private buildWebSocketConfig(): WebSocketConfig {
    const wsUrl = this.getEnvString('WS_URL', '').replace('http', 'ws');

    return {
      enabled: this.getEnvBoolean('WS_ENABLED', true),
      url:
        wsUrl ||
        this.normalizeUrl(
          this.getRequiredEnv('PUBLIC_API_URL', 'http://localhost:3000')
        ).replace('http', 'ws'),
      reconnectAttempts: this.getEnvNumber('WS_RECONNECT_ATTEMPTS', 5),
      reconnectDelay: this.getEnvNumber('WS_RECONNECT_DELAY', 1000),
      heartbeatInterval: this.getEnvNumber('WS_HEARTBEAT_INTERVAL', 30000),
    };
  }

  private validateApiConfig(
    baseUrl: string,
    timeout: number,
    retries: number,
    retryDelay: number
  ): void {
    // Validate URL format
    try {
      new URL(baseUrl);
    } catch {
      throw new Error(`Invalid API URL: ${baseUrl}`);
    }

    // Validate timeout range (1s to 5 minutes)
    if (timeout < 1000 || timeout > 300000) {
      throw new Error(
        `API_TIMEOUT must be between 1000ms and 300000ms, got ${timeout}`
      );
    }

    // Validate retries range (0 to 10)
    if (retries < 0 || retries > 10) {
      throw new Error(`API_RETRIES must be between 0 and 10, got ${retries}`);
    }

    // Validate retry delay range (100ms to 10s)
    if (retryDelay < 100 || retryDelay > 10000) {
      throw new Error(
        `API_RETRY_DELAY must be between 100ms and 10000ms, got ${retryDelay}`
      );
    }
  }

  private normalizeUrl(url: string): string {
    return url.replace(/\/$/, ''); // Remove trailing slash
  }

  private getUserAgent(): string {
    const siteName = this.getEnvString('SITE_NAME', 'JasaWeb');
    const version = this.getEnvString('APP_VERSION', '1.0.0');
    return `${siteName}-Web/${version}`;
  }

  // Environment variable helpers
  private getRequiredEnv(key: string, fallback: string): string {
    const value = import.meta.env[key];
    if (!value) {
      if (import.meta.env.DEV || import.meta.env.MODE === 'build') {
        console.warn(
          `⚠️ Environment variable ${key} not set, using fallback: ${fallback}`
        );
        return fallback;
      }
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private getEnvString(key: string, fallback: string): string {
    return import.meta.env[key] || fallback;
  }

  private getEnvNumber(key: string, fallback: number): number {
    const value = import.meta.env[key];
    if (!value) return fallback;

    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(
        `Environment variable ${key} must be a valid number, got "${value}"`
      );
    }
    return num;
  }

  private getEnvBoolean(key: string, fallback: boolean): boolean {
    const value = import.meta.env[key];
    if (!value) return fallback;

    return value.toLowerCase() === 'true';
  }

  // Public getters
  public get apiConfig(): ApiConfig {
    return this.config;
  }

  public get rateLimitConfig(): RateLimitConfig {
    return this.rateLimit;
  }

  public get webSocketConfig(): WebSocketConfig {
    return this.websocket;
  }

  // Utility methods
  public getEndpoint(category: keyof ApiEndpoints, endpoint?: string): string {
    const endpoints = this.config.endpoints[category];
    if (endpoint && endpoint in endpoints) {
      return (endpoints as any)[endpoint];
    }
    // Return a sensible default based on category
    if ('list' in endpoints) {
      return (endpoints as any).list;
    }
    return Object.values(endpoints)[0];
  }

  public buildUrl(path: string): string {
    return `${this.config.baseUrl}/${this.config.prefix}${path.startsWith('/') ? path : `/${path}`}`;
  }

  public getAuthHeader(token?: string): Record<string, string> {
    const headers = { ...this.config.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Validation and debugging
  public validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      new URL(this.config.baseUrl);
    } catch {
      errors.push(`Invalid API baseUrl: ${this.config.baseUrl}`);
    }

    try {
      new URL(this.websocket.url);
    } catch {
      errors.push(`Invalid WebSocket URL: ${this.websocket.url}`);
    }

    if (this.config.timeout < 1000) {
      errors.push('API timeout must be at least 1000ms');
    }

    if (this.config.retries < 0 || this.config.retries > 10) {
      errors.push('API retries must be between 0 and 10');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public getConfigSummary(): Record<string, any> {
    return {
      api: {
        baseUrl: this.obscureUrl(this.config.baseUrl),
        prefix: this.config.prefix,
        timeout: this.config.timeout,
        retries: this.config.retries,
      },
      rateLimit: this.rateLimit,
      websocket: {
        enabled: this.websocket.enabled,
        url: this.obscureUrl(this.websocket.url),
        reconnectAttempts: this.websocket.reconnectAttempts,
      },
      environment: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
    };
  }

  private obscureUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}`;
    } catch {
      return '[Invalid URL]';
    }
  }
}

// Export singleton instance and types
export const apiConfig = ApiConfigService.getInstance();
export type { ApiConfig, ApiEndpoints, RateLimitConfig, WebSocketConfig };
