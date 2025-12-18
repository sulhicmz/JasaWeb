/**
 * Environment Configuration Service
 * Production-ready environment configuration with build-safe defaults
 */

import { jasaWebConfig } from '@jasaweb/config';

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
  private readonly unifiedConfig = jasaWebConfig.getConfig();

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
    return this.unifiedConfig.api.PUBLIC_API_URL;
  }

  /**
   * Build environment-aware WebSocket URL
   */
  private getWebSocketUrl(): string {
    if (!this.unifiedConfig.api.WS_ENABLED) {
      return '';
    }
    return this.unifiedConfig.api.WS_URL;
  }

  /**
   * Get environment variable with fallback (safe for build time)
   */
  private getEnv(key: string, fallback: string): string {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key] || fallback;
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || fallback;
    }
    return fallback;
  }

  /**
   * Get environment variable as number with fallback
   */
  private getEnvNumber(key: string, fallback: number): number {
    const value = this.getEnv(key, String(fallback));
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Get environment variable as boolean with fallback
   */
  private getEnvBoolean(key: string, fallback: boolean): boolean {
    const value = this.getEnv(key, String(fallback));
    return value.toLowerCase() === 'true';
  }

  /**
   * Build complete configuration using unified config
   */
  private buildConfig(): EnvironmentConfig {
    const config = this.unifiedConfig;

    return {
      NODE_ENV: config.base.NODE_ENV,
      MODE: config.base.NODE_ENV,
      DEV: config.base.NODE_ENV === 'development',
      PROD: config.base.NODE_ENV === 'production',
      PUBLIC_API_URL: config.api.PUBLIC_API_URL,
      API_PREFIX: config.api.API_PREFIX,
      API_TIMEOUT: config.api.API_TIMEOUT,
      API_RETRIES: config.api.API_RETRIES,
      API_RETRY_DELAY: config.api.API_RETRY_DELAY,
      WS_ENABLED: config.api.WS_ENABLED,
      WS_URL: config.api.WS_URL,
      WS_RECONNECT_ATTEMPTS: config.api.WS_RECONNECT_ATTEMPTS,
      WS_RECONNECT_DELAY: config.api.WS_RECONNECT_DELAY,
      WS_HEARTBEAT_INTERVAL: config.api.WS_HEARTBEAT_INTERVAL,
      API_RATE_LIMIT_ENABLED: config.api.API_RATE_LIMIT_ENABLED,
      API_RATE_LIMIT_WINDOW: config.api.API_RATE_LIMIT_WINDOW,
      API_RATE_LIMIT_MAX: config.api.API_RATE_LIMIT_MAX,
      API_RATE_LIMIT_SKIP_SUCCESS: config.api.API_RATE_LIMIT_SKIP_SUCCESS,
      API_RATE_LIMIT_SKIP_FAILED: config.api.API_RATE_LIMIT_SKIP_FAILED,
      APP_VERSION: config.base.APP_VERSION,
      SITE_NAME: config.base.SITE_NAME,
    };
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  public getApiUrl(): string {
    return this.config.PUBLIC_API_URL;
  }

  public isDevelopment(): boolean {
    return this.config.DEV;
  }

  public isProduction(): boolean {
    return this.config.PROD;
  }

  public isWebSocketEnabled(): boolean {
    return this.config.WS_ENABLED && !!this.config.WS_URL;
  }

  public getWebSocketConfig() {
    return {
      enabled: this.config.WS_ENABLED,
      url: this.config.WS_URL,
      reconnectAttempts: this.config.WS_RECONNECT_ATTEMPTS,
      reconnectDelay: this.config.WS_RECONNECT_DELAY,
      heartbeatInterval: this.config.WS_HEARTBEAT_INTERVAL,
    };
  }

  public getRateLimitConfig() {
    return {
      enabled: this.config.API_RATE_LIMIT_ENABLED,
      window: this.config.API_RATE_LIMIT_WINDOW,
      max: this.config.API_RATE_LIMIT_MAX,
      skipSuccess: this.config.API_RATE_LIMIT_SKIP_SUCCESS,
      skipFailed: this.config.API_RATE_LIMIT_SKIP_FAILED,
    };
  }

  public getTimeoutConfig() {
    return {
      timeout: this.config.API_TIMEOUT,
      retries: this.config.API_RETRIES,
      retryDelay: this.config.API_RETRY_DELAY,
    };
  }

  public getAppMeta() {
    return {
      name: this.config.SITE_NAME,
      version: this.config.APP_VERSION,
      environment: this.config.NODE_ENV,
    };
  }
}

export const envConfig = EnvConfigService.getInstance();
export type { EnvironmentConfig };
export default envConfig;
