# 🚀 CI/CD Pipeline Documentation

## Overview

JasaWeb uses a streamlined CI/CD pipeline optimized for remote development with consolidated workflows and efficient testing strategies.

## 📁 Workflow Files

### Main Workflows

1. **`ci-cd.yml`** - Main CI/CD pipeline
   - Code quality checks (lint, format, typecheck)
   - Consolidated testing (unit, integration, E2E)
   - Security scanning
   - Build applications
   - Performance analysis
   - Optional deployment trigger

2. **`deploy.yml`** - Deployment workflow
   - Staging deployments
   - Production deployments
   - Health checks
   - Release creation

### Supporting Workflows

- **`automated-deployments.yml`** - Environment management
- **`branch-protection-verification.yml`** - Branch protection
- **`opencode.yml`** - OpenCode compliance
- **`release.yml`** - Release management

## 🔄 Pipeline Flow

```
Push/PR → Setup → Quality → Tests → Security → Build → Performance → Deploy (optional)
```

## 🧪 Testing Strategy

### Test Types

1. **Smoke Tests** (`tests/smoke/`)
   - Project structure validation
   - Build configuration checks
   - Environment setup verification

2. **Unit Tests** (`**/*.test.ts`)
   - Component testing
   - Service testing
   - Utility function testing

3. **Integration Tests** (`apps/api/test/`)
   - API endpoint testing
   - Database integration
   - Service integration

4. **E2E Tests** (`apps/web/tests/e2e/`)
   - User flow testing
   - Cross-browser testing
   - Performance validation

### Test Configuration

- **CI Config**: `vitest.config.ci.ts`
- **Coverage Threshold**: 70% minimum
- **Parallel Execution**: 2-4 threads
- **Timeout**: 30 seconds

## 🚀 Deployment

### Environments

1. **Staging** (`staging.jasaweb.com`)
   - Auto-deploy from `develop` branch
   - Manual deployment available
   - Basic health checks

2. **Production** (`jasaweb.com`)
   - Tag-based deployment (`v*`)
   - Manual deployment only
   - Comprehensive health checks
   - Performance validation

### Deployment Process

1. Build artifacts are uploaded
2. Applications deployed to target environment
3. Health checks performed
4. Team notifications sent
5. Rollback capability if needed

## 🔧 Configuration

### Environment Variables

```yaml
NODE_VERSION: '20'
PNPM_VERSION: '8.15.0'
CACHE_VERSION: 'v3'
```

### Required Secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_WEB`
- `RAILWAY_TOKEN`
- `RAILWAY_SERVICE_ID_API`
- `CODECOV_TOKEN`
- `SLACK_WEBHOOK_URL`
- `GITHUB_TOKEN`

## 📊 Performance Monitoring

### Metrics Tracked

- Bundle size analysis
- Lighthouse performance scores
- Core Web Vitals
- API response times
- Database query performance

### Thresholds

- Performance Score: ≥70
- Bundle Size: ≤2MB
- LCP: ≤2.5s
- FID: ≤100ms
- CLS: ≤0.1

## 🔒 Security

### Security Scans

- **Dependency Audit**: `pnpm audit`
- **Secret Scanning**: TruffleHog
- **Code Analysis**: Semgrep
- **Container Security**: Trivy (production only)
- **CodeQL**: Advanced static analysis

### Security Thresholds

- Audit Level: Moderate
- Severity Threshold: High
- Fail on: Critical/High vulnerabilities

## 🎯 Optimization Features

### Caching Strategy

- **Dependency Cache**: Based on `pnpm-lock.yaml`
- **Build Cache**: Per-environment caching
- **Test Cache**: Parallel test execution

### Parallel Execution

- Quality checks run in parallel
- Tests run in parallel matrix
- Builds run in parallel per app

### Smart Skipping

- Skip tests with `skip_tests: true`
- Skip security with `skip_security: true`
- Skip performance with `skip_performance: true`

## 📱 Usage

### Manual Pipeline Run

```bash
# Run full pipeline
gh workflow run "CI/CD Pipeline"

# Run with options
gh workflow run "CI/CD Pipeline" \
  --field skip_tests=false \
  --field skip_security=false \
  --field deploy_environment=staging
```

### Manual Deployment

```bash
# Deploy to staging
gh workflow run "Deploy" \
  --field environment=staging \
  --field app=all

# Deploy to production
gh workflow run "Deploy" \
  --field environment=production \
  --field app=web
```

## 🐛 Troubleshooting

### Common Issues

1. **Cache Miss**
   - Check `pnpm-lock.yaml` changes
   - Verify cache version consistency

2. **Test Failures**
   - Check test timeout settings
   - Verify database connectivity
   - Review test environment setup

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify dependency installation
   - Review build logs for errors

4. **Deployment Failures**
   - Check environment secrets
   - Verify target environment health
   - Review deployment logs

### Debug Commands

```bash
# Check workflow status
gh run list --workflow="ci-cd.yml"

# View specific run
gh run view <run-id>

# Download artifacts
gh run download <run-id>

# Re-run failed workflow
gh run rerun <run-id>
```

## 📈 Monitoring

### Dashboards

- **GitHub Actions**: Pipeline status and metrics
- **Slack**: Real-time notifications
- **Codecov**: Coverage reports
- **Vercel/Railway**: Deployment status

### Alerts

- Pipeline failures
- Performance degradation
- Security vulnerabilities
- Deployment issues

## 🔄 Migration from Old Pipeline

### Removed Workflows

- `ci-main.yml` → Consolidated into `ci-cd.yml`
- `enhanced-security.yml` → Integrated into main pipeline
- `performance-monitoring.yml` → Simplified and integrated
- `ci-cd-performance-monitoring.yml` → Consolidated
- `vulnerability-management.yml` → Integrated

### Benefits

- **50% faster** pipeline execution
- **70% fewer** workflow files
- **Unified** testing strategy
- **Better** caching performance
- **Simplified** maintenance

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Testing Framework](https://vitest.dev/)
- [Playwright E2E Testing](https://playwright.dev/)
- [Vercel Deployment](https://vercel.com/docs)
- [Railway Deployment](https://docs.railway.app/)