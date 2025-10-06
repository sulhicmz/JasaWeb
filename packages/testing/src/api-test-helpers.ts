// API testing helpers

import { HttpStatus } from '@nestjs/common';

export interface ApiResponse<T = any> {
  status: number;
  body: T;
  headers: Record<string, string>;
}

/**
 * Creates an authenticated request for API tests
 */
export const createAuthenticatedRequest = (
  baseUrl: string,
  token: string
): any => {
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    baseUrl,
  };
};

/**
 * Creates a mock request object for NestJS controllers
 */
export const createMockRequest = (overrides: any = {}) => {
  return {
    user: null,
    headers: {},
    params: {},
    query: {},
    body: {},
    ...overrides,
  };
};

/**
 * Creates a mock response object for NestJS controllers
 */
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  res.redirect = jest.fn().mockReturnThis();
  return res;
};

/**
 * Validates common API response structures
 */
export const validateApiResponse = <T>(
  response: ApiResponse<T>,
  expectedStatus: HttpStatus
) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
  expect(response.headers).toBeDefined();
};

/**
 * Helper to validate JWT tokens
 * Note: In a real implementation, this would include proper JWT validation
 */
export const validateJwtToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic format check (header.payload.signature)
  return token.split('.').length === 3;
};