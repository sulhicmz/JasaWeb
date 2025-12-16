import { Injectable } from '@nestjs/common';
import {
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
} from '../../../../../packages/config/env-validation';
import { logger } from '../../../../../packages/config/logger';
import { DEFAULT_DATABASE_CONFIG, APP_URLS } from './constants';

@Injectable()
export class AppConfigService {
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
    return 'https://api.jasaweb.com';
  }

  private getDefaultWebUrl(isDevelopment: boolean): string {
    if (isDevelopment) {
      return APP_URLS.FRONTEND_URL;
    }
    return 'https://jasaweb.com';
  }

  private getDefaultCorsOrigins(isDevelopment: boolean): string[] {
    if (isDevelopment) {
      return [
        'http://localhost:4321',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:4321',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];
    }
    return [
      'https://jasaweb.com',
      'https://www.jasaweb.com',
      'https://api.jasaweb.com',
    ];
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

    logger.debug('Application configuration loaded', config);
  }
}
