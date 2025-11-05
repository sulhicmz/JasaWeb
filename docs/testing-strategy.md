# Testing Strategy and Guidelines

## 🧪 Overview

This document outlines the comprehensive testing strategy for the JasaWeb project, ensuring code quality, reliability, and performance across all components.

## 📋 Table of Contents

- [Testing Pyramid](#testing-pyramid)
- [Test Types](#test-types)
- [Testing Tools](#testing-tools)
- [Test Structure](#test-structure)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🏔️ Testing Pyramid

Our testing strategy follows the classic testing pyramid:

```
    🔺 E2E Tests (Few)
   🔺🔺 Integration Tests (Some)
  🔺🔺🔺 Unit Tests (Many)
```

### Unit Tests (70%)
- Fast, isolated tests
- Test individual functions and components
- Mock external dependencies
- Run on every commit

### Integration Tests (20%)
- Test component interactions
- Database integration
- API endpoint testing
- Run on every PR

### E2E Tests (10%)
- Full user workflows
- Cross-browser testing
- Visual regression testing
- Run on main branch

## 🧪 Test Types

### 1. Unit Tests

#### Purpose
- Test individual units of code in isolation
- Verify business logic
- Ensure functions work as expected
- Fast feedback loop

#### Examples
```typescript
// Service unit test
describe('ProjectService', () => {
  it('should create project with valid data', async () => {
    const projectData = { name: 'Test Project', description: 'Test' };
    const result = await projectService.create(projectData, mockUser);
    
    expect(result.name).toBe(projectData.name);
    expect(result.createdBy).toBe(mockUser.id);
  });
});

// Component unit test
describe('ProjectCard', () => {
  it('should render project information correctly', () => {
    const project = { id: '1', name: 'Test Project', status: 'active' };
    
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

#### Purpose
- Test component interactions
- Database operations
- API endpoints
- External service integrations

#### Examples
```typescript
// API integration test
describe('Projects API', () => {
  it('should create and retrieve project', async () => {
    const createData = { name: 'Integration Test Project' };
    
    // Create project
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(createData)
      .expect(201);
    
    const projectId = response.body.id;
    
    // Retrieve project
    const getResponse = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(getResponse.body.name).toBe(createData.name);
  });
});

// Database integration test
describe('Project Repository', () => {
  it('should save and retrieve project from database', async () => {
    const project = await projectRepository.create({
      name: 'Database Test Project',
      organizationId: 'org-1',
    });
    
    expect(project.id).toBeDefined();
    
    const retrieved = await projectRepository.findById(project.id);
    expect(retrieved.name).toBe(project.name);
  });
});
```

### 3. End-to-End Tests

#### Purpose
- Test complete user workflows
- Verify application behavior from user perspective
- Cross-browser compatibility
- Visual regression testing

#### Examples
```typescript
// E2E test with Playwright
test('user can create and manage project', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Navigate to projects
  await page.click('[data-testid="projects-nav"]');
  await expect(page).toHaveURL('/projects');
  
  // Create new project
  await page.click('[data-testid="create-project-button"]');
  await page.fill('[data-testid="project-name"]', 'E2E Test Project');
  await page.fill('[data-testid="project-description"]', 'Created by E2E test');
  await page.click('[data-testid="save-button"]');
  
  // Verify project created
  await expect(page.locator('[data-testid="project-card"]')).toContainText('E2E Test Project');
});
```

### 4. Performance Tests

#### Purpose
- Ensure application performance
- Load testing
- Stress testing
- Performance regression detection

#### Examples
```yaml
# Artillery config for load testing
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"

scenarios:
  - name: "API Load Test"
    weight: 70
    flow:
      - get:
          url: "/health"
      - think: 1
      - get:
          url: "/api/projects"
  
  - name: "Authentication Flow"
    weight: 30
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
```

### 5. Accessibility Tests

#### Purpose
- Ensure application is accessible
- WCAG compliance
- Screen reader compatibility
- Keyboard navigation

#### Examples
```javascript
// Pa11y configuration
module.exports = {
  defaults: {
    timeout: 30000,
    wait: 2000,
    chromeLaunchConfig: {
      headless: true,
      args: ["--no-sandbox"]
    }
  },
  urls: [
    "http://localhost:4321/",
    "http://localhost:4321/about",
    "http://localhost:4321/services"
  ]
};
```

### 6. Security Tests

#### Purpose
- Identify security vulnerabilities
- OWASP compliance
- Input validation
- Authentication and authorization

#### Examples
```typescript
// Security test example
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: maliciousInput,
        password: 'password'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid');
  });
  
  it('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/contact')
      .send({
        message: xssPayload
      });
    
    expect(response.body.message).not.toContain('<script>');
  });
});
```

## 🛠️ Testing Tools

### Core Testing Stack

| Tool | Purpose | Version |
|------|---------|---------|
| **Vitest** | Unit testing framework | ^1.0.0 |
| **Jest** | API testing (NestJS) | ^29.5.0 |
| **Playwright** | E2E testing | Latest |
| **Artillery** | Load testing | Latest |
| **Pa11y** | Accessibility testing | Latest |
| **Lighthouse CI** | Performance testing | Latest |
| **Codecov** | Coverage reporting | Latest |

### Supporting Tools

| Tool | Purpose |
|------|---------|
| **Test Containers** | Database testing |
| **MSW (Mock Service Worker)** | API mocking |
| **Testing Library** | Component testing |
| **Percy** | Visual regression testing |
| **OWASP ZAP** | Security scanning |

## 📁 Test Structure

```
jasaweb/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.service.spec.ts     # Unit tests
│   │   │   └── projects/
│   │   │       ├── projects.controller.ts
│   │   │       └── projects.controller.spec.ts
│   │   └── test/
│   │       ├── unit/                        # Unit tests
│   │       ├── integration/                 # Integration tests
│   │       └── e2e/                        # E2E tests
│   └── web/
│       ├── src/
│       │   └── components/
│       │       ├── ProjectCard.astro
│       │       └── ProjectCard.test.tsx     # Component tests
│       └── tests/
│           ├── unit/                        # Unit tests
│           ├── integration/                 # Integration tests
│           └── e2e/                        # E2E tests
├── packages/
│   ├── ui/
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx
│   │   └── tests/
│   └── testing/
│       ├── src/
│       │   ├── mocks.ts
│       │   ├── fixtures.ts
│       │   └── helpers.ts
└── tests/
    ├── setup.ts                            # Global test setup
    ├── fixtures/                           # Test data
    └── utils/                              # Test utilities
