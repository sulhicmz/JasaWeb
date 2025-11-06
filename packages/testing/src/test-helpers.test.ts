import { describe, it, expect } from 'vitest';
import {
  waitForCondition,
  generateRandomString,
  generateRandomEmail,
  expectStatus,
  expectApiSuccessResponse,
  expectApiErrorResponse,
} from './test-helpers';
import { HttpStatus } from '@nestjs/common';

describe('Test Helpers', () => {
  describe('waitForCondition', () => {
    it('should resolve when condition becomes true', async () => {
      let counter = 0;
      const condition = () => {
        counter++;
        return counter >= 3;
      };

      await expect(waitForCondition(condition, 1000, 50)).resolves.toBeUndefined();
      expect(counter).toBeGreaterThanOrEqual(3);
    });

    it('should timeout when condition never becomes true', async () => {
      const condition = () => false;

      await expect(waitForCondition(condition, 100, 10)).rejects.toThrow(
        'Condition not met within 100ms',
      );
    });

    it('should handle async conditions', async () => {
      let counter = 0;
      const condition = async () => {
        counter++;
        return counter >= 2;
      };

      await expect(waitForCondition(condition, 1000, 50)).resolves.toBeUndefined();
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of specified length', () => {
      const result = generateRandomString(10);
      expect(result).toHaveLength(10);
    });

    it('should generate different strings on each call', () => {
      const result1 = generateRandomString(20);
      const result2 = generateRandomString(20);
      expect(result1).not.toBe(result2);
    });

    it('should only contain alphanumeric characters', () => {
      const result = generateRandomString(50);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('generateRandomEmail', () => {
    it('should generate valid email format', () => {
      const email = generateRandomEmail();
      expect(email).toMatch(/^[A-Za-z0-9]+@[A-Za-z0-9]+\.com$/);
    });

    it('should generate different emails on each call', () => {
      const email1 = generateRandomEmail();
      const email2 = generateRandomEmail();
      expect(email1).not.toBe(email2);
    });
  });

  describe('expectStatus', () => {
    it('should pass when status matches', () => {
      const response = { status: 200 };
      expect(() => expectStatus(response, HttpStatus.OK)).not.toThrow();
    });

    it('should fail when status does not match', () => {
      const response = { status: 404 };
      expect(() => expectStatus(response, HttpStatus.OK)).toThrow();
    });
  });

  describe('expectApiSuccessResponse', () => {
    it('should pass for valid success response', () => {
      const response = {
        status: 200,
        body: { data: 'test' },
      };
      expect(() => expectApiSuccessResponse(response)).not.toThrow();
    });

    it('should validate required fields', () => {
      const response = {
        status: 200,
        body: { id: '123', name: 'Test' },
      };
      expect(() => expectApiSuccessResponse(response, ['id', 'name'])).not.toThrow();
    });

    it('should fail when required fields are missing', () => {
      const response = {
        status: 200,
        body: { id: '123' },
      };
      expect(() => expectApiSuccessResponse(response, ['id', 'name'])).toThrow();
    });
  });

  describe('expectApiErrorResponse', () => {
    it('should pass for valid error response', () => {
      const response = {
        status: 400,
        body: {
          message: 'Error message',
          error: 'Bad Request',
          statusCode: 400,
        },
      };
      expect(() => expectApiErrorResponse(response)).not.toThrow();
    });

    it('should validate specific status code', () => {
      const response = {
        status: 404,
        body: {
          message: 'Not found',
          error: 'Not Found',
          statusCode: 404,
        },
      };
      expect(() => expectApiErrorResponse(response, HttpStatus.NOT_FOUND)).not.toThrow();
    });

    it('should fail when error structure is invalid', () => {
      const response = {
        status: 400,
        body: { data: 'test' },
      };
      expect(() => expectApiErrorResponse(response)).toThrow();
    });
  });
});
