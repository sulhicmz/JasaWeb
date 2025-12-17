# Testing Guide

## 📖 Overview

This document provides quick reference information for testing the JasaWeb project. For comprehensive testing documentation, see **[Testing Implementation Summary](./docs/TESTING_SUMMARY.md)**.

## 🚀 Quick Commands

### Run All Tests

```bash
# Run all tests across the monorepo
pnpm test

# Run tests for specific applications
pnpm test:api
pnpm test:web
```

### API Testing Commands

```bash
# Run tests from API directory
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

### Web Testing Commands

```bash
# Run web application tests
cd apps/web && pnpm test

# Run tests in watch mode
cd apps/web && pnpm test:watch
```

## 📁 Test Structure

- **`.spec.ts` files**: Unit tests located alongside source files
- **`test/integration/`**: Integration tests for API endpoints
- **`test/contracts/`**: API contract tests
- **`packages/testing/`**: Shared testing utilities and helpers
- **`apps/web/test/`**: Frontend component tests

## 🎯 Test Coverage Areas

### API Services

- ✅ **Authentication Service**: Login, registration, JWT tokens
- ✅ **Project Service**: CRUD operations, statistics, multi-tenant support
- ✅ **User Service**: User management and organization membership
- ✅ **App Controller**: Basic application endpoints

### Frontend Components

- ✅ **Dashboard Components**: Charts, notifications, activity feeds
- ✅ **Service Components**: Analytics, API client integration
- ✅ **Portal Components**: Project management, file management

## 📋 Testing Guidelines

1. **Mock External Dependencies**: Use Vitest mocks for external services
2. **Test Coverage**: Aim for ≥80% coverage on business logic
3. **Test Naming**: Use descriptive test names that explain the behavior
4. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification
5. **Multi-tenant Testing**: Ensure data isolation between organizations
6. **Security Testing**: Validate authentication and authorization

## 📊 Coverage Reports

Coverage reports are generated in the `coverage/` directory when running:

```bash
pnpm test:cov
```

## 🔧 Test Configuration

- **Vitest Configuration**: `vitest.config.ts` files in each workspace
- **Test Utilities**: `packages/testing/src/test-helpers.ts`
- **Mock Data**: `packages/testing/src/mocks.ts`
- **Test Fixtures**: `tests/fixtures/` directory

## 🐛 Debugging Tests

### Running Tests in Debug Mode

```bash
# Run tests with Node.js debugging
cd apps/api && pnpm test:debug

# Run specific test file
pnpm test apps/api/src/auth/auth.service.spec.ts
```

## 📚 Additional Resources

- **[Comprehensive Testing Documentation](./docs/TESTING_SUMMARY.md)** - Full implementation details
- **[Test Infrastructure Guide](./apps/api/test/TEST_INFRASTRUCTURE.md)** - API testing setup
- **[Security Testing Guidelines](./SECURITY.md)** - Security testing practices

---

**Note**: This is a quick reference guide. For detailed testing documentation, implementation status, and advanced testing patterns, please refer to the [Testing Implementation Summary](./docs/TESTING_SUMMARY.md).
