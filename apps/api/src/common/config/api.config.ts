// Enhanced environment validation for the API
import { jasaWebConfig } from '@jasaweb/config';

interface ApiConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  apiBaseUrl: string;
  corsOrigins: string[];
  webBaseUrl: string;
  frontendUrl: string;
  databaseUrl: string;
  databaseHost: string;
  databasePort: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  emailHost?: string;
  emailPort: number;
  emailUser?: string;
  emailPass?: string;
  emailSecure: boolean;
  websocketOrigin: string;
  redisUrl?: string;
  redisHost?: string;
  redisPort?: number;
  minioEndpoint?: string;
  minioPort?: number;
  minioAccessKey?: string;
  minioSecretKey?: string;
  minioBucket?: string;
  minioUseSsl: boolean;
}

class ApiConfigError extends Error {
  constructor(message: string) {
    super(`API Configuration Error: ${message}`);
    this.name = 'ApiConfigError';
  }
}

// Validation functions removed as they are unused in current implementation
// Keeping them commented for future use if needed

function validateJwtSecret(secret: string, fieldName: string): string {
  if (!secret || secret.length < 32) {
    throw new ApiConfigError(
      `${fieldName} must be at least 32 characters long for security. Current length: ${secret?.length || 0}`
    );
  }

  // Check if it's using the default/example value
  const exampleValues = [
    'CHANGE_THIS_32_CHARACTER_RANDOM_STRING',
    'your-super-secret-jwt-key',
    'example-secret-key',
  ];

  if (
    exampleValues.includes(secret) ||
    secret.toLowerCase().includes('change')
  ) {
    throw new ApiConfigError(
      `${fieldName} is using a default/example value. Please set a secure random string.`
    );
  }

  return secret;
}

// parseDatabaseUrl function removed as it is unused in current implementation
// Keeping it commented for future use if needed

function createApiConfig(): ApiConfig {
  try {
    // Use unified configuration
    jasaWebConfig.getSection('base'); // Accessed for side effects
    const apiConfig = jasaWebConfig.getSection('api');
    const storageConfig = jasaWebConfig.getSection('storage');
    const redisConfig = jasaWebConfig.getSection('redis');
    const networkConfig = jasaWebConfig.getNetworkConfig();
    const databaseConfig = jasaWebConfig.getDatabaseConfig();
    const securityConfig = jasaWebConfig.getSecurityConfig();
    const emailConfig = jasaWebConfig.getEmailConfig();

    // Validate JWT secrets
    validateJwtSecret(securityConfig.jwt.secret, 'JWT_SECRET');
    validateJwtSecret(securityConfig.jwt.refreshSecret, 'JWT_REFRESH_SECRET');

    return {
      nodeEnv: jasaWebConfig.getEnvironmentType(),
      port: networkConfig.api.port,
      apiBaseUrl: networkConfig.api.baseUrl,
      corsOrigins: networkConfig.cors.origins,
      webBaseUrl: networkConfig.web.baseUrl,
      frontendUrl: apiConfig.FRONTEND_URL,
      databaseUrl: databaseConfig.url,
      databaseHost: databaseConfig.host,
      databasePort: databaseConfig.port,
      jwtSecret: securityConfig.jwt.secret,
      jwtExpiresIn: securityConfig.jwt.expiresIn,
      jwtRefreshSecret: securityConfig.jwt.refreshSecret,
      jwtRefreshExpiresIn: securityConfig.jwt.refreshExpiresIn,
      emailHost: emailConfig.host,
      emailPort: emailConfig.port,
      emailUser: emailConfig.user,
      emailPass: emailConfig.pass,
      emailSecure: emailConfig.secure,
      websocketOrigin: networkConfig.websocket.origin,
      redisUrl: process.env.REDIS_URL,
      redisHost: redisConfig.REDIS_HOST,
      redisPort: redisConfig.REDIS_PORT,
      minioEndpoint: storageConfig.MINIO_ENDPOINT,
      minioPort: 9000, // Default MinIO port
      minioAccessKey: storageConfig.MINIO_ACCESS_KEY,
      minioSecretKey: storageConfig.MINIO_SECRET_KEY,
      minioBucket: storageConfig.MINIO_BUCKET,
      minioUseSsl: jasaWebConfig.isProduction(),
    };
  } catch (error) {
    console.error('=== API CONFIGURATION ERROR ===');
    if (error instanceof ApiConfigError) {
      console.error(error.message);
    } else {
      console.error('Unknown configuration error:', error);
    }
    console.error('================================\n');

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    throw error;
  }
}

// Create and export the configuration
const apiConfig = createApiConfig();

// Export types and configuration
export type { ApiConfig };
export { ApiConfigError, createApiConfig };
export default apiConfig;
