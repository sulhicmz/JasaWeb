# Testing Implementation Guide

## Overview

This document provides a comprehensive guide to the testing implementation in the JasaWeb project. It covers the test structure, how to run tests, and best practices for writing new tests.

## Test Structure

### Directory Layout

```
jasaweb/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.service.spec.ts          # Unit tests
│   │   │   ├── projects/
│   │   │   │   ├── project.service.ts
│   │   │   │   └── project.service.spec.ts       # Unit tests
│   │   │   └── app.service.spec.ts
│   │   └── test/
│   │       ├── integration/
│   │       │   └── projects.integration.spec.ts  # Integration tests
│   │       ├── e2e/
│   │       │   └── auth.e2e-spec.ts             # E2E tests
│   │       └── jest-e2e.json                     # E2E Jest config
│   └── web/
│       └── tests/
│           └── e2e/                              # Playwright tests
├── packages/
│   └── testing/
│       └── src/
│           ├── test-helpers.ts                   # Test utilities
│           ├── test-helpers.test.ts              # Tests for utilities
│           ├── mocks.ts                          # Mock data
│           ├── mocks.test.ts                     # Tests for mocks
│           └── api-test-helpers.ts               # API test helpers
└── tests/
    ├── setup.ts                                  # Global test setup
    ├── fixtures/
    │   ├── projects.fixture.ts                   # Project test data
    │   └── users.fixture.ts                      # User test data
    └── utils/
        └── test-database.ts                      # Database test utilities
```

## Test Types

### 1. Unit Tests

Unit tests are located next to the source files with `.spec.ts` extension.

**Example: Testing a Service**

```typescript
// apps/api/src/projects/project.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectService],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

**Running Unit Tests:**

```bash
# Run all unit tests
pnpm test

# Run unit tests for API
cd apps/api && pnpm test

# Run specific test file
pnpm test auth.service.spec.ts

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

### 2. Integration Tests

Integration tests verify that multiple components work together correctly.

**Example: Testing API Endpoints**

```typescript
// apps/api/test/integration/projects.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Projects Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/projects (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/projects')
      .expect(200);
  });
});
```

**Running Integration Tests:**

```bash
# Run integration tests
cd apps/api && pnpm test:integration

# Run with database
DATABASE_URL="postgresql://..." pnpm test:integration
```

### 3. End-to-End (E2E) Tests

E2E tests verify complete user workflows.

**Example: Testing Authentication Flow**

```typescript
// apps/api/test/e2e/auth.e2e-spec.ts
describe('Authentication (e2e)', () => {
  it('should register and login user', async () => {
    // Register
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      })
      .expect(201);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('access_token');
  });
});
```

**Running E2E Tests:**

```bash
# Run E2E tests
cd apps/api && pnpm test:e2e

# Run with test database
DATABASE_URL="postgresql://..." pnpm test:e2e
```

## Test Utilities

### Test Helpers

Located in `packages/testing/src/test-helpers.ts`:

```typescript
import { waitForCondition, generateRandomEmail } from '@jasaweb/testing';

// Wait for async condition
await waitForCondition(() => user.isActive, 5000);

// Generate test data
const email = generateRandomEmail();
```

### Mock Data

Located in `packages/testing/src/mocks.ts`:

```typescript
import { createMockUser, mockJwtPayload } from '@jasaweb/testing';

// Create mock user
const user = createMockUser({ email: 'custom@example.com' });

// Use predefined mocks
const payload = mockJwtPayload;
```

### Test Fixtures

Located in `tests/fixtures/`:

```typescript
import { createMockProject } from '../../../tests/fixtures/projects.fixture';

const project = createMockProject({
  name: 'Custom Project',
  status: 'active',
});
```

### Database Utilities

Located in `tests/utils/test-database.ts`:

```typescript
import { cleanDatabase, seedTestData } from '../../../tests/utils/test-database';

beforeEach(async () => {
  await cleanDatabase();
  await seedTestData();
});
```

## Running Tests

### All Tests

```bash
# Run all tests in the monorepo
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in UI mode
pnpm test:ui
```

### API Tests

