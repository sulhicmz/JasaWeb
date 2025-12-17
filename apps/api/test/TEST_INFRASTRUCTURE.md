# JasaWeb Test Infrastructure Documentation

## Overview

JasaWeb uses Vitest for testing with a comprehensive mock setup for all external dependencies. The test infrastructure is designed to provide reliable, fast unit tests with proper isolation.

## Key Issues Identified and Resolved

### 1. Bcrypt Mocking Issues ✅ RESOLVED

**Problem**: Tests were using `require('bcrypt')` which doesn't work properly with Vitest's ESM-based mocking.

**Solution**:

- Use `await import('bcrypt')` with `vi.mocked(bcrypt.functionName)`
- Global bcrypt mock is properly configured in `test/setup.ts`

```typescript
// ✅ Correct way
const bcrypt = await import('bcrypt');
vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password');
vi.mocked(bcrypt.compare).mockResolvedValue(true);
```

### 2. Prisma/Multi-tenant Service Mocking ✅ RESOLVED

**Problem**: Tests were trying to mock the base Prisma client instead of the MultiTenantPrismaService wrapper.

**Solution**:

- Created comprehensive mock utilities in `test/test-helpers.ts`
- Proper mock structure for all service methods

```typescript
// ✅ Use helper utilities
import { createMockMultiTenantPrismaService } from '../../test/test-helpers';
const mockMultiTenantPrismaService = createMockMultiTenantPrismaService();
```

### 3. External Service Dependencies ✅ RESOLVED

**Problem**: Services like MailerService, ConfigService weren't properly mocked.

**Solution**:

- Added comprehensive mocks in `test/setup.ts`
- Mocks include all necessary methods and return values

### 4. Dependency Injection with Vitest ✅ DOCUMENTED

**Problem**: NestJS dependency injection doesn't work as expected with Vitest in some cases.

**Current Status**:

- Basic mock structure is in place
- Some tests may still have DI issues due to Vitest/NestJS compatibility
- See "Recommended Test Structure" section for working patterns

## Test Structure Recommendations

### For Service Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createMockMultiTenantPrismaService,
  createMockConfigService,
  resetAllMocks,
} from '../../test/test-helpers';

describe('YourService', () => {
  let service: YourService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = createMockMultiTenantPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrisma,
        },
        // Add other dependencies as needed
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('methodName', () => {
    it('should work correctly', async () => {
      // Arrange
      mockPrisma.entity.findMany.mockResolvedValue([mockData]);

      // Act
      const result = await service.methodName();

      // Assert
      expect(result).toEqual([mockData]);
      expect(mockPrisma.entity.findMany).toHaveBeenCalledWith(expectedArgs);
    });
  });
});
```

### For Controller Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourController } from './your.controller';
import { YourService } from '../services/your.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('YourController', () => {
  let controller: YourController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      methodName: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [YourController],
      providers: [
        {
          provide: YourService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<YourController>(YourController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

## Available Test Helpers

### Mock Factories

- `createMockMultiTenantPrismaService()` - Complete Prisma service mock
- `createMockConfigService()` - Configuration service mock
- `createMockJwtService()` - JWT service mock
- `createMockBcrypt()` - Bcrypt functions mock
- `createMockTransporter()` - Email transporter mock
- `createMockExecutionContext()` - ExecutionContext for guards/interceptors
- `createMockCallHandler()` - CallHandler for interceptors

### Test Data Factories

- `createTestUser(overrides?)` - User test data
- `createTestOrganization(overrides?)` - Organization test data
- `createTestProject(overrides?)` - Project test data
- `createTestTask(overrides?)` - Task test data
- And more for all entities

### Utilities

- `resetAllMocks()` - Clears all mocks between tests

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Specific Test Files

```bash
# Single file
pnpm vitest run src/services/your.service.spec.ts

# Pattern matching
pnpm vitest run src/services/*.spec.ts
```

### Run with Coverage

```bash
pnpm test:coverage
```

## Test Organization

```
apps/api/test/
├── setup.ts              # Global test setup and mocks
├── test-helpers.ts       # Mock factories and utilities
├── test-prisma.ts        # Prisma test configuration
├── setup.ts              # Test setup for Vitest
└── contracts/            # API contract tests
```

## Current Test Status

### ✅ Working Test Infrastructure

- Mock setup in `test/setup.ts` covers all major dependencies
- Helper utilities available for consistent test patterns
- Bcrypt and external service mocks are functional

### ⚠️ Known Issues

- Some service tests may have DI issues due to NestJS/Vitest compatibility
- Complex multi-tenant scenarios may need additional mocking
- Controller tests may need request/response context mocking

### 🚀 Next Steps

1. **Priority**: Fix remaining service tests with DI issues
2. **Priority**: Add contract tests for all API endpoints
3. **Medium**: Add integration tests for database operations
4. **Medium**: Add E2E tests for critical user flows

## Mock Configuration

### Global Mocks (test/setup.ts)

- `@nestjs/config` - ConfigService with test defaults
- `@nestjs/jwt` - JwtService with mock token generation
- `@nestjs-modules/mailer` - MailerService with mock email sending
- `bcrypt` - Password hashing and verification
- `nodemailer` - Email transport
- `uuid` - UUID generation
- `cache-manager` - Caching operations

### Environment Variables

Test environment is automatically configured with:

- `NODE_ENV=test`
- `DATABASE_URL=test database URL`
- `JWT_SECRET=test secret`
- `SMTP_*` variables for email testing

## Best Practices

1. **Always use helper utilities** - They provide consistent, complete mocks
2. **Reset mocks between tests** - Use `resetAllMocks()` in `afterEach`
3. **Mock external dependencies** - Never make real API calls in unit tests
4. **Test all error scenarios** - Use proper exception testing
5. **Keep tests focused** - One behavior per test
6. **Use descriptive test names** - Explain what is being tested

## Debugging Test Issues

### Common Issues and Solutions

1. **"Cannot read properties of undefined"**
   - Check that all dependencies are properly mocked
   - Verify the provider configuration in the test module
   - Use helper utilities for complete mocks

2. **Mock function not called**
   - Check that the mock is properly configured
   - Verify the service is using the mocked dependency
   - Add debugging logs to trace execution

3. **Async/await issues**
   - Always await async operations
   - Use proper assertion patterns for async results
   - Check promise rejections handling

### Debugging Tools

- Use `console.log()` with clear context descriptions
- Check mock call counts and arguments
- Verify test module configuration
- Run individual tests with verbose output

## Future Improvements

1. **Test Performance**: Implement test parallelization and caching
2. **Coverage**: Aim for 80%+ coverage on critical paths
3. **Integration Tests**: Add database and API integration tests
4. **E2E Tests**: Critical user journey testing
5. **Test Monitoring**: Track test performance and flakiness

---

This documentation should help developers understand the test infrastructure and avoid common pitfalls when writing or maintaining tests.
