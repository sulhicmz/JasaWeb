import {
  validateEnvironmentVariables,
  EnvValidationError,
  generateSecureSecret,
} from '../env-validation';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Environment Variable Validation', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

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
        key.startsWith('MINIO_') ||
        key.startsWith('NODE_ENV')
      ) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('Hardcoded Credential Detection', () => {
    it('should detect and reject "test" as database password', () => {
      process.env.POSTGRES_PASSWORD = 'test';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });

    it('should detect and reject "test" as database username', () => {
      process.env.POSTGRES_USER = 'test';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });

    it('should allow legitimate credentials', () => {
      process.env.NODE_ENV = 'development';
      process.env.POSTGRES_USER = 'jasaweb_user';
      process.env.POSTGRES_PASSWORD = 'JwS3cur3P@ss!2024ValidLongPassword';
      process.env.POSTGRES_DB = 'jasaweb_dev';
      process.env.DATABASE_URL =
        'postgresql://jasaweb_user:JwS3cur3P@ss!2024ValidLongPassword@localhost:5432/jasaweb_dev';
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
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
    });

    it('should reject password containing "admin"', () => {
      process.env.POSTGRES_PASSWORD = 'admin123!';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.JWT_SECRET = generateSecureSecret(32);
      process.env.ENCRYPTION_KEY = generateSecureSecret(32);

      expect(() => validateEnvironmentVariables()).toThrow(EnvValidationError);
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

  describe('Validation Error Handling', () => {
    it('should throw EnvValidationError for missing required variables', () => {
      // No JWT_SECRET set - should throw
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
