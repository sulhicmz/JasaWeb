import { logger } from './logger';

export interface EnvSchema {
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  minLength?: number;
  pattern?: RegExp;
  description?: string;
  defaultValue?: string | number | boolean;
}

export const ENV_SCHEMA: Record<string, EnvSchema> = {
  // Database Configuration
  DATABASE_URL: {
    type: 'string',
    required: true,
    description: 'PostgreSQL connection string',
  },
  POSTGRES_DB: {
    type: 'string',
    required: false,
    description: 'PostgreSQL database name (alternative to DATABASE_URL)',
  },
  POSTGRES_USER: {
    type: 'string',
    required: false,
    description: 'PostgreSQL username (alternative to DATABASE_URL)',
  },
  POSTGRES_PASSWORD: {
    type: 'string',
    required: false,
    minLength: 16,
    description: 'PostgreSQL password (minimum 16 characters)',
  },
  POSTGRES_HOST: {
    type: 'string',
    required: false,
    defaultValue: 'localhost',
    description: 'PostgreSQL host',
  },
  POSTGRES_PORT: {
    type: 'number',
    required: false,
    defaultValue: 5432,
    description: 'PostgreSQL port',
  },

  // Redis Configuration
  REDIS_URL: {
    type: 'string',
    required: false,
    description: 'Redis connection string',
  },
  REDIS_PASSWORD: {
    type: 'string',
    required: false,
    minLength: 16,
    description: 'Redis password (minimum 16 characters)',
  },
  REDIS_HOST: {
    type: 'string',
    required: false,
    defaultValue: 'localhost',
    description: 'Redis host',
  },
  REDIS_PORT: {
    type: 'number',
    required: false,
    defaultValue: 6379,
    description: 'Redis port',
  },

  // JWT Configuration
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description:
      'JWT signing secret (minimum 32 characters, alphanumeric and symbols only)',
  },
  JWT_REFRESH_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description:
      'JWT refresh secret (minimum 32 characters, alphanumeric and symbols only)',
  },
  JWT_EXPIRES_IN: {
    type: 'string',
    required: false,
    defaultValue: '1h',
    description: 'JWT expiration time (e.g., 1h, 7d)',
  },
  JWT_REFRESH_EXPIRES_IN: {
    type: 'string',
    required: false,
    defaultValue: '7d',
    description: 'JWT refresh expiration time (e.g., 7d, 30d)',
  },

  // Session Configuration
  SESSION_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description:
      'Session signing secret (minimum 32 characters, alphanumeric and symbols only)',
  },
  SESSION_MAX_AGE_HOURS: {
    type: 'number',
    required: false,
    defaultValue: 24,
    description: 'Session maximum age in hours',
  },
  SESSION_ABSOLUTE_TIMEOUT_HOURS: {
    type: 'number',
    required: false,
    defaultValue: 72,
    description: 'Session absolute timeout in hours',
  },
  SESSION_INACTIVITY_TIMEOUT_MINUTES: {
    type: 'number',
    required: false,
    defaultValue: 30,
    description: 'Session inactivity timeout in minutes',
  },

  // Encryption Configuration
  ENCRYPTION_KEY: {
    type: 'string',
    required: true,
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description: 'Encryption key for sensitive data (exactly 32 characters)',
  },
  ENCRYPTION_ALGORITHM: {
    type: 'string',
    required: false,
    defaultValue: 'aes-256-gcm',
    description: 'Encryption algorithm',
  },

  // Email Configuration
  SMTP_HOST: {
    type: 'string',
    required: false,
    description: 'SMTP server host',
  },
  SMTP_PORT: {
    type: 'number',
    required: false,
    defaultValue: 587,
    description: 'SMTP server port',
  },
  SMTP_USER: {
    type: 'string',
    required: false,
    description: 'SMTP username',
  },
  SMTP_PASS: {
    type: 'string',
    required: false,
    description: 'SMTP password',
  },
  SMTP_SECURE: {
    type: 'boolean',
    required: false,
    defaultValue: false,
    description: 'Use secure SMTP connection',
  },

  // File Storage Configuration (S3/MinIO)
  STORAGE_TYPE: {
    type: 'string',
    required: false,
    pattern: /^(local|s3)$/,
    defaultValue: 'local',
    description: 'Storage type: local or s3',
  },
  S3_ENDPOINT: {
    type: 'string',
    required: false,
    description: 'S3-compatible endpoint URL',
  },
  S3_ACCESS_KEY: {
    type: 'string',
    required: false,
    description: 'S3 access key',
  },
  S3_SECRET_KEY: {
    type: 'string',
    required: false,
    minLength: 16,
    description: 'S3 secret key (minimum 16 characters)',
  },
  S3_BUCKET: {
    type: 'string',
    required: false,
    description: 'S3 bucket name',
  },
  S3_REGION: {
    type: 'string',
    required: false,
    defaultValue: 'us-east-1',
    description: 'S3 region',
  },
  MINIO_ROOT_USER: {
    type: 'string',
    required: false,
    minLength: 3,
    description: 'MinIO root username',
  },
  MINIO_ROOT_PASSWORD: {
    type: 'string',
    required: false,
    minLength: 16,
    description: 'MinIO root password (minimum 16 characters)',
  },

  // Password Policy Configuration
  PASSWORD_MIN_LENGTH: {
    type: 'number',
    required: false,
    defaultValue: 8,
    description: 'Minimum password length',
  },
  PASSWORD_REQUIRE_UPPERCASE: {
    type: 'boolean',
    required: false,
    defaultValue: true,
    description: 'Require uppercase letters in passwords',
  },
  PASSWORD_REQUIRE_LOWERCASE: {
    type: 'boolean',
    required: false,
    defaultValue: true,
    description: 'Require lowercase letters in passwords',
  },
  PASSWORD_REQUIRE_NUMBERS: {
    type: 'boolean',
    required: false,
    defaultValue: true,
    description: 'Require numbers in passwords',
  },
  PASSWORD_REQUIRE_SPECIAL: {
    type: 'boolean',
    required: false,
    defaultValue: true,
    description: 'Require special characters in passwords',
  },
  PASSWORD_MAX_AGE_DAYS: {
    type: 'number',
    required: false,
    defaultValue: 90,
    description: 'Maximum password age in days',
  },
  PASSWORD_PREVENT_REUSE: {
    type: 'number',
    required: false,
    defaultValue: 5,
    description: 'Number of previous passwords to prevent reuse',
  },

  // Account Lockout Configuration
  ACCOUNT_LOCKOUT_ENABLED: {
    type: 'boolean',
    required: false,
    defaultValue: true,
    description: 'Enable account lockout after failed attempts',
  },
  LOCKOUT_MAX_ATTEMPTS: {
    type: 'number',
    required: false,
    defaultValue: 5,
    description: 'Maximum failed login attempts before lockout',
  },
  LOCKOUT_DURATION_MINUTES: {
    type: 'number',
    required: false,
    defaultValue: 30,
    description: 'Lockout duration in minutes',
  },
  LOCKOUT_RESET_AFTER_MINUTES: {
    type: 'number',
    required: false,
    defaultValue: 60,
    description: 'Reset failed attempts after this many minutes',
  },

  // Rate Limiting Configuration
  RATE_LIMIT_TTL: {
    type: 'number',
    required: false,
    defaultValue: 60,
    description: 'Global rate limit TTL in seconds',
  },
  RATE_LIMIT_MAX: {
    type: 'number',
    required: false,
    defaultValue: 100,
    description: 'Global rate limit maximum requests',
  },
  AUTH_RATE_LIMIT_TTL: {
    type: 'number',
    required: false,
    defaultValue: 900,
    description: 'Auth rate limit TTL in seconds',
  },
  AUTH_RATE_LIMIT_MAX: {
    type: 'number',
    required: false,
    defaultValue: 5,
    description: 'Auth rate limit maximum requests',
  },
  API_RATE_LIMIT_TTL: {
    type: 'number',
    required: false,
    defaultValue: 60,
    description: 'API rate limit TTL in seconds',
  },
  API_RATE_LIMIT_MAX: {
    type: 'number',
    required: false,
    defaultValue: 100,
    description: 'API rate limit maximum requests',
  },

  // CORS Configuration
  CORS_ORIGIN: {
    type: 'string',
    required: false,
    description: 'Comma-separated list of allowed CORS origins',
  },

  // Application Configuration
  NODE_ENV: {
    type: 'string',
    required: false,
    pattern: /^(development|production|test)$/,
    defaultValue: 'development',
    description: 'Application environment (development, production, or test)',
  },
  PORT: {
    type: 'number',
    required: false,
    defaultValue: 3000,
    description: 'Application port',
  },
  API_BASE_URL: {
    type: 'string',
    required: false,
    description: 'Base URL for API',
  },
  WEB_BASE_URL: {
    type: 'string',
    required: false,
    description: 'Base URL for web application',
  },
};

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

