// Common test helpers and utilities

import { HttpStatus } from '@nestjs/common';

/**
 * Waits for a specific condition to be true
 */
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 10000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

/**
 * Generates a random string of specified length
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generates a random email
 */
export const generateRandomEmail = (): string => {
  return `${generateRandomString(10)}@${generateRandomString(5)}.com`;
};

/**
 * Validates that a response has the expected status code
 */
export const expectStatus = (response: any, expectedStatus: HttpStatus) => {
  expect(response.status).toBe(expectedStatus);
};

/**
 * Validates that an API response has the required fields
 */
export const expectApiSuccessResponse = (response: any, expectedFields: string[] = []) => {
  expect(response.status).toBe(HttpStatus.OK);
  expect(response.body).toBeDefined();
  
  if (expectedFields.length > 0) {
    expectedFields.forEach(field => {
      expect(response.body).toHaveProperty(field);
    });
  }
};

/**
 * Validates that an API response has an error structure
 */
export const expectApiErrorResponse = (response: any, expectedStatus?: HttpStatus) => {
  expect(response.status).toBe(expectedStatus || HttpStatus.BAD_REQUEST);
  expect(response.body).toBeDefined();
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('error');
  expect(response.body).toHaveProperty('statusCode');
};