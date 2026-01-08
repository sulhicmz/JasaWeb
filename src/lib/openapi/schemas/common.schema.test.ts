import { describe, it, expect } from 'vitest';
import {
  isApiResponse,
  isErrorResponse,
  isPaginatedResponse,
  type ApiResponseData,
  type ErrorResponseData,
  type PaginatedResponseData
} from './common.schema';

describe('Common Schema Type Guards', () => {
  describe('isApiResponse', () => {
    it('should identify valid API responses', () => {
      const validResponse: ApiResponseData = {
        success: true,
        data: { id: '123', name: 'test' },
        error: null,
        message: 'Operation successful'
      };
      expect(isApiResponse(validResponse)).toBe(true);
    });

    it('should reject invalid responses missing success field', () => {
      const invalidResponse = {
        data: { id: '123' },
        message: 'test'
      };
      expect(isApiResponse(invalidResponse)).toBe(false);
    });

    it('should reject non-object data', () => {
      expect(isApiResponse(null)).toBe(false);
      expect(isApiResponse('string')).toBe(false);
      expect(isApiResponse(123)).toBe(false);
    });
  });

  describe('isErrorResponse', () => {
    it('should identify valid error responses', () => {
      const validError: ErrorResponseData = {
        success: false,
        error: 'Validation failed',
        message: 'Invalid input'
      };
      expect(isErrorResponse(validError)).toBe(true);
    });

    it('should reject responses with success: true', () => {
      const invalidError = {
        success: true,
        error: 'Validation failed'
      };
      expect(isErrorResponse(invalidError)).toBe(false);
    });

    it('should reject responses missing error field', () => {
      const invalidError = {
        success: false,
        message: 'test'
      };
      expect(isErrorResponse(invalidError)).toBe(false);
    });
  });

  describe('isPaginatedResponse', () => {
    it('should identify valid paginated responses', () => {
      const validPaginated: PaginatedResponseData = {
        success: true,
        data: [{ id: '1' }, { id: '2' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5
        }
      };
      expect(isPaginatedResponse(validPaginated)).toBe(true);
    });

    it('should reject responses without pagination', () => {
      const invalidPaginated = {
        success: true,
        data: [{ id: '1' }]
      };
      expect(isPaginatedResponse(invalidPaginated)).toBe(false);
    });

    it('should reject responses with non-array data', () => {
      const invalidPaginated = {
        success: true,
        data: { id: '1' },
        pagination: { page: 1, limit: 10, total: 50, totalPages: 5 }
      };
      expect(isPaginatedResponse(invalidPaginated)).toBe(false);
    });
  });

  describe('Schema Consistency', () => {
    it('should ensure ApiResponse schema matches interface properties', () => {
      const response: ApiResponseData = {
        success: true,
        data: null,
        error: null,
        message: null
      };
      
      expect(isApiResponse(response)).toBe(true);
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('message');
    });

    it('should ensure ErrorResponse schema extends ApiResponse', () => {
      const error: ErrorResponseData = {
        success: false,
        error: 'test error'
      };
      
      expect(isApiResponse(error)).toBe(true);
      expect(isErrorResponse(error)).toBe(true);
    });

    it('should ensure PaginatedResponse has required pagination fields', () => {
      const paginated: PaginatedResponseData = {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
      
      expect(isPaginatedResponse(paginated)).toBe(true);
      expect(paginated.pagination).toHaveProperty('page');
      expect(paginated.pagination).toHaveProperty('limit');
      expect(paginated.pagination).toHaveProperty('total');
      expect(paginated.pagination).toHaveProperty('totalPages');
    });
  });
});
