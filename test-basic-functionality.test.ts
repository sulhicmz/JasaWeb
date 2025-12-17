import { describe, it, expect, beforeAll } from 'vitest';
import {
  validateEnvironmentVariables,
  generateSecureSecret,
} from '@jasaweb/config/env-validation';

describe('Basic Environment Validation Test', () => {
  beforeAll(() => {
    // Set minimal environment for testing
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = generateSecureSecret(32);
    process.env.JWT_REFRESH_SECRET = generateSecureSecret(32);
    process.env.SESSION_SECRET = generateSecureSecret(32);
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
  });

  it('should generate secure secrets with specified length', () => {
    const secret = generateSecureSecret(16);
    expect(secret).toHaveLength(16);
    expect(typeof secret).toBe('string');
  });

  it('should validate basic environment configuration', () => {
    expect(() => validateEnvironmentVariables()).not.toThrow();
  });

  it('should generate different secrets each time', () => {
    const secret1 = generateSecureSecret(16);
    const secret2 = generateSecureSecret(16);
    expect(secret1).not.toBe(secret2);
  });
});
