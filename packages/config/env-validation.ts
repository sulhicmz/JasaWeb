interface EnvVarSchema {
  [key: string]: {
    required: boolean;
    type: 'string' | 'number' | 'boolean';
    minLength?: number;
    pattern?: RegExp;
    description: string;
  };
}

const ENV_SCHEMA: EnvVarSchema = {
  // Database
  POSTGRES_DB: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'PostgreSQL database name',
  },
  POSTGRES_USER: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'PostgreSQL username',
  },
  POSTGRES_PASSWORD: {
    required: true,
    type: 'string',
    minLength: 16,
    description: 'PostgreSQL password (minimum 16 characters)',
  },

  // Redis
  REDIS_PASSWORD: {
    required: true,
    type: 'string',
    minLength: 16,
    description: 'Redis password (minimum 16 characters)',
  },

  // MinIO/S3
  MINIO_ROOT_USER: {
    required: true,
    type: 'string',
    minLength: 3,
    description: 'MinIO root username',
  },
  MINIO_ROOT_PASSWORD: {
    required: true,
    type: 'string',
    minLength: 16,
    description: 'MinIO root password (minimum 16 characters)',
  },

  // JWT Secrets
  JWT_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description:
      'JWT secret key (minimum 32 characters, alphanumeric and symbols only)',
  },
  JWT_REFRESH_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description:
      'JWT refresh secret key (minimum 32 characters, alphanumeric and symbols only)',
  },

  // Session
  SESSION_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description:
      'Session secret (minimum 32 characters, alphanumeric and symbols only)',
  },

  // Encryption
  ENCRYPTION_KEY: {
    required: true,
    type: 'string',
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=_-]+$/,
    description: 'Encryption key for sensitive data (minimum 32 characters)',
  },

  // Application
  NODE_ENV: {
    required: false,
    type: 'string',
    pattern: /^(development|production|test)$/,
    description: 'Application environment (development, production, or test)',
  },
  PORT: {
    required: false,
    type: 'number',
    description: 'Application port (default: 3000)',
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

  for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[key];

    if (schema.required && (value === undefined || value === '')) {
      errors.push(`Required environment variable ${key} is missing or empty`);
      continue;
    }

    if (value !== undefined && value !== '') {
      // Type validation
      if (schema.type === 'number' && isNaN(Number(value))) {
        errors.push(`Environment variable ${key} must be a number`);
        continue;
      }

      if (
        schema.type === 'boolean' &&
        !['true', 'false'].includes(value.toLowerCase())
      ) {
        errors.push(`Environment variable ${key} must be 'true' or 'false'`);
        continue;
      }

      // Length validation
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(
          `Environment variable ${key} must be at least ${schema.minLength} characters long (current: ${value.length})`
        );
      }

      // Pattern validation
      if (schema.pattern && !schema.pattern.test(value)) {
        errors.push(`Environment variable ${key} contains invalid characters`);
      }
    }
  }

  // Security warnings
  if (process.env.NODE_ENV === 'production') {
    const weakPasswords = [
      'password',
      'admin',
      '123456',
      'qwerty',
      'minioadmin',
      'redis_password',
    ];

    for (const weak of weakPasswords) {
      if (process.env.POSTGRES_PASSWORD?.includes(weak)) {
        warnings.push(`PostgreSQL password contains weak pattern: ${weak}`);
      }
      if (process.env.REDIS_PASSWORD?.includes(weak)) {
        warnings.push(`Redis password contains weak pattern: ${weak}`);
      }
      if (process.env.MINIO_ROOT_PASSWORD?.includes(weak)) {
        warnings.push(`MinIO password contains weak pattern: ${weak}`);
      }
    }

    // Check for default secrets
    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key') {
      warnings.push('Using default JWT secret in production');
    }
    if (process.env.SESSION_SECRET === 'your-super-secret-session-key') {
      warnings.push('Using default session secret in production');
    }
  }

  // Output results
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Security Warnings:');
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment Validation Errors:');
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error(
      '\nPlease set the required environment variables before starting the application.'
    );
    console.error(
      'Refer to .env.example for the complete list of required variables.\n'
    );
    throw new EnvValidationError(
      `Environment validation failed: ${errors.join(', ')}`
    );
  }

  console.log('✅ Environment variables validated successfully');
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

export function getRequiredEnv(key: string): string {
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
  return process.env[key] || defaultValue;
}
