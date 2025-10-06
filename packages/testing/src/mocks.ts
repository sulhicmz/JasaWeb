// Mock utilities for testing

export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockUserWithPassword = {
  ...mockUser,
  password: '$2b$10$9j2h8dK3g4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f',
};

// Function to create mock users with custom properties
export const createMockUser = (overrides = {}) => ({
  id: `user-${Date.now()}`,
  email: `test${Date.now()}@example.com`,
  name: `Test User ${Date.now()}`,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock authentication utilities
export const mockJwtPayload = {
  sub: '1',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};