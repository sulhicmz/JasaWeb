// Global test setup
import 'jest-extended';

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

// Set default timeout for async operations
jest.setTimeout(10000);

// Global test utilities
global.createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'test-hash-pass',
  profilePicture: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

global.createMockProject = (overrides = {}) => ({
  id: '1',
  name: 'Test Project',
  status: 'active',
  startAt: new Date(),
  dueAt: new Date(),
  organizationId: 'org1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
