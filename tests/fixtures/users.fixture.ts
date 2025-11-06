export const createMockUser = (overrides = {}) => ({
  id: `user-${Date.now()}`,
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  password: '$2b$10$hashedpassword',
  profilePicture: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUserWithoutPassword = (overrides = {}) => {
  const { password, ...user } = createMockUser(overrides);
  return user;
};

export const mockUsers = [
  createMockUser({ id: 'user-1', email: 'admin@example.com', name: 'Admin User' }),
  createMockUser({ id: 'user-2', email: 'user@example.com', name: 'Regular User' }),
  createMockUser({ id: 'user-3', email: 'guest@example.com', name: 'Guest User' }),
];

export const mockAuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};
