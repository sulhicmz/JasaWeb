# API Contract Testing Guide

## Overview

API Contract Testing ensures that the frontend and backend applications maintain a stable and predictable interface. This guide covers the contract testing approach used in JasaWeb to guarantee API reliability and prevent breaking changes.

## Purpose

Contract testing in JasaWeb serves to:

- **Ensure API Stability**: Validate that API responses remain consistent across versions
- **Prevent Breaking Changes**: Catch breaking changes before they reach production
- **Improve Team Collaboration**: Provide a clear contract between frontend and backend teams
- **Automated Quality Assurance**: Integrate contract validation into CI/CD pipelines
- **Documentation**: Document expected API behavior alongside implementation

## Test Structure

### Folder Organization

```
apps/api/test/contracts/
├── auth.contract.test.ts          # Authentication endpoints
├── projects.contract.test.ts      # Project management endpoints
├── dashboard.contract.test.ts     # Dashboard and analytics endpoints
├── files.contract.test.ts         # File management endpoints
├── health.contract.test.ts        # Health check endpoints
└── helpers/
    └── contract-test-helpers.ts   # Shared utilities and fixtures
```

### Test Naming Convention

Contract tests follow the pattern: `{endpoint}.contract.test.ts` where `{endpoint}` corresponds to the API resource being tested.

## Contract Test Components

### 1. Database Test Helper

The `DatabaseTestHelper` class provides:

- **Isolated Test Environment**: Each test runs in a clean database state
- **Multi-tenant Support**: Tests respectorganization isolation
- **Test Data Creation**: Utility methods for creating test users, projects, tickets
- **Cleanup Management**: Automatic database cleanup after tests

```typescript
const testHelper = new DatabaseTestHelper();
await testHelper.setupTestDatabase();
const user = await testHelper.createTestUser();
await testHelper.cleanup();
```

### 2. Contract Test Utilities

The `ContractTestUtils` class provides validation helpers:

- **Response Structure Validation**: Ensures API responses match expected structure
- **Data Type Validation**: Validates types of response fields
- **Security Validation**: Ensures no sensitive data leaks
- **Pagination Validation**: Validates paginated response format
- **Error Response Validation**: Ensures error responses are consistent

```typescript
ContractTestUtils.validateErrorResponse(response, 401);
ContractTestUtils.validateUUID(response.body.id);
ContractTestUtils.validateNoSensitiveData(response.body);
```

### 3. Test Fixtures

The `ContractTestFixtures` class provides:

- **Standard Test Data**: Reusable test data objects
- **Custom Data Creation**: Methods to create test data with overrides
- **Invalid Data Samples**: Common invalid data for negative testing

```typescript
const userData = ContractTestFixtures.createUserData();
const projectData = ContractTestFixtures.createProjectData({
  name: 'Custom Project Name',
});
```

## Contract Test Patterns

### 1. Successful Response Contracts

Each endpoint test validates:

- **HTTP Status Code**: Correct status codes for different scenarios
- **Response Structure**: Exact object structure and field presence
- **Data Types**: Expected data types for each field
- **Business Logic**: Valid business rule application
- **Headers**: Proper response headers including security headers

```typescript
it('should return proper contract response on successful operation', async () => {
  return request(app.getHttpServer())
    .post('/endpoint')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(validData)
    .expect(201)
    .expect((res) => {
      // Contract: Response structure validation
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('createdAt');

      // Contract: Data type validation
      ContractTestUtils.validateUUID(res.body.id);
      ContractTestUtils.validateDateString(res.body.createdAt);

      // Contract: Business logic validation
      expect(res.body.name).toBe(validData.name);

      // Contract: Security validation
      ContractTestUtils.validateNoSensitiveData(res.body);
    });
});
```

### 2. Error Response Contracts

Error scenarios validate:

- **Standard Error Structure**: Consistent error response format
- **Appropriate Status Codes**: Correct HTTP status codes
- **Error Messages**: Clear, non-technical error messages
- **No Information Leakage**: Error messages don't reveal sensitive information

```typescript
it('should return proper error contract for invalid data', async () => {
  return request(app.getHttpServer())
    .post('/endpoint')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(invalidData)
    .expect(400)
    .expect((res) => {
      ContractTestUtils.validateErrorResponse(res.body, 400);
      expect(res.body.error).toBe('Bad Request');
      expect(Array.isArray(res.body.message)).toBe(true);
    });
});
```

### 3. Multi-tenancy Contracts

Multi-tenancy validation ensures:

- **Data Isolation**: Organizations can only access their own data
- **Security**: No cross-organization data leaks
- **Scope Enforcement**: All operations respect organization context

```typescript
it('should enforce organization isolation', async () => {
  // Create user and data in organization A
  const userA = await testHelper.createTestUser();
  const resourceA = await testHelper.createTestResource(userA.organizationId);

  // Create user in organization B
  const userB = await testHelper.createTestUser({ email: 'other@example.com' });

  // User B should not see User A's data
  return request(app.getHttpServer())
    .get('/resources')
    .set('Authorization', `Bearer ${userB.accessToken}`)
    .expect(200)
    .expect((res) => {
      expect(res.body.data).toEqual([]);
    });
});
```

### 4. Pagination Contracts

Pagination validation ensures:

- **Consistent Structure**: Standard pagination response format
- **Correct Metadata**: Accurate pagination metadata
- **Limits Enforcement**: Proper limit and parameter handling

```typescript
ContractTestUtils.validatePaginationResponse(response, [
  'id',
  'name',
  'status',
]);
```

## Validation Requirements

### Required Fields

Every contract test must validate:

