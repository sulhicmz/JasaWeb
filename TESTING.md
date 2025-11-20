# Testing Guide

## API Testing

This document provides guidelines for testing the JasaWeb API application.

### Running Tests

#### Run all tests across monorepo

```bash
pnpm test
```

#### Run tests in watch mode

```bash
pnpm test:watch
```

#### Run tests with coverage

```bash
pnpm test:coverage
```

#### Run only API tests

```bash
pnpm test:api
```

#### Run only Web app tests

```bash
pnpm test:web
```

#### Run only UI package tests

```bash
pnpm test:ui
```

#### Run specific test file

```bash
pnpm test apps/api/src/users/users.service.spec.ts
```

### Test Structure

- **Unit Tests**: Located alongside source files with `.spec.ts` extension
- **Integration Tests**: Located alongside source files with `.integration.test.ts` extension
- **Test Configuration**: `jest.config.js` (workspace level) and `apps/api/test/jest.config.js`
- **Coverage Reports**: Generated in `coverage/` directory
- **Test Setup**: Each workspace has its own setup file in `test/setup.ts`

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
