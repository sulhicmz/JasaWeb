// Vitest setup file for test environment
import { vi } from 'vitest';

// Set up Reflect for NestJS decorators - this must be loaded first
import 'reflect-metadata';

// Import centralized testing utilities
import { TestConfigHelper } from '@jasaweb/testing';

// Set up test environment
TestConfigHelper.setupTestEnvironment();

// Ensure vitest globals are available
const globalVitest = global as typeof globalThis & {
  describe?: typeof describe;
  it?: typeof it;
  test?: typeof test;
  expect?: typeof expect;
  beforeAll?: typeof beforeAll;
  afterAll?: typeof afterAll;
  beforeEach?: typeof beforeEach;
  afterEach?: typeof afterEach;
};

globalVitest.describe = globalVitest.describe || describe;
globalVitest.it = globalVitest.it || it;
globalVitest.test = globalVitest.test || test;
globalVitest.expect = globalVitest.expect || expect;
globalVitest.beforeAll = globalVitest.beforeAll || beforeAll;
globalVitest.afterAll = globalVitest.afterAll || afterAll;
globalVitest.beforeEach = globalVitest.beforeEach || beforeEach;
globalVitest.afterEach = globalVitest.afterAll || afterEach;

// Provide Jest compatibility for existing tests
beforeAll(() => {
  // Create global jest object with vi methods
  (global as Record<string, unknown>).jest = {
    fn: vi.fn,
    mock: vi.mock,
    spyOn: vi.spyOn,
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
    useFakeTimers: vi.useFakeTimers,
    useRealTimers: vi.useRealTimers,
    advanceTimersByTime: vi.advanceTimersByTime,
    runOnlyPendingTimers: vi.runOnlyPendingTimers,
    runAllTimers: vi.runAllTimers,
  };
});

// NOTE: Prisma and other module mocks have been moved to @jasaweb/testing
// Import the testing package to get access to all mock setups

// NOTE: All module mocks (bcrypt, @nestjs/*, passport, etc.) have been moved to @jasaweb/testing
// Import the testing package to get access to all mock setups
import '@jasaweb/testing';

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';

// Export empty to make this a module
export {};