export function validateEnvironmentVariables(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Define allowed keys to prevent prototype pollution
  const allowedKeys = new Set(Object.keys(ENV_SCHEMA));
  const envKeys = Object.keys(ENV_SCHEMA) as Array<keyof typeof ENV_SCHEMA>;

  for (const key of envKeys) {
    // Validate key against allowed set to prevent injection
    if (!allowedKeys.has(key)) {
      errors.push(`Invalid environment variable key: ${key}`);
      continue;
    }

    const schema = ENV_SCHEMA[key];
    const value = process.env[key];

    if (schema?.required && (value === undefined || value === '')) {
      errors.push(`Required environment variable ${key} is missing or empty`);
      continue;
    }

    if (value !== undefined && value !== '') {
      // Type validation
      if (schema?.type === 'number' && isNaN(Number(value))) {
        errors.push(`Environment variable ${key} must be a number`);
        continue;
      }

      if (
        schema?.type === 'boolean' &&
        !['true', 'false'].includes(value.toLowerCase())
      ) {
        errors.push(`Environment variable ${key} must be 'true' or 'false'`);
        continue;
      }

      // String validation
      if (schema?.type === 'string') {
        if (schema?.minLength && value.length < schema.minLength) {
          errors.push(
            `Environment variable ${key} must be at least ${schema.minLength} characters long (current: ${value.length})`
          );
          continue;
        }

        if (schema?.pattern && !schema.pattern.test(value)) {
          errors.push(
            `Environment variable ${key} does not match required pattern`
          );
          continue;
        }
      }
    }
  }

  // Security checks for production and development
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'development'
  ) {
    // Check for weak passwords and hardcoded test credentials
    const weakPatterns = [
      /password/i,
      /123456/,
      /admin/i,
      /secret/i,
      /qwerty/i,
      /minioadmin/i,
      /redis_password/i,
      /^test$/, // Exact match for "test"
      /CHANGE_THIS/,
      /GENERATE_.*HERE/,
      /your-.*-key/,
      /default/,
      /placeholder/i,
    ];

    // Additional check for insecure database names (only warn in development)
    if (
      (process.env.POSTGRES_DB === 'test' ||
        process.env.POSTGRES_DB === 'prod' ||
        process.env.POSTGRES_DB === 'production') &&
      process.env.NODE_ENV === 'development'
    ) {
      warnings.push(
        `Using potentially database name in development environment: ${process.env.POSTGRES_DB}`
      );
    }

    const checkWeakPassword = (value: string | undefined, name: string) => {
      if (value) {
        for (const weak of weakPatterns) {
          if (weak.test(value)) {
            warnings.push(`${name} contains weak pattern: ${weak.source}`);
            break;
          }
        }
      }
    };

    checkWeakPassword(process.env.POSTGRES_PASSWORD, 'PostgreSQL password');
    checkWeakPassword(process.env.POSTGRES_USER, 'PostgreSQL username');
    checkWeakPassword(process.env.REDIS_PASSWORD, 'Redis password');
    checkWeakPassword(process.env.S3_SECRET_KEY, 'S3 secret key');
    checkWeakPassword(process.env.S3_ACCESS_KEY, 'S3 access key');
    checkWeakPassword(process.env.MINIO_ROOT_PASSWORD, 'MinIO password');
    checkWeakPassword(process.env.MINIO_ROOT_USER, 'MinIO username');

    // Check for default secrets
    const defaultSecrets = [
      'your-super-secret-jwt-key-change-in-production',
      'your-super-secret-jwt-key',
      'your-super-secret-session-key-change-in-production',
      'your-super-secret-session-key',
      'change-me-in-production',
      'default-secret-key',
    ];

    if (defaultSecrets.includes(process.env.JWT_SECRET || '')) {
      warnings.push('Using default JWT secret in production');
    }

    if (defaultSecrets.includes(process.env.JWT_REFRESH_SECRET || '')) {
      warnings.push('Using default JWT refresh secret in production');
    }

    if (defaultSecrets.includes(process.env.SESSION_SECRET || '')) {
      warnings.push('Using default session secret in production');
    }

    if (defaultSecrets.includes(process.env.ENCRYPTION_KEY || '')) {
      warnings.push('Using default encryption key in production');
    }

    // Check for insecure defaults
    if (
      process.env.CORS_ORIGIN === '*' ||
      process.env.CORS_ORIGIN?.includes('*')
    ) {
      warnings.push('Using wildcard CORS origin in production is insecure');
    }

    if (process.env.SMTP_SECURE === 'false') {
      warnings.push('SMTP secure connection disabled in production');
    }
  }

  // Report results
  if (warnings.length > 0) {
    logger.warn('Environment security warnings', { warnings });
  }

  if (errors.length > 0) {
    logger.error('Environment validation errors', { errors });
    throw new EnvValidationError(
      `Environment validation failed: ${errors.join(', ')}`
    );
  }

  logger.info('Environment variables validated successfully');
}

