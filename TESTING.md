# Testing Guide

## API Testing

This document provides guidelines for testing the JasaWeb API application.

### Running Tests

#### Run all API tests

```bash
pnpm test:api
```

#### Run tests from API directory

```bash
cd apps/api && pnpm test
```

#### Run tests in watch mode

```bash
cd apps/api && pnpm test:watch
```

#### Run tests with coverage

```bash
cd apps/api && pnpm test:cov
```

#### Run only unit tests

```bash
cd apps/api && pnpm test:unit
```

#### Run integration tests

```bash
cd apps/api && pnpm test:integration
```

### Test Structure

- **Unit Tests**: Located alongside source files with `.spec.ts` extension
- **Integration Tests**: Located in `test/integration` directory
- **Test Configuration**: `test/jest.config.js`
- **Coverage Reports**: Generated in `coverage/` directory

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
