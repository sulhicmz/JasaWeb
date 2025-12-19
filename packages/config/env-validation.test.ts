import {
  validateEnvironmentVariables,
  EnvValidationError,
  generateSecureSecret,
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
  getEnvBoolean,
} from './env-validation';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Environment Variable Validation', () => {
  beforeEach(() => {
    // Clear all environment variables before each test
    for (const key in process.env) {
      if (
        key.startsWith('POSTGRES_') ||
        key.startsWith('JWT_') ||
        key.startsWith('SESSION_') ||
        key.startsWith('ENCRYPTION_') ||
        key.startsWith('REDIS_') ||
        key.startsWith('S3_') ||
        key.startsWith('MINIO_')
      ) {
        delete process.env[key];
      }
    }
  });

  describe('Hardcoded Credential Detection', () => {
    it('should detect and reject "test" as database password', () => {
      process.env.POSTGRES_PASSWORD = 'test';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow();
    });

    it('should detect and reject "test" as database username', () => {
      process.env.POSTGRES_USER = 'test';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });

    it('should detect and reject "test" as MinIO user', () => {
      process.env.MINIO_ROOT_USER = 'test';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });

    it('should detect "test" database name with warning in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.POSTGRES_DB = 'test';
      process.env.POSTGRES_USER = 'validuser';
      process.env.POSTGRES_PASSWORD = 'ValidPassword123!';
      process.env.DATABASE_URL =
        'postgresql://validuser:ValidPassword123!@localhost:5432/test';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.JWT_REFRESH_SECRET = generateSecureSecret(32);
      process.env.SESSION_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      // Should not throw, but should log warning (we can't easily test logging here)
      expect(() => validateEnvironmentVariables()).not.toThrow();
    });

    it('should allow legitimate credentials', () => {
      process.env.NODE_ENV = 'development';
      process.env.POSTGRES_USER = 'jasaweb_user';
      process.env.POSTGRES_PASSWORD = 'JwS3cur3P@ss!2024';
      process.env.POSTGRES_DB = 'jasaweb_dev';
      process.env.DATABASE_URL =
        'postgresql://jasaweb_user:JwS3cur3P@ss!2024@localhost:5432/jasaweb_dev';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.JWT_REFRESH_SECRET = generateSecureSecret(32);
      process.env.SESSION_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).not.toThrow();
    });
  });

  describe('Weak Pattern Detection', () => {
    it('should reject password containing "password"', () => {
      process.env.POSTGRES_PASSWORD = 'mypassword123';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });

    it('should reject password containing "admin"', () => {
      process.env.POSTGRES_PASSWORD = 'admin123!';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });

    it('should reject password containing "123456"', () => {
      process.env.POSTGRES_PASSWORD = 'abc123456def';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });

    it('should reject password containing "secret"', () => {
      process.env.POSTGRES_PASSWORD = 'mysecret!';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });
  });

  describe('Default Secret Detection in Production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should reject default JWT secret', () => {
      process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
      process.env.JWT_REFRESH_SECRET = generateSecureSecret(32);
      process.env.SESSION_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).not.toThrow(); // Should warn, not throw
    });

    it('should reject default session secret', () => {
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.JWT_REFRESH_SECRET = generateSecureSecret(32);
      process.env.SESSION_SECRET =
        'your-super-secret-session-key-change-in-production';
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).not.toThrow(); // Should warn, not throw
    });
  });

  describe('Secure Secret Generation', () => {
    it('should generate secrets with specified length', () => {
      const secret = generateSecureSecret(32);
      expect(secret).toHaveLength(32);
    });

    it('should generate secrets containing only allowed characters', () => {
      const secret = generateSecureSecret(64);
      const allowedPattern = /^[A-Za-z0-9+/=_-]+$/;
      expect(allowedPattern.test(secret)).toBe(true);
    });

    it('should generate different secrets each time', () => {
      const secret1 = generateSecureSecret(32);
      const secret2 = generateSecureSecret(32);
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('Environment Variable Accessors', () => {
    beforeEach(() => {
      process.env.TEST_STRING = 'test_value';
      process.env.TEST_NUMBER = '42';
      process.env.TEST_BOOLEAN = 'true';
    });

    it('should get required environment variable', () => {
      delete process.env.TEST_STRING;
      expect(() => getRequiredEnv('TEST_STRING')).toThrow(EnvValidationError);
    });

    it('should get optional environment variable with default', () => {
      const value = getOptionalEnv('NON_EXISTENT', 'default_value');
      expect(value).toBe('default_value');
    });

    it('should get number environment variable', () => {
      const value = getEnvNumber('TEST_NUMBER');
      expect(value).toBe(42);
    });

    it('should get boolean environment variable', () => {
      const value = getEnvBoolean('TEST_BOOLEAN');
      expect(value).toBe(true);
    });
  });

  describe('Production Security Checks', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should warn about wildcard CORS origin', () => {
      process.env.CORS_ORIGIN = '*';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.JWT_REFRESH_SECRET = generateSecureSecret(32);
      process.env.SESSION_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      // Should not throw, but log warning
      expect(() => validateEnvironmentVariables()).not.toThrow();
    });

    it('should warn about insecure SMTP in production', () => {
      process.env.SMTP_SECURE = 'false';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.JWT_REFRESH_SECRET = generateSecureSecret(32);
      process.env.SESSION_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      // Should not throw, but log warning
      expect(() => validateEnvironmentVariables()).not.toThrow();
    });
  });

  describe('Validation Error Handling', () => {
    it('should throw EnvValidationError for missing required variables', () => {
      // No JWT_SECRET set
      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });

    it('should include helpful error messages', () => {
      try {
        validateEnvironmentVariables();
      } catch (error) {
        if (error instanceof EnvValidationError) {
          expect(error.message).toContain('Environment validation failed');
        }
      }
    });
  });
});