```bash
# All API tests
cd apps/api && pnpm test

# Unit tests only
cd apps/api && pnpm test:unit

# Integration tests
cd apps/api && pnpm test:integration

# E2E tests
cd apps/api && pnpm test:e2e

# With coverage
cd apps/api && pnpm test:cov
```

### Web Tests

```bash
# Run web tests
cd apps/web && pnpm test

# Run Playwright E2E tests
cd apps/web && pnpm test:e2e
```

### Package Tests

```bash
# Test testing utilities
cd packages/testing && pnpm test

# Test UI components
cd packages/ui && pnpm test
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Overall**: 80%
- **API Services**: 90%
- **API Controllers**: 85%
- **Shared Packages**: 85%

### Viewing Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html
```

## CI/CD Integration

Tests run automatically in GitHub Actions:

### On Push to develop/main
- Unit tests
- Integration tests
- E2E tests
- Coverage reporting

### On Pull Request
- All tests
- Coverage comparison
- Performance tests
- Accessibility tests

### Daily Schedule
- Comprehensive test suite
- Security tests
- Load tests

## Best Practices

### 1. Test Naming

```typescript
// ✅ Good
describe('ProjectService', () => {
  describe('create', () => {
    it('should create project with valid data', () => {});
    it('should throw error when name is missing', () => {});
  });
});

// ❌ Bad
describe('test', () => {
  it('works', () => {});
});
```

### 2. Test Structure (AAA Pattern)

```typescript
it('should update project status', async () => {
  // Arrange
  const project = await createTestProject();
  const updateData = { status: 'completed' };

  // Act
  const result = await projectService.update(project.id, updateData);

  // Assert
  expect(result.status).toBe('completed');
});
```

### 3. Mock External Dependencies

```typescript
// Mock Prisma
const mockPrismaService = {
  project: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// Mock external APIs
jest.mock('nodemailer');
```

### 4. Clean Up After Tests

```typescript
afterEach(async () => {
  await cleanDatabase();
  jest.clearAllMocks();
});

afterAll(async () => {
  await disconnectDatabase();
});
```

### 5. Use Test Fixtures

```typescript
import { createMockProject } from '../../../tests/fixtures/projects.fixture';

const project = createMockProject({ status: 'active' });
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Ensure test database is running
docker-compose up -d postgres

# Check connection
psql postgresql://postgres:postgres@localhost:5432/jasaweb_test
```

#### 2. Test Timeouts

```typescript
// Increase timeout for slow tests
it('should handle slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### 3. Flaky Tests

```typescript
// Use proper waiting strategies
await waitForCondition(() => element.isVisible(), 5000);

// Avoid hardcoded delays
// ❌ await sleep(1000);
// ✅ await waitForCondition(() => condition, 5000);
```

#### 4. Mock Issues

```typescript
// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

// Reset mock implementation
mockService.method.mockReset();
```

## Writing New Tests

### Step 1: Create Test File

```bash
# For unit tests, create next to source file
touch apps/api/src/feature/feature.service.spec.ts

# For integration tests
touch apps/api/test/integration/feature.integration.spec.ts

# For E2E tests
touch apps/api/test/e2e/feature.e2e-spec.ts
```

### Step 2: Set Up Test Module

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureService } from './feature.service';

describe('FeatureService', () => {
  let service: FeatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeatureService],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
  });

  // Tests here
});
```

### Step 3: Write Tests

```typescript
describe('methodName', () => {
  it('should handle success case', async () => {
    // Arrange
    const input = { /* test data */ };

    // Act
    const result = await service.methodName(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.property).toBe(expectedValue);
  });

  it('should handle error case', async () => {
    // Arrange
    const invalidInput = { /* invalid data */ };

    // Act & Assert
    await expect(service.methodName(invalidInput)).rejects.toThrow(ErrorType);
  });
});
```

### Step 4: Run Tests

```bash
# Run your new tests
pnpm test feature.service.spec.ts

# Check coverage
pnpm test:cov
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-testing-mistakes)

## Support

For questions or issues:
- Check [Testing Strategy](./testing-strategy.md)
- Open an issue on GitHub
- Contact the development team

---

**Last Updated**: 2025-11-05
**Maintained By**: JasaWeb Development Team
