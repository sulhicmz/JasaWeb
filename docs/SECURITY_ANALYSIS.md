# Security Analysis Implementation Guide

## Overview

This document describes the security analysis implementation for the JasaWeb project, including CodeQL analysis, dependency scanning, secret detection, and code quality security checks.

## Security Workflows

### 1. CodeQL Analysis (`codeql-analysis.yml`)

**Purpose**: Static code analysis for security vulnerabilities and code quality issues.

**Triggers**:

- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Weekly scheduled runs (Sundays at 2 AM UTC)

**Features**:

- Multi-language support (JavaScript/TypeScript)
- Custom configuration in `.github/codeql/codeql-config.yml`
- SARIF output for security alerts
- Integration with GitHub Security tab

**Configuration**:

- Analyzes `apps/api/src`, `apps/web/src`, `packages`, and `scripts`
- Excludes test files, dependencies, and build artifacts
- Uses security and quality query packs
- Enables trap caching for better performance

### 2. Comprehensive Security Analysis (`security-analysis.yml`)

**Purpose**: Multi-layered security scanning including CodeQL, dependencies, secrets, and code quality.

**Triggers**:

- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Daily scheduled runs (3 AM UTC)

**Jobs**:

#### CodeQL Analysis

- Runs CodeQL on JavaScript and TypeScript
- Uploads results to GitHub Security
- Uses custom configuration for optimal results

#### Dependency Security Audit

- Runs `npm audit` on all packages
- Executes custom security scan script
- Identifies known vulnerabilities in dependencies

#### Secret Scanning

- Uses TruffleHog OSS for secret detection
- Scans for hardcoded secrets and credentials
- Checks common patterns (API keys, passwords, tokens)

#### Code Quality Security

- Runs ESLint with security rules
- Checks for unguarded console statements
- Validates security best practices

#### Security Summary

- Generates comprehensive security report
- Provides recommendations for remediation
- Posts results to GitHub step summary

## Branch Protection Integration

### Required Status Checks

For `main` and `release/*` branches:

- `CodeQL` - JavaScript/TypeScript static analysis
- `Dependency Security` - Vulnerability scanning
- `Secret Scanning` - Hardcoded secret detection
- `Code Quality Security` - Security rule validation

### Permissions

Security workflows require:

- `actions: read` - Read workflow actions
- `contents: read` - Read repository contents
- `security-events: write` - Upload security alerts
- `pull-requests: write` - Comment on PRs (for summary)

## Configuration Files

### CodeQL Configuration (`.github/codeql/codeql-config.yml`)

Key settings:

- **Paths**: Analyzes source code, excludes tests and dependencies
- **Queries**: Uses security and quality query packs
- **Languages**: JavaScript and TypeScript
- **Extraction**: Configured for modern JavaScript/TypeScript projects

### Security Script (`scripts/security-scan.js`)

Custom security scanning logic:

- Pattern-based secret detection
- Security best practices validation
- Console statement detection
- Dependency vulnerability checks

## Local Development

### Testing Workflows Locally

Using `act` (GitHub Actions runner):

```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test CodeQL analysis
act -j analyze -s GITHUB_TOKEN=your_token

# Test security analysis
act -j security -s GITHUB_TOKEN=your_token

# Test individual security jobs
act -j codeql -s GITHUB_TOKEN=your_token
act -j dependency-security -s GITHUB_TOKEN=your_token
act -j secret-scan -s GITHUB_TOKEN=your_token
act -j code-quality-security -s GITHUB_TOKEN=your_token
```

### Running Security Scans Manually

```bash
# Run security scan script
chmod +x scripts/security-scan.js
node scripts/security-scan.js

# Run dependency audit
npm audit --audit-level=moderate
cd apps/api && npm audit --audit-level=moderate
cd ../web && npm audit --audit-level=moderate

# Run ESLint security rules
npx eslint . --ext .js,.ts,.tsx --config .eslintrc.js
```

## Monitoring and Alerts

### GitHub Security Tab

- CodeQL alerts appear in the Security tab
- Dependency alerts automatically tracked
- Secret scanning results displayed
- Security overview and trends

### Notifications

- Security failures block PR merges
- Daily security reports via scheduled runs
- Security summaries posted to PRs
- Email notifications for security alerts

## Best Practices

### Code Security

1. **No hardcoded secrets**: Use environment variables
2. **Dependency hygiene**: Regular updates and vulnerability scanning
3. **Input validation**: Validate all user inputs
4. **Error handling**: Don't expose sensitive information in errors
5. **Console statements**: Remove debug statements from production

### Development Workflow

1. **Local testing**: Run security scans before committing
2. **PR validation**: All security checks must pass
3. **Regular updates**: Keep dependencies and tools updated
4. **Security reviews**: Review security alerts regularly
5. **Documentation**: Keep security documentation current

## Troubleshooting

### Common Issues

1. **CodeQL timeouts**: Increase timeout or reduce analysis scope
2. **False positives**: Update CodeQL configuration or suppress alerts
3. **Permission errors**: Check workflow permissions
4. **Dependency conflicts**: Update lockfiles and resolve conflicts

### Debugging

```bash
# Check workflow syntax
yamllint .github/workflows/*.yml

# Validate actions
act --list

# Test specific workflows
act -j codeql --dry-run
act -j security --dry-run
```

## Maintenance

### Regular Tasks

1. **Monthly**: Review and update CodeQL configuration
2. **Weekly**: Check security alerts and trends
3. **Quarterly**: Update security tools and dependencies
4. **As needed**: Respond to security incidents and vulnerabilities

### Updates

- GitHub Actions: Update to latest stable versions
- CodeQL: Use latest query packs and features
- Security tools: Keep scanning tools updated
- Documentation: Maintain current security practices

## Compliance

This security implementation helps maintain compliance with:

- OWASP Top 10 security practices
- Industry security standards
- GitHub security best practices
- Software supply chain security

## Support

For security-related issues:

1. Check GitHub Security tab for alerts
2. Review workflow run logs for failures
3. Consult this documentation for guidance
4. Create security issue for critical problems
