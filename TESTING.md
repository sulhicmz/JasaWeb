# Testing Guide

## Testing Framework Standardization

**JasaWeb uses Jest as the standard testing framework across the entire monorepo.**

### Why Jest?

- **Better NestJS Integration**: Native support for NestJS decorators and dependency injection
- **Mature Ecosystem**: Extensive mocking capabilities and community support
- **TypeScript Support**: Excellent TypeScript integration with ts-jest
- **Consistency**: Single framework eliminates confusion and configuration conflicts

## Running Tests

### From Root Directory (Recommended)

```bash
# Run all tests across the monorepo
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### From API Directory

```bash
# Run all API tests
cd apps/api && pnpm test

# Run tests in watch mode
cd apps/api && pnpm test:watch

# Run tests with coverage
cd apps/api && pnpm test:cov

# Run only unit tests
cd apps/api && pnpm test:unit

# Run integration tests
cd apps/api && pnpm test:integration
```

### Test Structure

- **Unit Tests**: Located alongside source files with `.spec.ts` extension
- **Integration Tests**: Located in `test/integration` directory
- **Test Configuration**:
  - Root: `jest.config.js` (workspace configuration)
  - API: `apps/api/test/jest.config.js` (API-specific configuration)
- **Coverage Reports**: Generated in `coverage/` directory

### File Naming Conventions

- **Unit Tests**: Use `.spec.ts` extension (e.g., `users.service.spec.ts`)
- **Integration Tests**: Use `.test.ts` extension for integration tests
- **E2E Tests**: Use `.test.ts` extension in dedicated test directories

### Testing Guidelines

1. **Mock External Dependencies**: Use Jest mocks for external services like Prisma, bcrypt, and UUID
2. **Test Coverage**: Aim for 60%+ coverage globally, 80%+ for critical business logic
3. **Test Naming**: Use descriptive test names that explain the behavior
4. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification
5. **Consistent Patterns**: Follow existing test patterns for maintainability
6. **Isolation**: Ensure tests are independent and can run in any order

### Jest Configuration

The monorepo uses a two-level Jest configuration:

1. **Root Configuration** (`jest.config.js`): Workspace-level settings and project definitions
2. **API Configuration** (`apps/api/test/jest.config.js`): API-specific test settings

This setup allows for:

- Unified test execution from the root
- Package-specific test configurations
- Consistent coverage reporting across the monorepo

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
