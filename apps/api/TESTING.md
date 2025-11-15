# Testing Guide for JasaWeb API

## Overview

This document outlines the testing approach and guidelines for the JasaWeb API application.

## Testing Framework

The API uses **Jest** as the primary testing framework with the following configuration:

- Unit tests: Located in `test/unit/` directory
- Integration tests: Located in `test/integration/` directory
- Test files follow the pattern `*.spec.ts`

## Running Tests

### Run all tests

```bash
cd apps/api && npm test
```

### Run unit tests only

```bash
cd apps/api && npm run test:unit
```

### Run integration tests only

```bash
cd apps/api && npm run test:integration
```

### Run tests with coverage

```bash
cd apps/api && npm run test:cov
```

### Run tests in watch mode

```bash
cd apps/api && npm run test:watch
```

## Test Structure

### Unit Tests

Unit tests focus on testing individual services and components in isolation.

Example structure:

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let dependencyService: any;

  beforeEach(async () => {
    // Setup mocks and test module
    dependencyService = {
      /* mock implementation */
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        { provide: DependencyService, useValue: dependencyService },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should return expected result', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

Integration tests test multiple components working together.

Example structure:

```typescript
describe('Integration Tests', () => {
  it('should demonstrate integration test structure', () => {
    expect(true).toBe(true);
  });
});
```

## Mocking Dependencies

Use Jest's mocking capabilities to isolate units under test:

```typescript
const mockService = {
  methodName: jest.fn().mockResolvedValue(mockData),
  anotherMethod: jest.fn().mockReturnValue('mocked value'),
};
```

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests in three clear phases
3. **Mock External Dependencies**: Always mock databases, external APIs, and file systems
4. **Test Coverage**: Aim for meaningful coverage on critical business logic
5. **Keep Tests Simple**: Avoid complex setup and focus on the behavior being tested

## Current Test Coverage

The API currently has tests for:

- UsersService: CRUD operations and user lookup
- ProjectService: Project management operations
- AuthService: Basic authentication structure
- Integration test foundation

## Adding New Tests

When adding new features:

1. Create corresponding test files in the appropriate directory
2. Follow the existing patterns and naming conventions
3. Mock all external dependencies
4. Test both happy path and error cases where applicable
5. Run the full test suite before committing

## Notes

- The root project uses Vitest for testing, while the API uses Jest
- This separation allows each workspace to use the most appropriate testing framework
- Tests are configured to avoid the complex dependency chains that can cause issues with ES modules
