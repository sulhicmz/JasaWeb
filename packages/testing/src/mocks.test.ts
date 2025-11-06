import { describe, it, expect } from 'vitest';
import { mockUser, mockUserWithPassword, createMockUser, mockJwtPayload } from './mocks';

describe('Mock Utilities', () => {
  describe('mockUser', () => {
    it('should have required user properties', () => {
      expect(mockUser).toHaveProperty('id');
      expect(mockUser).toHaveProperty('email');
      expect(mockUser).toHaveProperty('name');
      expect(mockUser).toHaveProperty('isActive');
      expect(mockUser).toHaveProperty('createdAt');
      expect(mockUser).toHaveProperty('updatedAt');
    });

    it('should not have password property', () => {
      expect(mockUser).not.toHaveProperty('password');
    });
  });

  describe('mockUserWithPassword', () => {
    it('should have password property', () => {
      expect(mockUserWithPassword).toHaveProperty('password');
    });

    it('should have bcrypt hashed password format', () => {
      expect(mockUserWithPassword.password).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('createMockUser', () => {
    it('should create user with default properties', () => {
      const user = createMockUser();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
    });

    it('should create unique users on each call', () => {
      const user1 = createMockUser();
      const user2 = createMockUser();
      expect(user1.id).not.toBe(user2.id);
      expect(user1.email).not.toBe(user2.email);
    });

    it('should allow property overrides', () => {
      const customEmail = 'custom@example.com';
      const user = createMockUser({ email: customEmail });
      expect(user.email).toBe(customEmail);
    });

    it('should preserve default properties when overriding', () => {
      const user = createMockUser({ name: 'Custom Name' });
      expect(user.name).toBe('Custom Name');
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('isActive');
    });
  });

  describe('mockJwtPayload', () => {
    it('should have required JWT properties', () => {
      expect(mockJwtPayload).toHaveProperty('sub');
      expect(mockJwtPayload).toHaveProperty('email');
      expect(mockJwtPayload).toHaveProperty('iat');
      expect(mockJwtPayload).toHaveProperty('exp');
    });

    it('should have valid expiration time', () => {
      const now = Math.floor(Date.now() / 1000);
      expect(mockJwtPayload.exp).toBeGreaterThan(now);
    });

    it('should have issued at time in the past or present', () => {
      const now = Math.floor(Date.now() / 1000);
      expect(mockJwtPayload.iat).toBeLessThanOrEqual(now);
    });
  });
});
