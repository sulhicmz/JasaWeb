# Fast Testing Strategy for JasaWeb

## 🎯 Principles
- **Speed over comprehensiveness** - Get feedback in < 30 seconds
- **Targeted testing** - Test critical paths, not everything
- **Developer productivity** - Easy to run, easy to understand
- **Essential only** - No over-engineering

## 🚀 Test Commands

### Development (Fast Feedback)
```bash
# Run tests quickly with verbose output
pnpm test:quick

# Watch mode for development
pnpm test:watch

# Run specific test file
pnpm test src/auth/auth.service.test.ts
```

### Before Commit (Essential Checks)
```bash
# Quick validation (takes ~15 seconds)
pnpm lint && pnpm typecheck && pnpm test:quick
```

### CI Pipeline (Automated)
```bash
# Full test suite (takes ~2 minutes)
pnpm test:run
```

## 📁 Test Structure

### Critical Paths (Test These)
```
src/
├── auth/           # Authentication logic
├── projects/       # Core business logic
├── api/           # API endpoints
└── common/        # Shared utilities
```

### Test Files Naming
- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

## 🎯 Testing Focus Areas

### 1. Authentication (High Priority)
- Login/logout flows
- Token validation
- Permission checks

### 2. Core Business Logic (High Priority)
- Project CRUD operations
- Milestone management
- Invoice calculations

### 3. API Endpoints (Medium Priority)
- Request/response validation
- Error handling
- Status codes

### 4. Utilities (Low Priority)
- Helper functions
- Data transformations

## ⚡ Performance Tips

### Fast Test Execution
- Use `pnpm test:quick` for development
- Run single test files when debugging
- Use watch mode for continuous testing

### Reduce Test Time
- Mock external dependencies
- Use in-memory databases for tests
- Avoid unnecessary setup/teardown

### Skip Tests When Needed
```bash
# Skip tests temporarily (use sparingly)
pnpm test:run --skip

# Run only critical tests
pnpm test:run --grep "critical"
```

## 📊 Coverage Strategy

### Target Coverage (60% minimum)
- Focus on critical business logic
- Don't worry about 100% coverage
- Prioritize quality over quantity

### What to Cover
✅ **Cover These:**
- Authentication flows
- Business logic
- API endpoints
- Data validation

❌ **Skip These:**
- Simple getters/setters
- Type definitions
- Configuration files
- Mock/test utilities

## 🐛 Debugging Tests

### Quick Debug Commands
```bash
# Run with debugger
pnpm test:inspect src/auth.test.ts

# Run specific test
pnpm test:run -t "should login user"

# Run with verbose output
pnpm test:run --reporter=verbose
```

### Common Issues
- **Timeout errors**: Increase timeout in vitest.config.ts
- **Import errors**: Check tsconfig paths
- **Database errors**: Use test database

## 🔄 CI Integration

### Fast CI Pipeline
1. **Lint & Format** (~10 seconds)
2. **Type Check** (~15 seconds)
3. **Security Audit** (~10 seconds)
4. **Build** (~30 seconds)
5. **Tests** (~45 seconds)

**Total Time: ~2 minutes**

### Test Failures
- Fix critical test failures immediately
- Skip non-critical tests if blocking development
- Use `continue-on-error` for optional checks

## 📝 Best Practices

### Writing Fast Tests
- Keep tests simple and focused
- Use descriptive test names
- Avoid complex setup
- Mock external dependencies

### Test Organization
- Group related tests
- Use beforeEach/afterEach sparingly
- Keep test files small
- Document complex scenarios

### When NOT to Test
- Simple UI components (use visual testing instead)
- Third-party library code
- Configuration files
- Trivial getter/setter methods

## 🚀 Migration Strategy

### Phase 1: Essential Tests (Week 1)
- Authentication flows
- Core API endpoints
- Business logic

### Phase 2: Extended Coverage (Week 2-3)
- Integration tests
- Error scenarios
- Edge cases

### Phase 3: Optimization (Week 4)
- Performance testing
- E2E critical paths
- Test maintenance

---

**Remember**: Fast, targeted tests are better than slow, comprehensive tests that nobody runs.