# Troubleshooting Guide for JasaWeb Workflows

This document provides solutions for common issues encountered in the JasaWeb development and CI/CD workflows.

## 🛠️ Local Development Issues

### Pre-commit Hook Failures
**Issue**: Pre-commit hook fails during `git commit`
**Solutions**:
1. Run `pnpm lint:fix` to automatically fix linting issues
2. Run `pnpm format` to fix formatting issues
3. Run `pnpm typecheck` to identify TypeScript errors
4. Run `pnpm test:quick` to run quick tests

### Dependency Issues
**Issue**: Dependencies not resolving correctly
**Solutions**:
```bash
# Clean install dependencies
pnpm clean && pnpm install

# Check for dependency conflicts
pnpm why [package-name]

# Update lockfile
rm pnpm-lock.yaml && pnpm install
```

### Build Failures
**Issue**: Build process fails
**Solutions**:
```bash
# Clean build cache
pnpm clean

# Build specific app
pnpm build:api
pnpm build:web

# Build with verbose output
pnpm build -- --verbose
```

### API Development Issues
**Issue**: API server not starting or responding
**Solutions**:
1. Check if database is running: `pnpm docker:up`
2. Verify environment variables in `.env`
3. Run database migrations: `pnpm db:migrate`
4. Check API logs: `pnpm dev:api`

## 🚀 CI/CD Workflow Issues

### Job Timeout
**Issue**: GitHub Actions job times out
**Solutions**:
1. Increase timeout in workflow file:
   ```yaml
   timeout-minutes: 30  # default is 360
   ```
2. Optimize workflow by reducing unnecessary steps
3. Add caching for dependencies
4. Implement parallel execution where possible

### Cache Misses
**Issue**: Dependencies not being cached effectively
**Solutions**:
- Verify cache key patterns match actual dependency files
- Check that restore-keys include fallback patterns
- Clear GitHub Actions cache if corrupted

### Conditional Job Failures
**Issue**: Conditional jobs not running when expected
**Solutions**:
- Verify path filters are correctly configured
- Check that job dependencies are properly defined
- Confirm conditional expressions are correct

## 🐛 Common Error Messages and Solutions

### "No matching files found"
**Cause**: Build artifacts not generated correctly
**Solution**: Verify all build steps completed successfully, especially dependency installation

### "Permission denied" on Docker operations
**Solution**:
```bash
# On Linux/Mac:
sudo groupadd docker  # if group doesn't exist
sudo usermod -aG docker $USER
newgrp docker
```

### "Database connection failed"
**Solution**: Ensure Docker containers are running:
```bash
pnpm docker:up
pnpm db:migrate
```

### "Module not found" errors
**Solution**:
1. Check if package is properly installed
2. Verify import paths are correct
3. Check if the package is in the right workspace (monorepo setup)

## 🔧 Performance Optimization Tips

### Speeding Up Local Development
1. Use `pnpm dev` for concurrent development servers
2. Use `pnpm test:quick` for fast test runs
3. Use `pnpm lint` instead of `pnpm lint:fix` when just checking
4. Use `pnpm typecheck` for type checking without fixing

### Optimizing CI/CD Performance
1. Use efficient caching strategies
2. Implement path-based triggering to avoid unnecessary runs
3. Use matrix strategies for parallel execution
4. Set appropriate timeouts for different job types

### Memory and Resource Management
1. Limit maxWorkers in test configuration
2. Use appropriate Node.js memory limits
3. Clean up temporary files after builds
4. Implement dependency pruning when possible

## 📋 Debugging Workflow Steps

### General Debugging Process
1. **Identify**: Determine exactly what's failing
2. **Isolate**: Pinpoint the specific job or step causing the issue
3. **Reproduce**: Try to reproduce locally if possible
4. **Fix**: Apply the appropriate solution
5. **Verify**: Test the fix thoroughly

### Debugging CI/CD Workflows Specifically
1. Check the workflow logs in GitHub Actions
2. Enable debug mode by adding these secrets to your repository:
   - `ACTIONS_STEP_DEBUG: true`
   - `ACTIONS_RUNNER_DEBUG: true`
3. Use workflow_dispatch to manually trigger workflows for testing
4. Test workflow changes in a feature branch first

## 🔍 Useful Commands for Troubleshooting

### Development Commands
```bash
# Comprehensive local validation (equivalent to pre-commit checks)
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:quick

# Check what files would be affected by path filters
git diff --name-only HEAD~1

# Run tests for specific app
cd apps/api && pnpm test
cd apps/web && pnpm test

# Check for security vulnerabilities
pnpm security:audit
pnpm security:scan
```

### CI/CD Debugging Commands
```bash
# Run GitHub Actions locally (requires 'act' tool)
act -j job-name
act --list  # List all jobs

# Validate workflow syntax
npx action-validator .github/workflows/
```

## 📞 Support and Resources

### When to Seek Help
- If you've spent more than 30 minutes on the same issue
- If the issue is blocking your development
- If the issue affects multiple developers
- If the issue impacts CI/CD reliability

### Support Channels
1. Check this troubleshooting guide first
2. Review workflow logs in GitHub Actions
3. Ask in the team's communication channel
4. Create an issue with the `bug` label for persistent problems
5. Update this guide if you solve a new problem

---

**Note**: This guide is a living document. When you encounter and solve new issues, please update this guide to help others facing similar problems.
