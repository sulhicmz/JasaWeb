/**
 * API Configuration Service
 * Production-ready configuration management using the centralized envConfig service
 */

import { envConfig } from './envConfig';

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
    const env = envConfig.envConfig;

    const baseUrl = env.PUBLIC_API_URL as string;
    const prefix = env.API_PREFIX as string;
    const timeout = env.API_TIMEOUT as number;
    const retries = env.API_RETRIES as number;
    const retryDelay = env.API_RETRY_DELAY as number;

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
    const env = envConfig.envConfig;

    return {
      enabled: env.API_RATE_LIMIT_ENABLED as boolean,
      windowMs: env.API_RATE_LIMIT_WINDOW as number,
      maxRequests: env.API_RATE_LIMIT_MAX as number,
      skipSuccessfulRequests: env.API_RATE_LIMIT_SKIP_SUCCESS as boolean,
      skipFailedRequests: env.API_RATE_LIMIT_SKIP_FAILED as boolean,
    };
  }

  private buildWebSocketConfig(): WebSocketConfig {
    const env = envConfig.envConfig;
    const wsUrl = env.WS_URL as string;
    const baseUrl = env.PUBLIC_API_URL as string;

    return {
      enabled: env.WS_ENABLED as boolean,
      url: wsUrl || this.normalizeUrl(baseUrl).replace('http', 'ws'),
      reconnectAttempts: env.WS_RECONNECT_ATTEMPTS as number,
      reconnectDelay: env.WS_RECONNECT_DELAY as number,
      heartbeatInterval: env.WS_HEARTBEAT_INTERVAL as number,
    };
  }

  private normalizeUrl(url: string): string {
    return url.replace(/\/$/, ''); // Remove trailing slash
  }

  private getUserAgent(): string {
    const env = envConfig.envConfig;
    const siteName = env.SITE_NAME as string;
    const version = env.APP_VERSION as string;
    return `${siteName}-Web/${version}`;
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
      return endpoints[endpoint as keyof typeof endpoints];
    }
    // Return a sensible default based on category
    if ('list' in endpoints) {
      return endpoints.list;
    }
    return Object.values(endpoints)[0] || '';
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
    return envConfig.validateConfig();
  }

  public getConfigSummary(): Record<string, unknown> {
    const envSummary = envConfig.getConfigSummary();

    return {
      ...envSummary,
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
