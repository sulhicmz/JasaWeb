# Testing Guide

This document provides guidelines and instructions for testing the JasaWeb API application.

## Overview

The API application uses **Jest** as the testing framework with TypeScript support via `ts-jest`. The testing infrastructure is set up to provide comprehensive unit testing for core services and components.

## Test Structure

```
apps/api/
├── src/
│   ├── auth/
│   │   ├── auth.service.spec.ts
│   ├── users/
│   │   ├── users.service.spec.ts
│   ├── projects/
│   │   ├── project.service.spec.ts
│   ├── app.controller.spec.ts
└── test/
    ├── jest.config.js
    └── setup.ts
```

## Running Tests

### Run All Tests

```bash
npm run test:api
# or from the API directory
cd apps/api && npm test
```

### Run Tests in Watch Mode

```bash
cd apps/api && npm run test:watch
```

### Generate Coverage Report

```bash
cd apps/api && npm run test:cov
```

### Run Specific Test File

```bash
cd apps/api && npx jest auth.service.spec.ts
```

## Test Configuration

The Jest configuration is located in `apps/api/test/jest.config.js` and includes:

- **TypeScript Support**: Full TypeScript compilation with `ts-jest`
- **Coverage Reports**: Text, LCOV, and HTML formats
- **Test Environment**: Node.js environment for backend testing
- **Mock Setup**: Automatic mocking for external dependencies
- **Coverage Collection**: Excludes DTOs, entities, and interface files

## Test Setup

Global test setup is handled in `apps/api/test/setup.ts`:

- **Prisma Mock**: Mocked Prisma Client for database operations
- **UUID Mock**: Consistent UUID generation for tests
- **Bcrypt Mock**: Password hashing/comparison mocking
- **Environment Variables**: Test-specific configuration

## Writing Tests

### Service Testing Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { DependencyService } from '../dependency/dependency.service';

describe('YourService', () => {
  let service: YourService;
  let dependencyService: DependencyService;

  const mockDependencyService = {
    // Mock methods here
    method: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: DependencyService,
          useValue: mockDependencyService,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    dependencyService = module.get<DependencyService>(DependencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('specificMethod', () => {
    it('should perform expected behavior', async () => {
      // Arrange
      mockDependencyService.method.mockResolvedValue('mocked-result');

      // Act
      const result = await service.specificMethod();

      // Assert
      expect(dependencyService.method).toHaveBeenCalled();
      expect(result).toBe('expected-result');
    });
  });
});
```

### Best Practices

1. **Mock External Dependencies**: Always mock databases, external APIs, and services
2. **Test Happy Path**: Verify normal operation scenarios
3. **Test Error Cases**: Ensure proper error handling
4. **Use Descriptive Names**: Clear test descriptions that explain the scenario
5. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification
6. **Clean Up**: Use `afterEach` to reset mocks between tests

## Coverage Guidelines

- **Target Coverage**: Aim for ≥80% coverage on critical business logic
- **Exclude Files**: DTOs, entities, interfaces, and configuration files are excluded
- **Focus Areas**: Prioritize testing for:
  - Authentication and authorization logic
  - Business logic in services
  - Data validation and transformation
  - Error handling

## Current Test Coverage

The API currently has **43 passing tests** covering:

- **AuthService** (13 tests): Registration, login, user validation, error handling
- **UsersService** (13 tests): CRUD operations, password hashing, user management
- **ProjectService** (13 tests): Project lifecycle, statistics, business logic
- **AppController** (4 tests): Basic application endpoints

## Mock Strategy

### Prisma Client

```typescript
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // ... other models
  })),
}));
```

### UUID Generation

```typescript
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));
```

### Password Hashing

```typescript
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));
```

## CI/CD Integration

Tests are configured to run automatically in CI/CD pipelines:

```bash
# Run tests with coverage
npm run test:api

# Generate coverage reports for CI
npm run test:cov
```

## Troubleshooting

### Common Issues

1. **Module Not Found**: Ensure all dependencies are installed

   ```bash
   cd apps/api && npm install
   ```

2. **TypeScript Errors**: Check that test files match the source file types
3. **Mock Failures**: Verify mock setup in `test/setup.ts`
4. **Timeout Issues**: Increase test timeout if needed in `jest.config.js`

### Debug Mode

Run tests with Node.js debugging:

```bash
cd apps/api && npm run test:debug
```

## Future Testing Plans

- **Integration Tests**: API endpoint testing with Supertest
- **E2E Tests**: Full workflow testing
- **Contract Tests**: API contract validation
- **Performance Tests**: Load and stress testing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [TypeScript Jest Configuration](https://kulshekhar.github.io/ts-jest/docs/getting-started/installation)
