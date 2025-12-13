export interface EnvSchema {
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  minLength?: number;
  pattern?: RegExp;
  description?: string;
}

export const ENV_SCHEMA: Record<string, EnvSchema> = {
  // Database
  DATABASE_URL: {
    type: 'string',
    required: true,
    description: 'PostgreSQL connection string',
  },

  // Redis
  REDIS_URL: {
    type: 'string',
    required: false,
    description: 'Redis connection string',
  },

  // JWT
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'JWT signing secret',
  },
  JWT_EXPIRES_IN: {
    type: 'string',
    required: false,
    description: 'JWT expiration time',
  },

  // Session
  SESSION_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'Session signing secret',
  },

  // Email
  SMTP_HOST: {
    type: 'string',
    required: false,
    description: 'SMTP server host',
  },
  SMTP_PORT: {
    type: 'number',
    required: false,
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

  // File Storage
  S3_ENDPOINT: {
    type: 'string',
    required: false,
    description: 'S3-compatible endpoint',
  },
  S3_ACCESS_KEY: {
    type: 'string',
    required: false,
    description: 'S3 access key',
  },
  S3_SECRET_KEY: {
    type: 'string',
    required: false,
    description: 'S3 secret key',
  },
  S3_BUCKET: {
    type: 'string',
    required: false,
    description: 'S3 bucket name',
  },
  S3_REGION: {
    type: 'string',
    required: false,
    description: 'S3 region',
  },

  // Application
  NODE_ENV: {
    type: 'string',
    required: false,
    pattern: /^(development|production|test)$/,
    description: 'Application environment',
  },
  PORT: {
    type: 'number',
    required: false,
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

  const envKeys = Object.keys(ENV_SCHEMA) as Array<keyof typeof ENV_SCHEMA>;
  for (const key of envKeys) {
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

  // Security checks for production
  if (process.env.NODE_ENV === 'production') {
    // Check for weak passwords
    const weakPatterns = [
      /password/i,
      /123456/,
      /admin/i,
      /secret/i,
      /qwerty/i,
    ];

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

    checkWeakPassword(process.env.DATABASE_URL, 'PostgreSQL password');
    checkWeakPassword(process.env.REDIS_URL, 'Redis password');
    checkWeakPassword(process.env.S3_SECRET_KEY, 'MinIO password');

    // Check for default secrets
    if (
      process.env.JWT_SECRET ===
      'your-super-secret-jwt-key-change-in-production'
    ) {
      warnings.push('Using default JWT secret in production');
    }

    if (
      process.env.SESSION_SECRET ===
      'your-super-secret-session-key-change-in-production'
    ) {
      warnings.push('Using default session secret in production');
    }
  }

  // Report results
  if (warnings.length > 0) {
    console.warn('Environment validation warnings:');
    warnings.forEach((warning: string) => console.warn(`  - ${warning}`));
  }

  if (errors.length > 0) {
    console.error('Environment validation errors:');
    errors.forEach((error: string) => console.error(`  - ${error}`));
    throw new EnvValidationError(
      `Environment validation failed: ${errors.join(', ')}`
    );
  }
}

export function getRequiredEnv(key: string): string {
  // Validate key to prevent injection
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    throw new EnvValidationError(`Invalid environment variable key: ${key}`);
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
