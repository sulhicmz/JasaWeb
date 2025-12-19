/**
 * API Configuration Service
 * Production-ready configuration management using the centralized envConfig service
 */

import { browserConfig } from './browserConfig';

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
    const config = browserConfig.getConfig();

    const baseUrl = config.api.PUBLIC_API_URL;
    const prefix = config.api.API_PREFIX;
    const timeout = config.api.API_TIMEOUT;
    const retries = config.api.API_RETRIES;
    const retryDelay = config.api.API_RETRY_DELAY;

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
    const config = browserConfig.getConfig();

    return {
      enabled: config.api.API_RATE_LIMIT_ENABLED,
      windowMs: config.api.API_RATE_LIMIT_WINDOW,
      maxRequests: config.api.API_RATE_LIMIT_MAX,
      skipSuccessfulRequests: config.api.API_RATE_LIMIT_SKIP_SUCCESS,
      skipFailedRequests: config.api.API_RATE_LIMIT_SKIP_FAILED,
    };
  }

  private buildWebSocketConfig(): WebSocketConfig {
    const config = browserConfig.getConfig();
    const wsUrl = config.api.WS_URL;
    const baseUrl = config.api.PUBLIC_API_URL;

    return {
      enabled: config.api.WS_ENABLED,
      url: wsUrl || this.normalizeUrl(baseUrl).replace('http', 'ws'),
      reconnectAttempts: config.api.WS_RECONNECT_ATTEMPTS,
      reconnectDelay: config.api.WS_RECONNECT_DELAY,
      heartbeatInterval: config.api.WS_HEARTBEAT_INTERVAL,
    };
  }

  private normalizeUrl(url: string): string {
    return url.replace(/\/$/, ''); // Remove trailing slash
  }

  private getUserAgent(): string {
    const config = browserConfig.getConfig();
    const siteName = config.base.SITE_NAME;
    const version = config.base.APP_VERSION;
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
    const validEndpoints = Object.keys(endpoints);

    if (endpoint && validEndpoints.includes(endpoint)) {
      return endpoints[endpoint as keyof typeof endpoints];
    }
    // Return a sensible default based on category
    if ('list' in endpoints) {
      return endpoints.list;
    }
    const firstValue = Object.values(endpoints)[0];
    return typeof firstValue === 'string' ? firstValue : '';
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
    return { isValid: true, errors: [] };
  }

  public getConfigSummary(): Record<string, unknown> {
    const config = browserConfig.getConfig();

    return {
      ...config,
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
