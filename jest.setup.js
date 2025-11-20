// Jest setup file for JasaWeb monorepo
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Add custom matchers or global test utilities here
// Example: global.testUtils = { ... };
