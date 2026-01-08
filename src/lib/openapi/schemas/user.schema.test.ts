import { describe, it, expect } from 'vitest';
import {
  isUserData,
  isLoginFormData,
  isRegisterFormData,
  isUserRole,
  type UserData,
  type LoginFormData,
  type RegisterFormData
} from './user.schema';

describe('User Schema Type Guards', () => {
  describe('isUserData', () => {
    it('should identify valid user data', () => {
      const validUser: UserData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: 'John Doe',
        phone: '+62812345678',
        role: 'client',
        createdAt: '2025-01-01T00:00:00Z'
      };
      expect(isUserData(validUser)).toBe(true);
    });

    it('should reject invalid user role', () => {
      const invalidUser = {
        id: '123',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'invalid'
      };
      expect(isUserData(invalidUser)).toBe(false);
    });

    it('should reject user data missing required fields', () => {
      const invalidUser = {
        id: '123',
        email: 'user@example.com'
      };
      expect(isUserData(invalidUser)).toBe(false);
    });

    it('should accept user data without phone field', () => {
      const validUser: UserData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: 'John Doe',
        phone: null,
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z'
      };
      expect(isUserData(validUser)).toBe(true);
    });
  });

  describe('isUserRole', () => {
    it('should accept valid admin role', () => {
      expect(isUserRole('admin')).toBe(true);
    });

    it('should accept valid client role', () => {
      expect(isUserRole('client')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(isUserRole('superadmin')).toBe(false);
      expect(isUserRole('moderator')).toBe(false);
      expect(isUserRole('')).toBe(false);
    });
  });

  describe('isLoginFormData', () => {
    it('should identify valid login form data', () => {
      const validLogin: LoginFormData = {
        email: 'user@example.com',
        password: 'password123'
      };
      expect(isLoginFormData(validLogin)).toBe(true);
    });

    it('should reject login data missing email', () => {
      const invalidLogin = {
        password: 'password123'
      };
      expect(isLoginFormData(invalidLogin)).toBe(false);
    });

    it('should reject login data missing password', () => {
      const invalidLogin = {
        email: 'user@example.com'
      };
      expect(isLoginFormData(invalidLogin)).toBe(false);
    });

    it('should reject non-string values', () => {
      const invalidLogin = {
        email: 123,
        password: 'test'
      };
      expect(isLoginFormData(invalidLogin)).toBe(false);
    });
  });

  describe('isRegisterFormData', () => {
    it('should identify valid registration data', () => {
      const validRegister: RegisterFormData = {
        name: 'John Doe',
        email: 'user@example.com',
        phone: '+62812345678',
        password: 'password123'
      };
      expect(isRegisterFormData(validRegister)).toBe(true);
    });

    it('should accept registration data without phone', () => {
      const validRegister: RegisterFormData = {
        name: 'John Doe',
        email: 'user@example.com',
        password: 'password123'
      };
      expect(isRegisterFormData(validRegister)).toBe(true);
    });

    it('should reject registration data missing name', () => {
      const invalidRegister = {
        email: 'user@example.com',
        password: 'password123'
      };
      expect(isRegisterFormData(invalidRegister)).toBe(false);
    });

    it('should reject registration data with empty name', () => {
      const invalidRegister = {
        name: '',
        email: 'user@example.com',
        password: 'password123'
      };
      expect(isRegisterFormData(invalidRegister)).toBe(false);
    });
  });

  describe('Schema Consistency', () => {
    it('should ensure user data matches all required fields', () => {
      const user: UserData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: 'John Doe',
        phone: '+62812345678',
        role: 'client',
        createdAt: '2025-01-01T00:00:00Z'
      };

      expect(isUserData(user)).toBe(true);
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('createdAt');
    });

    it('should ensure form data has required string fields', () => {
      const loginData: LoginFormData = {
        email: 'user@example.com',
        password: 'password123'
      };

      expect(isLoginFormData(loginData)).toBe(true);
      expect(typeof loginData.email).toBe('string');
      expect(typeof loginData.password).toBe('string');
    });
  });
});
