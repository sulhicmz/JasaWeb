/**
 * Shared testing utilities for JasaWeb
 */

export const testHelpers = {
  /**
   * Create a mock user for testing
   */
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    organizationId: 'test-org-id',
    ...overrides,
  }),

  /**
   * Create a mock project for testing
   */
  createMockProject: (overrides = {}) => ({
    id: 'test-project-id',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    organizationId: 'test-org-id',
    ...overrides,
  }),

  /**
   * Wait for async operations
   */
  wait: (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/**
 * Test database utilities
 */
export const dbHelpers = {
  /**
   * Clean up test database
   */
  cleanup: async () => {
    // Implementation would depend on your test database setup
    console.log('Cleaning up test database...');
  },

  /**
   * Seed test data
   */
  seed: async (data: any) => {
    // Implementation would depend on your test database setup
    console.log('Seeding test data:', data);
  },
};

/**
 * Common test matchers
 */
export const matchers = {
  /**
   * Check if object has required fields
   */
  hasRequiredFields: (obj: any, fields: string[]) => {
    return fields.every((field) => obj.hasOwnProperty(field));
  },

  /**
   * Check if response has proper API structure
   */
  isValidApiResponse: (response: any) => {
    return response && typeof response === 'object' && 'data' in response;
  },
};
