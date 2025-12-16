// Enhanced environment validation for the API
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

function validateUrl(url: string, fieldName: string): string {
  try {
    new URL(url);
    return url.replace(/\/$/, ''); // Remove trailing slash
  } catch {
    throw new ApiConfigError(`Invalid ${fieldName}: ${url}`);
  }
}

function validateEmail(email: string, fieldName: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiConfigError(`Invalid ${fieldName}: ${email}`);
  }
  return email;
}

function validatePort(port: string, fieldName: string): number {
  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    throw new ApiConfigError(
      `Invalid ${fieldName}: ${port}. Must be between 1 and 65535`
    );
  }
  return portNum;
}

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

function parseDatabaseUrl(url: string): { host: string; port: number } {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname || 'localhost';
    const port = parseInt(urlObj.port, 10) || 5432;
    return { host: hostname, port };
  } catch {
    throw new ApiConfigError(`Invalid DATABASE_URL: ${url}`);
  }
}

function createApiConfig(): ApiConfig {
  const env = process.env;

  try {
    // Node environment
    const nodeEnv = (env.NODE_ENV?.toLowerCase() || 'development') as
      | 'development'
      | 'production'
      | 'test';

    // Port configuration
    const port = validatePort(env.PORT || '3000', 'PORT');

    // API Base URL
    const apiBaseUrl = validateUrl(
      env.API_BASE_URL || `http://localhost:${port}`,
      'API_BASE_URL'
    );

    // CORS origins
    const corsOriginEnv = env.CORS_ORIGIN;
    const corsOrigins = corsOriginEnv
      ? corsOriginEnv
          .split(',')
          .map((origin: string) => validateUrl(origin.trim(), 'CORS_ORIGIN'))
      : nodeEnv === 'production'
        ? ['https://jasaweb.com', 'https://www.jasaweb.com']
        : [
            `http://localhost:4321`,
            `http://localhost:3000`,
            `http://127.0.0.1:4321`,
          ];

    // Frontend URLs
    const webBaseUrl = validateUrl(
      env.WEB_BASE_URL ||
        (nodeEnv === 'production'
          ? 'https://jasaweb.com'
          : 'http://localhost:4321'),
      'WEB_BASE_URL'
    );

    const frontendUrl = validateUrl(
      env.FRONTEND_URL || webBaseUrl,
      'FRONTEND_URL'
    );

    // Database configuration
    const databaseUrl = env.DATABASE_URL;
    if (!databaseUrl) {
      throw new ApiConfigError('DATABASE_URL is required');
    }
    const { host: databaseHost, port: databasePort } =
      parseDatabaseUrl(databaseUrl);

    // JWT configuration
    const jwtSecret = validateJwtSecret(env.JWT_SECRET || '', 'JWT_SECRET');
    const jwtRefreshSecret = validateJwtSecret(
      env.JWT_REFRESH_SECRET || '',
      'JWT_REFRESH_SECRET'
    );

    // Email configuration
    const emailHost = env.EMAIL_HOST;
    const emailPort = validatePort(env.EMAIL_PORT || '587', 'EMAIL_PORT');
    const emailUser = env.EMAIL_USER;
    const emailPass = env.EMAIL_PASS;
    const emailSecure = env.EMAIL_SECURE === 'true' || emailPort === 465;

    if (emailUser && emailPass && emailHost) {
      validateEmail(emailUser, 'EMAIL_USER');
    }

    // WebSocket origin
    const websocketOrigin = validateUrl(
      env.WEBSOCKET_ORIGIN || webBaseUrl,
      'WEBSOCKET_ORIGIN'
    );

    // Redis configuration (optional)
    const redisUrl = env.REDIS_URL;
    const redisHost = env.REDIS_HOST;
    const redisPort = redisHost
      ? validatePort(env.REDIS_PORT || '6379', 'REDIS_PORT')
      : undefined;

    // MinIO configuration (optional)
    const minioEndpoint = env.MINIO_ENDPOINT;
    const minioPort = minioEndpoint
      ? validatePort(env.MINIO_PORT || '9000', 'MINIO_PORT')
      : undefined;
    const minioAccessKey = env.MINIO_ACCESS_KEY;
    const minioSecretKey = env.MINIO_SECRET_KEY;
    const minioBucket = env.MINIO_BUCKET || 'jasaweb';
    const minioUseSsl =
      env.MINIO_USE_SSL === 'true' || nodeEnv === 'production';

    return {
      nodeEnv,
      port,
      apiBaseUrl,
      corsOrigins,
      webBaseUrl,
      frontendUrl,
      databaseUrl,
      databaseHost,
      databasePort,
      jwtSecret,
      jwtExpiresIn: env.JWT_EXPIRES_IN || '1d',
      jwtRefreshSecret,
      jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d',
      emailHost,
      emailPort,
      emailUser,
      emailPass,
      emailSecure,
      websocketOrigin,
      redisUrl,
      redisHost,
      redisPort,
      minioEndpoint,
      minioPort,
      minioAccessKey,
      minioSecretKey,
      minioBucket,
      minioUseSsl,
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
