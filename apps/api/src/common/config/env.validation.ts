/**
 * Gets a required environment variable, throws an error if not found
 */
export function getRequiredEnv(key: string): string {
  // Validate key to prevent prototype pollution
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    throw new Error(`Invalid environment variable key: ${key}`);
  }
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Required environment variable ${key} is missing or empty`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
export function getOptionalEnv(
  key: string,
  defaultValue?: string
): string | undefined {
  // Validate key to prevent prototype pollution
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    throw new Error(`Invalid environment variable key: ${key}`);
  }
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[key];
  return value !== undefined && value !== '' ? value : defaultValue;
}

/**
 * Gets an environment variable as a number with a default value
 */
export function getEnvNumber(key: string, defaultValue: number): number {
  // Validate key to prevent prototype pollution
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    throw new Error(`Invalid environment variable key: ${key}`);
  }
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[key];
  const num = value !== undefined ? parseInt(value, 10) : defaultValue;
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return num;
}

/**
 * Gets an environment variable as a boolean with a default value
 */
export function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  // Validate key to prevent prototype pollution
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    throw new Error(`Invalid environment variable key: ${key}`);
  }
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Generates a secure random secret using crypto module
 */
export function generateSecureSecret(length: number = 64): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

export function validateEnv(config: Record<string, unknown>) {
  // Set environment variables from config for validation
  // Only allow specific, safe environment variable keys
  const allowedEnvKeys: ReadonlyArray<string> = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
    'CORS_ORIGIN',
    'API_BASE_URL',
    'WEB_BASE_URL',
    'FRONTEND_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_SECURE',
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    // Storage configuration
    'STORAGE_TYPE',
    'MINIO_ENDPOINT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'MINIO_BUCKET',
    'MINIO_ROOT_USER',
    'MINIO_ROOT_PASSWORD',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET',
    // Analytics configuration
    'GOOGLE_ANALYTICS_ID',
    'ANALYTICS_ENABLED',
    'PLAUSIBLE_DOMAIN',
    'PLAUSIBLE_API_HOST',
    // Production URLs
    'PRODUCTION_API_URL',
    'PRODUCTION_WEB_URL',
    'PRODUCTION_CDN_URL',
    // Staging URLs
    'STAGING_API_URL',
    'STAGING_WEB_URL',
    'STAGING_CDN_URL',
    // Development configuration
    'DEV_API_PORT',
    'DEV_WEB_PORT',
    'DEV_API_HOST',
    'DEV_WEB_HOST',
    // Test configuration
    'TEST_API_URL',
    'TEST_WEB_URL',
    // CORS additional origins
    'ADDITIONAL_CORS_ORIGINS',
    'INCLUDE_STAGING_ORIGINS',
    'INCLUDE_PRODUCTION_ORIGINS',
  ] as const;

  const allowedEnvKeysSet = new Set(allowedEnvKeys);

  // Use safe property assignment to prevent object injection
  for (const key of Object.keys(config)) {
    if (
      typeof key === 'string' &&
      allowedEnvKeysSet.has(key) &&
      /^[A-Z_][A-Z0-9_]*$/.test(key) &&
      Object.prototype.hasOwnProperty.call(config, key)
    ) {
      // Use Object.defineProperty with specific properties to prevent prototype pollution
      // Ensure key is a valid string and not a prototype property
      const safeKey = String(key);
      const configValue = Reflect.get(config, safeKey); // Safe reflection-based access
      if (configValue !== undefined) {
        Object.defineProperty(process.env, safeKey, {
          value: String(configValue),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  return config;
}
