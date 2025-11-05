# Test Suite

This directory contains shared test utilities, fixtures, and setup files for the JasaWeb project.

## Directory Structure

```
tests/
├── setup.ts              # Global test setup and configuration
├── fixtures/             # Test data and mock objects
│   ├── projects.fixture.ts
│   └── users.fixture.ts
└── utils/                # Test utility functions
    └── test-database.ts  # Database testing utilities
```

## Setup File

The `setup.ts` file configures the global test environment:

- Sets environment variables for testing
- Configures console mocking to reduce noise
- Provides utility functions for date mocking

```typescript
import { mockDate, restoreDate } from '../tests/setup';

// Mock current date
mockDate(new Date('2024-01-01'));

// Restore real date
restoreDate();
```

## Fixtures

Fixtures provide reusable test data:

### Project Fixtures

```typescript
import { createMockProject, mockProjects } from '../tests/fixtures/projects.fixture';

// Create a single mock project
const project = createMockProject({ name: 'Custom Project' });

// Use predefined mock projects
const projects = mockProjects;
```

### User Fixtures

```typescript
import { createMockUser, mockAuthTokens } from '../tests/fixtures/users.fixture';

// Create a mock user
const user = createMockUser({ email: 'custom@example.com' });

// Use mock auth tokens
const { accessToken, refreshToken } = mockAuthTokens;
```

## Database Utilities

The `test-database.ts` file provides utilities for database testing:

```typescript
import {
  getTestDatabase,
  cleanDatabase,
  seedTestData,
  disconnectDatabase,
} from '../tests/utils/test-database';

describe('Database Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should work with test data', async () => {
    const db = getTestDatabase();
    // Use database...
  });
});
```

## Usage in Tests

### Unit Tests

```typescript
import { createMockUser } from '../../../tests/fixtures/users.fixture';

describe('UserService', () => {
  it('should process user', () => {
    const user = createMockUser();
    const result = service.processUser(user);
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
import { cleanDatabase, seedTestData } from '../../../tests/utils/test-database';

describe('User Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  it('should create user in database', async () => {
    // Test with real database
  });
});
```

## Best Practices

1. **Use Fixtures**: Always use fixtures for test data instead of hardcoding values
2. **Clean Database**: Clean the database before each test to ensure isolation
3. **Mock External Services**: Use mocks for external services to keep tests fast
4. **Descriptive Names**: Use descriptive names for test data to make tests readable

## Adding New Fixtures

To add new fixtures:

1. Create a new file in `tests/fixtures/`
2. Export factory functions for creating test data
3. Export predefined mock data if needed

Example:

```typescript
// tests/fixtures/organizations.fixture.ts
export const createMockOrganization = (overrides = {}) => ({
  id: `org-${Date.now()}`,
  name: 'Test Organization',
  slug: 'test-org',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockOrganizations = [
  createMockOrganization({ id: 'org-1', name: 'Org Alpha' }),
  createMockOrganization({ id: 'org-2', name: 'Org Beta' }),
];
```

## Environment Variables

Test environment variables are set in `setup.ts`:

- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret`
- `JWT_REFRESH_SECRET=test-refresh-secret`

Override these in your test files if needed:

```typescript
process.env.CUSTOM_VAR = 'test-value';
```

## Resources

- [Testing Strategy](../docs/testing-strategy.md)
- [Testing Implementation](../docs/testing-implementation.md)
- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)

---

For more information, see the [Testing Implementation Guide](../docs/testing-implementation.md).
