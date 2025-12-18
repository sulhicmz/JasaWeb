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
  UnifiedConfigService,
  unifiedConfig,
} from './src/unified-config.service';

export {
  JasaWebConfigService,
  jasaWebConfig,
} from './src/jasaweb-config.service';

export type {
  JasaWebConfig,
  ConfigSection,
  EnvironmentType,
  ConfigValidationResult,
  ConfigSummaryOptions,
} from './src/unified-config.service';

export type {
  INetworkConfig,
  IDatabaseConfig,
  IEmailConfig,
  ISecurityConfig,
  ICacheConfig,
  IFileUploadConfig,
} from './src/jasaweb-config.types';

// Export dynamic storage configuration
export {
  storageConfigRegistry,
  StorageConfigRegistry,
} from './src/dynamic-storage-config.service';

export type {
  StorageType,
  StorageConfig,
  StorageValidation,
  ValidationResult,
  StorageAdapter,
  StorageUploadOptions,
  StorageUploadResult,
  StorageDownloadOptions,
  StorageListItem,
} from './src/dynamic-storage-config.service';

// Default export for compatibility
export { BUSINESS_CONFIG as default } from './src/business-config';
