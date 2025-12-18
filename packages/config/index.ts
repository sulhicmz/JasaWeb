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

// Default export for compatibility
export { BUSINESS_CONFIG as default } from './src/business-config';
