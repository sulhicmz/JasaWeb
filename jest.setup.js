// Jest setup file for global test configuration
// This file runs before each test file

// Set test timeout for all tests
jest.setTimeout(10000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Setup global test utilities
global.testUtils = {
  // Add any global test utilities here
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  }),
};
