# Testing Guide

## 📖 Overview

This document provides quick reference information for testing the JasaWeb project. For comprehensive testing documentation, see **[Testing Implementation Summary](./docs/TESTING_SUMMARY.md)**.

## 🚀 Quick Commands

### Run All Tests

```bash
# Run all tests across the monorepo
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### API Testing Commands

```bash
# Run API tests
cd apps/api && pnpm test

# Run tests in watch mode
cd apps/api && pnpm test:watch

# Run tests with coverage
cd apps/api && pnpm test:cov

# Run specific test file
pnpm test apps/api/src/auth/auth.service.spec.ts
```

### Web Testing Commands

```bash
# Run web application tests
cd apps/web && pnpm test

# Run tests in watch mode
cd apps/web && pnpm test:watch
```

### Package Testing Commands

```bash
# Run testing package tests
cd packages/testing && pnpm test

# Run config package tests
cd packages/config && pnpm test
```

## 📁 Test Structure

- **`*.spec.ts` files**: Unit tests located alongside source files
- **`apps/api/test/`**: API-specific integration, contract, and security tests
- **`packages/testing/`**: Shared testing utilities and helpers
- **`apps/web/test/`**: Frontend component tests

## 🎯 Test Coverage Areas

### API Services and Controllers

- ✅ **Authentication**: Login, registration, JWT tokens, RBAC
- ✅ **Projects**: CRUD operations, statistics, multi-tenant support
- ✅ **Users**: User management and organization membership
- ✅ **Files**: File upload/download, S3 integration
- ✅ **Analytics**: Dashboard metrics and reporting
- ✅ **Knowledge Base**: Documentation management

### Security Testing

- ✅ **Multi-tenant isolation**: Data separation between organizations
- ✅ **Authentication security**: JWT validation, refresh tokens
- ✅ **Authorization**: Role-based access control
- ✅ **Input validation**: SQL injection, XSS prevention

### Contract Testing

- ✅ **API contracts**: Endpoint validation and response schemas
- ✅ **Dashboard contracts**: API contract validation for dashboard
- ✅ **Project contracts**: Project API contracts

## 📋 Testing Guidelines

1. **Use Vitest**: All tests use Vitest as the testing framework
2. **Mock External Dependencies**: Use Vitest mocks for external services
3. **Test Coverage**: Aim for ≥80% coverage on business logic
4. **Test Naming**: Use descriptive test names that explain the behavior
5. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification
6. **Multi-tenant Testing**: Ensure data isolation between organizations
7. **Security Testing**: Validate authentication and authorization

## 🔧 Test Configuration

- **Vitest Configuration**: `vitest.config.ts` files in each workspace
- **Test Utilities**: `apps/api/test/test-helpers.ts`
- **Database Utilities**: `apps/api/test/test-prisma.ts`
- **Testing Package**: `packages/testing/index.ts`

## 🐛 Debugging Tests

### Running Tests in Debug Mode

```bash
# Run specific test file with Node.js debugging
cd apps/api && pnpm test:debug auth.service.spec.ts

# Run tests with verbose output
pnpm test --reporter=verbose
```

### Common Issues

**Database Connection Errors**

```bash
# Ensure test database is running
docker-compose up -d postgres
```

**Test Timeouts**

```typescript
// Increase timeout for slow tests
it('slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

## 📚 Additional Resources

- **[Comprehensive Testing Documentation](./docs/TESTING_SUMMARY.md)** - Full implementation details
- **[Test Infrastructure Guide](./apps/api/test/TEST_INFRASTRUCTURE.md)** - API testing setup
- **[Security Testing Guidelines](./SECURITY.md)** - Security testing practices

---

**Note**: This is a quick reference guide. For detailed testing documentation, implementation status, and advanced testing patterns, please refer to the [Testing Implementation Summary](./docs/TESTING_SUMMARY.md).
