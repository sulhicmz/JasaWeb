import { beforeAll, afterAll, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

  // Mock console methods to reduce noise in test output
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global teardown
afterAll(() => {
  // Restore console
  jest.restoreAllMocks();
});

// Export test utilities
export const mockDate = (date: Date) => {
  jest.useFakeTimers();
  jest.setSystemTime(date);
};

export const restoreDate = () => {
  jest.useRealTimers();
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
