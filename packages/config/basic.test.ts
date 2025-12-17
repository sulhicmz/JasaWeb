import { describe, it, expect, beforeAll } from 'vitest';
import { generateSecureSecret } from './env-validation';

describe('Basic Functionality Test', () => {
  it('should generate secure secrets with specified length', () => {
    const secret = generateSecureSecret(16);
    expect(secret).toHaveLength(16);
    expect(typeof secret).toBe('string');
    // Test that it contains only alphanumeric characters
    expect(/^[a-zA-Z0-9]+$/.test(secret)).toBe(true);
  });

  it('should generate different secrets each time', () => {
    const secret1 = generateSecureSecret(16);
    const secret2 = generateSecureSecret(16);
    expect(secret1).not.toBe(secret2);
  });

  it('should generate secrets of different lengths', () => {
    const secret8 = generateSecureSecret(8);
    const secret32 = generateSecureSecret(32);
    expect(secret8).toHaveLength(8);
    expect(secret32).toHaveLength(32);
  });
});
