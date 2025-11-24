# Maintenance: Standardize Testing Framework

## 🎯 Objective

Resolve testing framework conflicts by standardizing on Vitest across the entire monorepo and removing conflicting Jest configurations.

## 📋 Problem Statement

The repository currently has mixed testing framework configurations:

- Root workspace uses Vitest (`vitest.config.ts`)
- API package uses Jest (`apps/api/test/jest.config.js`)
- Multiple test frameworks create dependency conflicts and maintenance overhead
- Extensive pnpm overrides suggest dependency version conflicts

## 🔄 Proposed Changes

### 1. Update API Package Configuration

- Remove Jest dependency from `apps/api/package.json`
- Add Vitest dependency to `apps/api/package.json`
- Replace Jest configuration with Vitest setup
- Update test scripts to use Vitest

### 2. Update Root Workspace

- Ensure Vitest is properly configured for monorepo
- Remove any Jest-related dependencies from root
- Update test scripts to work across workspaces

### 3. Clean Up Test Files

- Remove Jest configuration file: `apps/api/test/jest.config.js`
- Update test file extensions if needed (`.spec.ts` → `.test.ts` for consistency)

## ✅ Benefits

- **Simplified dependency management** - Single testing framework
- **Faster test execution** - Vitest performance benefits
- **Better TypeScript integration** - Native Vitest support
- **Reduced maintenance overhead** - One framework to maintain
- **Cleaner dependency tree** - Remove extensive pnpm overrides

## 🚫 Scope (Non-goals)

- No changes to actual test logic or assertions
- No modifications to test coverage requirements
- No changes to CI workflow structure (will be addressed separately)
- No migration of test files from Jest to Vitest syntax (API compatible)

## 🔍 Risk Assessment

- **Low risk**: Vitest is API-compatible with Jest
- **Easy rollback**: Changes are configuration-only
- **No breaking changes**: Test behavior remains the same
- **Compatibility**: All current test syntax should work

## 📝 Implementation Checklist

- [x] Analyze current Jest configuration in API package
- [x] Update API package.json to use Vitest
- [x] Remove Jest configuration file
- [x] Update root workspace test scripts
- [ ] Run tests to verify functionality
- [x] Update documentation if needed
- [x] Clean up any remaining Jest references

## 🔄 Rollback Plan

If issues arise:

1. Restore Jest configuration from git
2. Revert package.json changes
3. Run tests to confirm functionality
4. Investigate specific compatibility issues

## 📊 Success Criteria

- All existing tests pass with Vitest
- No Jest dependencies remain in the codebase
- Test execution time is maintained or improved
- CI/CD pipeline continues to work correctly

## 🏷️ Labels

`maintenance` `testing` `dependencies` `tech-debt`
