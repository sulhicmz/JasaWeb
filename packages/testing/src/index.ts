// Testing utilities for JasaWeb
export const createMockConfig = () => ({
  app: {
    name: 'Test App',
    env: 'test' as const,
    port: 3000,
    url: 'http://localhost:3000',
  },
  // Add other mock configurations as needed
});

export const createTestUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
});

export const createTestOrganization = () => ({
  id: 'test-org-id',
  name: 'Test Organization',
  billingEmail: 'billing@test.com',
});