1. **Response Structure**

   ```typescript
   expect(res.body).toHaveProperty('requiredField');
   ```

2. **Data Types**

   ```typescript
   ContractTestUtils.validateUUID(res.body.id);
   ContractTestUtils.validateDateString(res.body.createdAt);
   ```

3. **Business Rules**

   ```typescript
   expect(res.body.status).toBeOneOf(['ACTIVE', 'INACTIVE']);
   ```

4. **Security**
   ```typescript
   ContractTestUtils.validateNoSensitiveData(res.body);
   ```

### Sensitive Data Validation

Contract tests must ensure no sensitive data leaks:

- Passwords or password hashes
- Internal system paths
- Database connection strings
- API keys or secrets
- Internal debugging information

## CI/CD Integration

### GitHub Actions Workflow

The API contract tests run on:

- **Push to main/develop**: Full contract test suite
- **Pull Requests**: Contract comparison with main branch
- **Scheduled**: Periodic contract stability validation

### Pipeline Steps

1. **Setup Environment**: Test database and services
2. **Install Dependencies**: pnpm with frozen lockfile
3. **Database Migration**: Ensure correct schema
4. **Build Applications**: Production-like build
5. **Run Contract Tests**: Execute all contract tests
6. **Validate Results**: Ensure 95%+ pass rate
7. **Generate Report**: Detailed test results and coverage
8. **Compare Changes**: Detect breaking contract changes

### Success Criteria

- **All contract tests pass**: 100% of critical endpoint tests
- **No breaking changes**: Backward compatibility maintained
- **Success Rate**: Minimum 95% pass rate
- **Security Scan**: No hardcoded secrets or vulnerabilities
- **Documentation**: All endpoints have contract test coverage

## Writing New Contract Tests

### Step 1: Identify Scope

Determine what the endpoint should return:

- Successful responses for different scenarios
- Error responses for validation failures
- Edge cases and boundary conditions
- Multi-tenancy implications

### Step 2: Create Test File

Create a new file in `apps/api/test/contracts/`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  DatabaseTestHelper,
  ContractTestUtils,
} from '../helpers/contract-test-helpers';

describe('Endpoint API Contract Tests', () => {
  let app: INestApplication;
  let testHelper: DatabaseTestHelper;
  let testUser: any;
  let accessToken: string;

  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  beforeEach(async () => {
    // Test isolation
  });

  describe('Successful Responses', () => {
    // Positive test cases
  });

  describe('Error Responses', () => {
    // Negative test cases
  });

  describe('Multi-tenancy', () => {
    // Organization isolation tests
  });
});
```

### Step 3: Add Contract Validations

For each test case, include:

- **Structure validation**: `expect().toHaveProperty()`
- **Type validation**: `ContractTestUtils.validateXXX()`
- **Business logic validation**: Value comparisons
- **Security validation**: `ContractTestUtils.validateNoSensitiveData()`

### Step 4: Add to CI Pipeline

Add the new contract test to the workflow validation list in `.github/workflows/api-contract-tests.yml`.

## Maintenance and Updates

### Version Control

When API contracts need to change:

1. **Update Tests First**: Modify contract tests to reflect new contract
2. **Communicate Changes**: Notify frontend team of breaking changes
3. **Update Documentation**: Update API documentation
4. **Version Appropriately**: Update API version if breaking changes
5. **Validate**: Ensure all contract tests pass

### Adding New Endpoints

When adding new endpoints:

1. **Create Contract Test**: Write comprehensive contract tests
2. **Validate Integration**: Add to CI pipeline validation
3. **Document Contract**: Update API documentation
4. **Monitor Usage**: Track frontend integration

## Troubleshooting

### Common Issues

1. **Test Data Creation Failures**
   - Check database connection in test environment
   - Verify test data satisfies all constraints
   - Ensure proper cleanup between tests

2. **Authentication Failures**
   - Verify JWT secrets in test environment
   - Check user creation and token generation
   - Ensure proper role assignments

3. **Time-dependent Test Failures**
   - Use fixed dates for predictable tests
   - Handle timezone differences
   - Validate date ranges, not exact timestamps

4. **Random Test Flakiness**
   - Ensure proper test isolation
   - Fix resource cleanup
   - Avoid depending on external services

### Debugging Tips

- Use `console.log()` sparingly for debugging test data
- Inspect actual vs expected response structures
- Check database state during test execution
- Validate test environment configuration

## Best Practices

### Do's

✅ Test all public API endpoints  
✅ Validate complete response structure  
✅ Include authentication tests  
✅ Test multi-tenancy boundaries  
✅ Use descriptive test names  
✅ Test both happy and sad paths  
✅ Validate error responses  
✅ Include pagination tests where applicable  
✅ Use fixtures for common test data  
✅ Clean up test data properly

### Don'ts

❌ Test internal implementation details  
❌ Include hardcoded sensitive data  
❌ Rely on external services in contract tests  
❌ Share state between tests  
❌ Skip security validation  
❌ Assume data exists without verification  
❌ Use sleeps instead of proper synchronization  
❌ Return undefined/null in success responses  
❌ Include debugging information in responses

## Metrics and Monitoring

Contract test metrics to track:

- **Coverage**: Percentage of endpoints with contract tests
- **Success Rate**: Percentage of passing contract tests
- **Flakiness**: Frequency of intermittent test failures
- **Execution Time**: Time to run complete contract test suite
- **CI Pipeline Status**: Consistent success/failure patterns

Regular monitoring ensures contract tests remain effective and reliable.

---

For more information on API development and testing, see the [API Development Guide](../api-endpoints.md) and [Testing Summary](../testing/testing-summary.md).
