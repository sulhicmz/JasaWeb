// Export validation utilities first
export {
  EnvSchema,
  ENV_SCHEMA,
  EnvValidationError,
  validateEnvironmentVariables,
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
  getEnvBoolean,
  generateSecureSecret,
} from './env-validation';

// Export business configuration types and functions
export {
  SiteConfig,
  EmailConfig,
  SecurityConfig,
  NetworkConfig,
  CacheConfig,
  BusinessConfig,
  getSiteConfig,
  getEmailConfig,
  getSecurityConfig,
  getNetworkConfig,
  getCacheConfig,
  isEnvDevelopment,
  isEnvTest,
  isEnvProduction,
  BUSINESS_CONFIG,
} from './src/business-config';

// Export service ports
export {
  ServicePortService,
  servicePorts,
  ServicePorts,
  ServiceUrls,
  DockerServiceConfig,
} from './service-ports';

// Export logger
export { logger } from './logger';

// Export unified configuration
export {
  JasaWebConfigService,
  jasaWebConfig,
} from './src/jasaweb-config.service';

export type {
  JasaWebConfig,
  ConfigSection,
  EnvironmentType,
  ConfigValidationResult,
  INetworkConfig,
  IDatabaseConfig,
  IEmailConfig,
  ISecurityConfig,
  ICacheConfig,
  IFileUploadConfig,
} from './src/jasaweb-config.service';

// Export dynamic storage configuration
export {
  storageConfigRegistry,
  StorageConfigRegistry,
  StorageType,
} from './src/jasaweb-config.service';

export type {
  StorageConfig,
  StorageValidation,
  ValidationResult,
} from './src/jasaweb-config.service';

export interface StorageAdapter {
  upload: (
    data: Buffer,
    options: StorageUploadOptions
  ) => Promise<StorageUploadResult>;
  download: (key: string, options: StorageDownloadOptions) => Promise<Buffer>;
  delete: (key: string) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
  getSignedUrl?: (key: string, expiresIn: number) => Promise<string>;
  list?: (prefix: string) => Promise<StorageListItem[]>;
}

export interface StorageUploadOptions {
  bucket?: string;
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
  encryption?: boolean;
}

export interface StorageUploadResult {
  key: string;
  url?: string;
  etag?: string;
  size: number;
  bucket?: string;
}

export interface StorageDownloadOptions {
  bucket?: string;
  range?: { start: number; end: number };
}

export interface StorageListItem {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

// Export environment-aware configuration
export {
  SERVICE_PORTS,
  HOSTS,
  UrlBuilder,
  WebSocketUrlBuilder,
  HEALTH_CHECKS,
} from './src/environment-aware-config';

// Export dynamic URL configuration
export {
  urlConfig,
  getApiUrl,
  getWebUrl,
  getCdnUrl,
  getWebSocketUrl,
  getAllowedOrigins,
} from './src/url-config';

export type { UrlConfig } from './src/url-config';

// Default export for compatibility
export { BUSINESS_CONFIG as default } from './src/business-config';
