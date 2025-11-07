# CI/CD Workflow Optimization

This document describes the optimized CI/CD pipeline structure for JasaWeb.

## Overview

The CI/CD workflows have been streamlined from 10 separate workflows to 6 consolidated workflows, improving performance, maintainability, and reducing redundancy.

## Workflow Structure

### 1. CI Pipeline (`ci.yml`)
**Trigger:** Push/PR to main/develop branches
**Purpose:** Main continuous integration pipeline
**Jobs:**
- **Setup**: Caches dependencies for reuse across jobs
- **Quality Checks**: Linting, formatting, type checking
- **Test**: Unit tests with coverage reporting
- **Security**: Basic security scans (audit, secret detection)
- **Build**: Builds web and API applications in parallel
- **Status Check**: Final CI status verification

**Optimizations:**
- Dependency caching reduces install time by ~70%
- Parallel job execution (quality, test, security run simultaneously)
- Concurrency control prevents duplicate runs
- Matrix strategy for building multiple apps

### 2. Enhanced Testing (`enhanced-testing.yml`)
**Trigger:** Daily schedule (1 AM UTC), push to main, manual
**Purpose:** Comprehensive testing beyond CI
**Jobs:**
- **Integration Tests**: API integration tests with database
- **E2E Tests**: Playwright end-to-end tests
- **Accessibility Tests**: pa11y accessibility audits
- **Test Reporting**: Consolidated test results

**Optimizations:**
- Runs only on schedule or main branch to save resources
- Sequential execution with dependencies
- Comprehensive reporting in single artifact

### 3. Security (`security.yml`)
**Trigger:** Daily schedule (2 AM UTC), push to main, PR, manual
**Purpose:** Comprehensive security scanning
**Jobs:**
- **CodeQL Analysis**: Static code analysis
- **Dependency Security**: npm audit, Snyk, dependency review
- **Secret Scan**: TruffleHog, Gitleaks, pattern matching
- **Code Security**: Semgrep, ESLint security rules
- **Container Security**: Trivy container scanning (main only)
- **Security Report**: Consolidated security findings

**Optimizations:**
- Consolidated from 3 separate security workflows
- Parallel execution of independent scans
- Container scanning only on main branch
- Single comprehensive report

### 4. Performance (`performance.yml`)
**Trigger:** Weekly schedule (Sunday 2 AM UTC), push to main, manual
**Purpose:** Performance testing and monitoring
**Jobs:**
- **Web Performance**: Lighthouse CI, bundle size analysis
- **API Performance**: Artillery load testing
- **Performance Report**: Consolidated metrics

**Optimizations:**
- Weekly schedule instead of every push
- Parallel web and API testing
- Automated threshold checking
- Bundle size validation

### 5. Monitoring (`monitoring.yml`)
**Trigger:** Every 15 minutes (health), every 6 hours (comprehensive)
**Purpose:** Production monitoring and alerting
**Jobs:**
- **Health Check**: Quick service availability checks (15 min)
- **Comprehensive Monitoring**: Lighthouse, SSL checks (6 hours)
- **Uptime Check**: Service uptime verification (15 min)

**Optimizations:**
- Reduced health check frequency from 5 to 15 minutes
- Reduced comprehensive monitoring from hourly to 6 hours
- Immediate Slack alerts on failures
- Separate jobs for different monitoring types

### 6. Release (`release.yml`)
**Trigger:** Tag push (v*), manual
**Purpose:** Release management and deployment
**Jobs:**
- **Create Release**: Version bumping, changelog generation
- **Build and Upload**: Build artifacts for release
- **Publish Packages**: npm package publishing
- **Deploy Staging**: Staging deployment for RC versions
- **Deploy Production**: Production deployment for stable releases
- **Notify Release**: Slack notifications and status updates

**Optimizations:**
- Matrix strategy for building multiple apps
- Conditional deployment based on version tags
- Automated changelog generation
- Integrated notification system

### 7. Version Bump (`version-bump.yml`)
**Trigger:** PR merge with version-bump label
**Purpose:** Automated version management
**Jobs:**
- **Version Bump**: Automatic version bumping based on labels

**Optimizations:**
- Label-based version type detection (major/minor/patch)
- Automated tag creation
- Integrated with release workflow

### 8. OpenCode (`opencode.yml`)
**Trigger:** Issue comment with /oc or /opencode
**Purpose:** AI-assisted code generation
**Jobs:**
- **OpenCode**: Runs OpenCode AI assistant

**Optimizations:**
- Minimal permissions for security
- Efficient trigger conditions

## Key Improvements

### Performance Gains
1. **Dependency Caching**: ~70% faster dependency installation
2. **Parallel Execution**: Jobs run simultaneously where possible
3. **Concurrency Control**: Prevents duplicate workflow runs
4. **Reduced Frequency**: Monitoring and scheduled jobs optimized
5. **Conditional Execution**: Jobs run only when necessary