export function getRequiredEnv(key: string): string {
  // Validate key to prevent injection
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    throw new EnvValidationError(`Invalid environment variable key: ${key}`);
  }

  // Double validation against allowed keys
  if (!Object.prototype.hasOwnProperty.call(ENV_SCHEMA, key)) {
    throw new EnvValidationError(
      `Environment variable ${key} is not in schema`
    );
  }

  const value = process.env[key];
  if (!value) {
    throw new EnvValidationError(
      `Required environment variable ${key} is not set`
    );
  }
  return value;
}

export function getOptionalEnv(
  key: string,
  defaultValue?: string
): string | undefined {
  // Validate key to prevent injection
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    throw new EnvValidationError(`Invalid environment variable key: ${key}`);
  }

  // Double validation against allowed keys
  if (!Object.prototype.hasOwnProperty.call(ENV_SCHEMA, key)) {
    throw new EnvValidationError(
      `Environment variable ${key} is not in schema`
    );
  }

  return process.env[key] || defaultValue;
}

export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = getOptionalEnv(key);
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new EnvValidationError(
      `Required environment variable ${key} is not set`
    );
  }

  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new EnvValidationError(
      `Environment variable ${key} must be a number`
    );
  }
  return parsed;
}

export function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = getOptionalEnv(key);
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new EnvValidationError(
      `Required environment variable ${key} is not set`
    );
  }

  return value.toLowerCase() === 'true';
}

export function generateSecureSecret(length: number = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=_-';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getEnvArray(key: string, separator: string = ','): string[] {
  const value = getOptionalEnv(key);
  if (!value) return [];
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getEnvUrl(key: string): string {
  const value = getRequiredEnv(key);
  try {
    new URL(value);
    return value;
  } catch {
    throw new EnvValidationError(
      `Environment variable ${key} must be a valid URL`
    );
  }
}

export function getEnvNumberMin(key: string, min: number): number {
  const value = getEnvNumber(key);
  if (value < min) {
    throw new EnvValidationError(
      `Environment variable ${key} must be at least ${min}`
    );
  }
  return value;
}

export function getEnvEmail(key: string): string {
  const value = getRequiredEnv(key);
  validateEmail(value);
  return value;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new EnvValidationError(`Invalid email format: ${email}`);
  }
  return true;
}
