# Testing Guide

This document provides guidelines for testing the JasaWeb monorepo using Jest as the standard testing framework.

## Running Tests

### Run all tests across the monorepo

```bash
pnpm test
```

### Run tests in watch mode

```bash
pnpm test:watch
```

### Run tests with coverage

```bash
pnpm test:coverage
```

### Run API tests only

```bash
pnpm test:api
```

### Run Web tests only

```bash
pnpm test:web
```

### Run unit tests only

```bash
pnpm test:unit
```

### Run integration tests only

```bash
pnpm test:integration
```

### Run tests from specific app directory

```bash
cd apps/api && pnpm test
cd apps/web && pnpm test
```

### Test Structure

- **Unit Tests**: Located alongside source files with `.spec.ts` extension
- **Integration Tests**: Located alongside source files with `.test.ts` extension or in `test/integration` directory
- **E2E Tests**: Located in `tests/e2e` directory (using Playwright)
- **Test Configuration**: `jest.config.js` (workspace level) and `apps/api/test/jest.config.js` (API specific)
- **Coverage Reports**: Generated in `coverage/` directory

### Testing Framework

This monorepo uses **Jest** as the standard testing framework for all packages:

- Consistent configuration across all apps and packages
- TypeScript support via ts-jest
- Coverage reporting with configurable thresholds
- Parallel test execution for better performance
- Mock utilities and global test setup

### Testing Guidelines

1. **Mock External Dependencies**: Use Jest mocks for external services like Prisma, bcrypt, and UUID
2. **Test Coverage**: Aim for high coverage on business logic
3. **Test Naming**: Use descriptive test names that explain the behavior
4. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification

### Current Test Coverage

- ✅ AuthService - Authentication and user registration
- ✅ UsersService - User management operations
- ✅ ProjectService - Project management and statistics
- ✅ AppController - Basic application endpoints

### Adding New Tests

When adding new services or controllers:

1. Create a `.spec.ts` file alongside the source file
2. Mock all external dependencies
3. Test both success and error scenarios
4. Follow the existing patterns for consistency

### Security Testing

The security vulnerability for js-yaml has been resolved:

- js-yaml updated to version ≥4.1.1
- No prototype pollution vulnerability remains
- Verified with `pnpm audit` showing 0 vulnerabilities
