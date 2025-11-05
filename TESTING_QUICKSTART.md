# Testing Quick Start Guide

## 🚀 Get Started with Testing in 5 Minutes

This guide will help you quickly understand and run the tests in the JasaWeb project.

## Prerequisites

```bash
# Ensure you have dependencies installed
pnpm install

# Ensure test database is running (for integration/e2e tests)
docker-compose up -d postgres
```

## Running Tests

### 1. Run All Tests (Fastest)

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage
```

### 2. Run API Tests

```bash
cd apps/api

# Unit tests only (fast)
pnpm test

# Integration tests (requires database)
pnpm test:integration

# E2E tests (requires database)
pnpm test:e2e

# All tests with coverage
pnpm test:cov
```

### 3. Run Specific Tests

```bash
# Run a specific test file
pnpm test auth.service.spec.ts

# Run tests matching a pattern
pnpm test --grep "ProjectService"

# Run in watch mode (auto-rerun on changes)
pnpm test:watch
```

### 4. View Coverage

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML report in browser
open coverage/index.html
```

## Test Structure Overview

```
📁 Unit Tests (*.spec.ts)
   Located next to source files
   Example: apps/api/src/auth/auth.service.spec.ts

📁 Integration Tests
   Located in apps/api/test/integration/
   Example: projects.integration.spec.ts

📁 E2E Tests
   Located in apps/api/test/e2e/
   Example: auth.e2e-spec.ts

📁 Test Utilities
   Located in packages/testing/src/
   Reusable helpers and mocks
```

## Writing Your First Test

### 1. Create Test File

```bash
# For a service
touch apps/api/src/feature/feature.service.spec.ts
```

### 2. Basic Test Template

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      const input = { data: 'test' };

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toBe('test');
    });

    it('should handle error case', async () => {
      // Arrange
      const invalidInput = null;

      // Act & Assert
      await expect(service.methodName(invalidInput))
        .rejects.toThrow('Expected error message');
    });
  });
});
```

### 3. Using Test Utilities

```typescript
import { createMockUser } from '../../../tests/fixtures/users.fixture';
import { createMockProject } from '../../../tests/fixtures/projects.fixture';

describe('FeatureService', () => {
  it('should work with mock data', () => {
    // Use fixtures for test data
    const user = createMockUser({ email: 'test@example.com' });
    const project = createMockProject({ name: 'Test Project' });

    // Your test logic here
  });
});
```

### 4. Run Your Test

```bash
pnpm test feature.service.spec.ts
```

## Common Test Patterns

### Testing with Mocks

```typescript
const mockRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

beforeEach(() => {
  mockRepository.findOne.mockResolvedValue(mockData);
});
```

### Testing Async Operations

```typescript
it('should handle async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});
```

### Testing Error Cases

```typescript
it('should throw error for invalid input', async () => {
  await expect(service.method(invalidInput))
    .rejects.toThrow(BadRequestException);
});
```

### Testing with Database

```typescript
import { cleanDatabase, seedTestData } from '../../../tests/utils/test-database';

beforeEach(async () => {
  await cleanDatabase();
  await seedTestData();
});
```

## Test Coverage Goals

| Component | Target | Status |
|-----------|--------|--------|
| Overall | 80% | 🟡 In Progress |
| API Services | 90% | 🟢 Complete |
| API Controllers | 85% | 🟡 Pending |
| Shared Packages | 85% | 🟢 Complete |

## Troubleshooting

### Tests Failing?

```bash
# Clear cache and reinstall
rm -rf node_modules coverage
pnpm install

# Ensure database is running
docker-compose up -d postgres

# Check database connection
psql postgresql://postgres:postgres@localhost:5432/jasaweb_test
```

### Slow Tests?

```bash
# Run only unit tests (fastest)
pnpm test --testPathIgnorePatterns=integration,e2e

# Run tests in parallel
pnpm test --maxWorkers=4
```

### Coverage Not Updating?

```bash
# Clear coverage cache
rm -rf coverage .nyc_output

# Regenerate coverage
pnpm test:coverage
```

## CI/CD Integration

Tests run automatically on:
- ✅ Every push to `develop` or `main`
- ✅ Every pull request
- ✅ Daily at 1 AM UTC
- ✅ Manual workflow dispatch

View results in GitHub Actions tab.

## Next Steps

1. **Read Full Documentation**
   - [Testing Strategy](docs/testing-strategy.md)
   - [Testing Implementation](docs/testing-implementation.md)
   - [Test Checklist](docs/test-checklist.md)

2. **Explore Existing Tests**
   - `apps/api/src/auth/auth.service.spec.ts` - Unit test example
   - `apps/api/test/integration/projects.integration.spec.ts` - Integration test
   - `apps/api/test/e2e/auth.e2e-spec.ts` - E2E test example

3. **Use Test Utilities**
   - `packages/testing/src/test-helpers.ts` - Helper functions
   - `tests/fixtures/` - Test data factories
   - `tests/utils/` - Database utilities

## Quick Reference

```bash
# Most Common Commands
pnpm test                    # Run all tests
pnpm test:coverage          # Run with coverage
pnpm test:watch             # Watch mode
pnpm test auth.service      # Run specific test

# API Tests
cd apps/api
pnpm test                   # Unit tests
pnpm test:integration       # Integration tests
pnpm test:e2e              # E2E tests

# Coverage
pnpm test:coverage          # Generate report
open coverage/index.html    # View report
```

## Getting Help

- 📖 **Documentation**: Check `docs/` directory
- 🐛 **Issues**: Open a GitHub issue
- 💬 **Discussions**: Ask in team chat
- 📧 **Contact**: Reach out to development team

---

**Happy Testing! 🧪**

For detailed information, see [Testing Implementation Guide](docs/testing-implementation.md).