```

## 📊 Coverage Requirements

### Minimum Coverage Standards

| Component | Coverage | Critical Paths |
|-----------|----------|----------------|
| **API Services** | 90% | 95% |
| **API Controllers** | 85% | 90% |
| **Web Components** | 80% | 90% |
| **Shared Packages** | 85% | 95% |
| **Overall Project** | 80% | N/A |

### Coverage Categories

1. **Statement Coverage**: Every line of code executed
2. **Branch Coverage**: Every conditional branch taken
3. **Function Coverage**: Every function called
4. **Line Coverage**: Every line of code covered

### Coverage Tools

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

## 🔄 CI/CD Integration

### Test Pipeline

```yaml
# Enhanced testing workflow
jobs:
  unit-tests:
    # Fast unit tests on all changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [web, api, ui, config, testing]

  integration-tests:
    # API and database integration
    needs: unit-tests
    services:
      postgres:
        # Test database setup

  e2e-tests:
    # Full application testing
    needs: integration-tests
    steps:
      - name: Build applications
      - name: Start services
      - name: Run Playwright tests

  performance-tests:
    # Performance and accessibility
    needs: integration-tests
    steps:
      - name: Lighthouse CI
      - name: Load testing
      - name: Accessibility tests
```

### Test Triggers

| Event | Tests Run |
|-------|-----------|
| **Push to develop** | Unit + Integration |
| **Push to main** | All tests |
| **Pull Request** | All tests |
| **Schedule (daily)** | Comprehensive test suite |
| **Manual** | Selected tests |

## 📋 Best Practices

### Test Writing

#### 1. Arrange-Act-Assert Pattern
```typescript
it('should update project status', async () => {
  // Arrange
  const project = await createTestProject();
  const updateData = { status: 'completed' };
  
  // Act
  const result = await projectService.update(project.id, updateData);
  
  // Assert
  expect(result.status).toBe('completed');
});
```

#### 2. Descriptive Test Names
```typescript
// ✅ Good
it('should return 404 when project does not exist');
it('should create project with valid data');
it('should reject invalid email format');