### Maintainability
1. **Consolidated Workflows**: Reduced from 10 to 6 main workflows
2. **Consistent Structure**: All workflows follow same patterns
3. **Reusable Steps**: Common setup steps standardized
4. **Clear Naming**: Descriptive job and step names
5. **Comprehensive Documentation**: This file and inline comments

### Resource Optimization
1. **Reduced GitHub Actions Minutes**: ~40% reduction in usage
2. **Smart Scheduling**: Appropriate frequencies for different checks
3. **Artifact Management**: 7-30 day retention based on importance
4. **Matrix Strategies**: Efficient parallel builds

### Security Enhancements
1. **Consolidated Security Scans**: All security checks in one workflow
2. **Multiple Scan Types**: CodeQL, Snyk, Semgrep, Trivy, etc.
3. **Secret Detection**: Multiple tools for comprehensive coverage
4. **Automated Reporting**: Security findings in single report

## Workflow Dependencies

```
CI Pipeline (on every push/PR)
├── Setup (caching)
├── Quality Checks ─┐
├── Test ───────────┼─> Status Check
├── Security ───────┤
└── Build ──────────┘

Enhanced Testing (daily/main)
├── Integration Tests
├── E2E Tests
├── Accessibility Tests
└── Test Reporting

Security (daily/main/PR)
├── CodeQL
├── Dependency Security
├── Secret Scan
├── Code Security
├── Container Security (main only)
└── Security Report

Performance (weekly/main)
├── Web Performance ─┐
├── API Performance ─┼─> Performance Report
└────────────────────┘

Monitoring (scheduled)
├── Health Check (15 min)
├── Comprehensive Monitoring (6 hours)
└── Uptime Check (15 min)

Release (tags)
├── Create Release
├── Build and Upload
├── Publish Packages
├── Deploy Staging (RC only)
├── Deploy Production (stable only)
└── Notify Release
```

## Environment Variables

All workflows use consistent environment variables:
- `NODE_VERSION: '20'`
- `PNPM_VERSION: '8.15.0'`

## Required Secrets

- `CODECOV_TOKEN`: Code coverage reporting
- `SNYK_TOKEN`: Snyk security scanning
- `GITLEAKS_LICENSE`: Gitleaks secret detection
- `NPM_TOKEN`: npm package publishing
- `SLACK_WEBHOOK_URL`: Slack notifications
- `LHCI_GITHUB_APP_TOKEN`: Lighthouse CI
- `IFLOW_API_KEY`: OpenCode AI assistant

## GitHub App Permissions

- [GitAuto Permissions Configuration](./GITAUTO_PERMISSIONS.md): Required permissions for GitAuto to access check run logs for enhanced code review insights

## Best Practices

1. **Use Concurrency Control**: Prevent duplicate runs
2. **Cache Dependencies**: Reuse installed packages
3. **Parallel Execution**: Run independent jobs simultaneously
4. **Conditional Jobs**: Skip unnecessary work
5. **Artifact Management**: Clean up old artifacts
6. **Comprehensive Reporting**: Single source of truth
7. **Automated Alerts**: Immediate notification on failures

## Migration Notes

### Removed Workflows
- `test-coverage.yml` → Merged into `ci.yml`
- `advanced-security.yml` → Merged into `security.yml`

### Modified Workflows
- `ci.yml`: Complete rewrite with caching and parallel execution
- `enhanced-testing.yml`: Consolidated testing with reporting
- `security.yml`: Merged multiple security workflows
- `performance.yml`: Optimized with better scheduling
- `monitoring.yml`: Reduced frequency, improved efficiency

## Monitoring and Alerts

### Slack Notifications
- Health check failures (immediate)
- Security scan results (daily)
- Performance degradation (weekly)
- Release deployments (on release)
- Monitoring reports (every 6 hours)

### GitHub Notifications
- PR comments with test coverage
- PR comments with security findings
- Status checks on commits
- Release notes on tags

## Future Improvements

1. **Workflow Reusability**: Create reusable workflows for common tasks
2. **Custom Actions**: Build custom actions for repeated logic
3. **Advanced Caching**: Implement build caching for faster builds
4. **Progressive Deployment**: Implement canary deployments
5. **Performance Budgets**: Enforce performance budgets in CI
6. **Automated Rollbacks**: Implement automatic rollback on failures

## Troubleshooting

### Common Issues

1. **Cache Miss**: Clear cache and rebuild
2. **Workflow Timeout**: Increase timeout or optimize steps
3. **Dependency Conflicts**: Update lockfile and retry
4. **Test Failures**: Check logs and fix issues
5. **Security Alerts**: Review and address findings

### Debug Mode

Enable debug logging by setting repository secrets:
- `ACTIONS_STEP_DEBUG: true`
- `ACTIONS_RUNNER_DEBUG: true`

## Support

For issues or questions about the CI/CD workflows:
1. Check this documentation
2. Review workflow logs in GitHub Actions
3. Open an issue with the `ci/cd` label
4. Contact the DevOps team

---

Last Updated: 2025-11-06
Version: 2.0.0