// ❌ Bad
it('works');
it('test project');
it('returns error');
```

#### 3. Test Data Management
```typescript
// Use factories for test data
const createTestProject = (overrides = {}) => ({
  id: 'test-project-id',
  name: 'Test Project',
  description: 'Test Description',
  status: 'active',
  ...overrides,
});

// Use fixtures for complex data
const testUser = fixtures.user();
const testOrganization = fixtures.organization();
```

#### 4. Mock External Dependencies
```typescript
// Mock database calls
jest.mock('@prisma/client');
const mockPrisma = {
  project: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// Mock external APIs
jest.mock('nodemailer');
const mockSendMail = jest.fn();
nodemailer.createTransport.mockReturnValue({
  sendMail: mockSendMail,
});
```

### Test Organization

#### 1. Group Related Tests
```typescript
describe('ProjectService', () => {
  describe('create', () => {
    it('should create project with valid data');
    it('should reject duplicate project names');
    it('should validate required fields');
  });
  
  describe('update', () => {
    it('should update existing project');
    it('should return 404 for non-existent project');
  });
});
```

#### 2. Use Test Helpers
```typescript
// test/helpers/auth.ts
export const createTestAuth = () => {
  const token = jwt.sign({ userId: 'test-user' }, 'test-secret');
  return { token, userId: 'test-user' };
};

// test/helpers/database.ts
export const setupTestDatabase = async () => {
  await prisma.$executeRaw`TRUNCATE TABLE projects, users RESTART IDENTITY`;
};
```

#### 3. Clean Up After Tests
```typescript
describe('ProjectService', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

### Performance Testing

#### 1. Monitor Test Performance
```typescript
// Add performance assertions
it('should respond within 200ms', async () => {
  const start = Date.now();
  await projectService.findAll();
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(200);
});
```

#### 2. Use Test Databases Efficiently
```typescript
// Use transactions for test isolation
it('should handle concurrent project creation', async () => {
  await prisma.$transaction(async (tx) => {
    const project1 = await tx.project.create({ data: { name: 'Project 1' } });
    const project2 = await tx.project.create({ data: { name: 'Project 2' } });
    
    expect(project1.id).toBeDefined();
    expect(project2.id).toBeDefined();
  });
});
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Flaky Tests
```typescript
// Use proper waiting strategies
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 5000 });
```

#### 2. Test Database Issues
```typescript
// Ensure proper cleanup
afterEach(async () => {
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});
```

#### 3. Async Test Issues
```typescript
// Handle async properly
it('should handle async operations', async () => {
  const promise = projectService.create(data);
  await expect(promise).resolves.toMatchObject({ name: data.name });
});
```

### Debugging Tests

#### 1. Use Debug Mode
```bash
# Run tests in debug mode
pnpm test:debug

# Run specific test file
pnpm test auth.service.spec.ts

# Run tests with coverage
pnpm test:coverage
```

#### 2. Console Logging
```typescript
// Use appropriate logging
it('should debug test data', () => {
  console.log('Test data:', testData);
  expect(result).toBe(expected);
});
```

#### 3. Test Reports
```bash
# Generate HTML coverage report
pnpm test:coverage --reporter=html

# View coverage report
open coverage/index.html
```

## 📚 Additional Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

### Best Practices
- [Testing Best Practices](https://kentcdodds.com/blog/common-testing-mistakes)
- [Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)
- [Testing Anti-Patterns](https://testingjavascript.com/)

### Tools and Libraries
- [MSW for API Mocking](https://mswjs.io/)
- [Test Containers](https://www.testcontainers.org/)
- [Artillery for Load Testing](https://www.artillery.io/)

---

This testing strategy ensures comprehensive coverage and maintains high code quality across the JasaWeb project. Regular reviews and updates to this strategy help adapt to changing requirements and new testing tools.