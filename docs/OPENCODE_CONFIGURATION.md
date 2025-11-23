# OpenCode CLI Configuration Guide

## Overview

This guide provides comprehensive configuration instructions for OpenCode CLI workflows in JasaWeb project. All workflows require proper environment variables and secrets to function correctly.

## Required Environment Variables

### GitHub Token (GH_TOKEN)

**Purpose**: Authentication for GitHub API operations

**Required Permissions**:
- `contents: write` - Modify repository contents
- `issues: write` - Create and manage issues
- `pull-requests: write` - Create and manage pull requests
- `actions: write` - Manage GitHub Actions
- `id-token: write` - OIDC authentication
- `security-events: write` - Upload security findings

**Setup Steps**:

1. **Generate Personal Access Token**:
   ```bash
   # Go to GitHub Settings > Developer settings > Personal access tokens
   # Click "Generate new token (classic)"
   # Select following permissions:
   # - repo (Full control)
   # - workflow (Update GitHub Action workflows)
   # - write:packages (Write packages)
   # - read:packages (Read packages)
   # - admin:org (Read and write org and team membership)
   # - admin:public_key (Read and write public keys)
   # - admin:repo_hook (Read and write repo hooks)
   # - user (Read and write user profile data)
   # - delete_repo (Delete repositories)
   # - write:discussion (Read and write discussions)
   # - read:discussion (Read discussions)
   # - write:org (Read and write org and team membership)
   # - read:org (Read org and team membership)
   ```

2. **Add to Repository Secrets**:
   ```bash
   # Go to repository Settings > Secrets and variables > Actions
   # Click "New repository secret"
   # Name: GH_TOKEN
   # Value: [Your generated token]
   # Click "Add secret"
   ```

### OpenCode API Key (IFLOW_API_KEY)

**Purpose**: Authentication for OpenCode CLI API

**Setup Steps**:

1. **Get OpenCode API Key**:
   ```bash
   # Login to OpenCode CLI dashboard
   # Navigate to API Keys section
   # Generate new API key
   # Copy the key value
   ```

2. **Add to Repository Secrets**:
   ```bash
   # Go to repository Settings > Secrets and variables > Actions
   # Click "New repository secret"
   # Name: IFLOW_API_KEY
   # Value: [Your OpenCode API key]
   # Click "Add secret"
   ```

## Workflow Configuration

### Self-Hosted Runner Setup

**Requirements**:
- Linux, macOS, or Windows
- Node.js 20+
- Docker (optional but recommended)
- Internet access

**Setup Steps**:

1. **Download and Configure Runner**:
   ```bash
   # Linux/macOS
   mkdir actions-runner && cd actions-runner
   curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
   tar xzf ./actions-runner.tar.gz
   ./config.sh --url https://github.com/[owner]/[repo] --token [RUNNER_TOKEN]
   
   # Windows
   mkdir actions-runner && cd actions-runner
   Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip -OutFile actions-runner.zip
   Add-Type -AssemblyName System.IO.Compression.FileSystem
   [System.IO.Compression.ZipFile]::ExtractToDirectory("actions-runner.zip", "$PWD")
   ./config.cmd --url https://github.com/[owner]/[repo] --token [RUNNER_TOKEN]
   ```

2. **Install and Start Runner**:
   ```bash
   # Linux/macOS
   sudo ./svc.sh install
   sudo ./svc.sh start
   
   # Windows
   ./svc.cmd install
   ./svc.cmd start
   ```

3. **Configure Runner Labels**:
   ```bash
   # Add labels for better workflow targeting
   # Labels: self-hosted, opencode, jasaweb
   ```

### Repository Permissions

**Workflow Permissions Configuration**:

```yaml
permissions:
  id-token: write          # Required for OIDC authentication
  contents: write           # Required for code modifications
  issues: write             # Required for issue management
  pull-requests: write     # Required for PR management
  actions: write           # Required for workflow management
  security-events: write    # Required for security findings
```

**Repository Settings**:

1. **Enable Actions**:
   - Go to Settings > Actions > General
   - Ensure "Actions" is enabled
   - Allow "GitHub Actions" to create and approve pull requests

2. **Branch Protection Rules**:
   ```bash
   # Go to Settings > Branches > Add branch protection rule
   # Branch name pattern: main
   # Require status checks to pass before merging
   # Require branches to be up to date before merging
   # Require pull request reviews before merging
   # Include administrators for branch protection
   ```

3. **Workflow Permissions**:
   ```bash
   # Go to Settings > Actions > General
   # Workflow permissions: Read and write permissions
   # Allow GitHub Actions to create and approve pull requests
   # Allow GitHub Actions to run approved pull requests from forks
   ```

## Environment Configuration Files

### Development Environment

**`.env.local`** (for local development):
```bash
# GitHub Configuration
GH_TOKEN=your_personal_access_token
GITHUB_REPOSITORY=owner/repo
GITHUB_OWNER=owner

# OpenCode Configuration
IFLOW_API_KEY=your_opencode_api_key
IFLOW_MODEL=iflowcn/qwen3-max

# Development Settings
NODE_ENV=development
DEBUG=true
VERBOSE=true
```

**`.env.example`** (template for team):
```bash
# GitHub Configuration
GH_TOKEN=your_github_token_here
GITHUB_REPOSITORY=your-username/your-repo
GITHUB_OWNER=your-username

# OpenCode Configuration
IFLOW_API_KEY=your_opencode_api_key_here
IFLOW_MODEL=iflowcn/qwen3-max

# Application Settings
NODE_ENV=production
DEBUG=false
VERBOSE=false
```

### Production Environment

**Repository Secrets** (for production):
```bash
# Required Secrets
GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
IFLOW_API_KEY=iflow_xxxxxxxxxxxxxxxxxxxx

# Optional Secrets
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your_jwt_secret_here
SMTP_PASSWORD=your_smtp_password_here
```

## Workflow Customization

### Model Selection

**Available Models**:
- `iflowcn/qwen3-max` - Best for complex analysis and planning
- `iflowcn/qwen3-coder-plus` - Best for code implementation
- `iflowcn/qwen3-coder` - Best for simple fixes and optimizations
- `iflowcn/qwen3-235b` - Best for large-scale analysis
- `iflowcn/deepseek-v3.2` - Alternative for code tasks

**Model Selection Guidelines**:
```yaml
# For complex analysis and planning
--model iflowcn/qwen3-max

# For code implementation and fixes
--model iflowcn/qwen3-coder-plus

# For simple optimizations
--model iflowcn/qwen3-coder

# For large-scale refactoring
--model iflowcn/qwen3-235b
```

### Schedule Configuration

**Workflow Schedules**:
```yaml
# Maintenance & Monitoring - Every 6 hours
schedule:
  - cron: '0 */6 * * *'

# Security Scanning - Daily at 2 AM UTC
schedule:
  - cron: '0 2 * * *'

# Code Quality & Testing - Every 4 hours
schedule:
  - cron: '0 */4 * * *'

# Autonomous Developer - Every 8 hours
schedule:
  - cron: '0 */8 * * *'
```

### Timeout Configuration

**Recommended Timeouts**:
```yaml
# Simple tasks (linting, formatting)
timeout-minutes: 10

# Complex tasks (analysis, implementation)
timeout-minutes: 30

# Comprehensive tasks (full development cycle)
timeout-minutes: 60
```

## Security Configuration

### Secret Management

**Best Practices**:
1. **Rotate secrets regularly** (every 90 days)
2. **Use least privilege principle**
3. **Monitor secret usage**
4. **Audit access logs**
5. **Use repository secrets, not environment variables**

**Secret Rotation**:
```bash
# GitHub Token Rotation
# 1. Generate new token
# 2. Update repository secret
# 3. Update any local configurations
# 4. Revoke old token

# OpenCode API Key Rotation
# 1. Generate new API key
# 2. Update repository secret
# 3. Update any local configurations
# 4. Revoke old API key
```

### Security Scanning

**Security Workflow Configuration**:
```yaml
# Security scan levels
scan_level:
  - quick      # Basic security checks
  - standard   # Comprehensive security analysis
  - comprehensive # Full security assessment
  - deep       # In-depth security review

# Focus areas
focus_area:
  - all           # Complete security scan
  - dependencies  # Dependency vulnerability scan
  - code          # Code security analysis
  - infrastructure # Infrastructure security review
  - secrets       # Secrets detection
```

## Monitoring and Alerting

### Workflow Monitoring

**Metrics to Track**:
- Workflow success rate
- Average execution time
- Token usage and cost
- Error rates and patterns
- Performance improvements

**Alert Configuration**:
```yaml
# Success rate alerts
- Alert if success rate < 95%
- Alert if execution time > threshold
- Alert if token usage spikes
- Alert if error rate increases
```

### Dashboard Configuration

**Performance Dashboard**:
```html
<!-- docs/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>JasaWeb OpenCode Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h1>OpenCode Automation Dashboard</h1>
    <div id="metrics"></div>
    <script>
        // Dashboard JavaScript code
        // Real-time metrics display
        // Performance charts
        // Alert notifications
    </script>
</body>
</html>
```

## Troubleshooting

### Common Issues

**1. Authentication Failures**:
```bash
# Check token validity
gh auth status

# Refresh token
gh auth refresh

# Verify permissions
gh auth status --show-token
```

**2. Runner Issues**:
```bash
# Check runner status
sudo ./svc.sh status

# Restart runner
sudo ./svc.sh restart

# Check logs
sudo journalctl -u actions.runner
```

**3. Workflow Failures**:
```bash
# Check workflow logs
gh run list --limit 10

# Debug specific run
gh run view [run-id]

# Re-run failed workflow
gh run rerun [run-id]
```

**4. OpenCode CLI Issues**:
```bash
# Check CLI version
opencode --version

# Verify API key
opencode account info

# Test CLI functionality
opencode run "test" --model iflowcn/qwen3-coder
```

### Debug Mode

**Enable Debug Logging**:
```yaml
env:
  DEBUG: true
  VERBOSE: true
  OPENCODE_DEBUG: true
```

**Debug Workflow**:
```yaml
# Add debug steps
- name: Debug Environment
  run: |
    echo "GitHub Token: ${GH_TOKEN:0:10}..."
    echo "API Key: ${IFLOW_API_KEY:0:10}..."
    echo "Runner OS: $RUNNER_OS"
    echo "Workspace: $GITHUB_WORKSPACE"
```

## Best Practices

### Development Workflow

**1. Local Development**:
```bash
# Use environment file for local development
cp .env.example .env.local
# Edit .env.local with your tokens
# Never commit .env.local
```

**2. Testing Workflows**:
```bash
# Test workflows locally
act -j issue-solver
act -j pr-automator
act -j autonomous-developer
```

**3. Monitoring**:
```bash
# Monitor workflow performance
gh run list --limit 50
gh run view [run-id] --log
```

### Performance Optimization

**1. Token Usage**:
```yaml
# Use appropriate models for tasks
--model iflowcn/qwen3-coder      # Simple fixes
--model iflowcn/qwen3-coder-plus   # Code implementation
--model iflowcn/qwen3-max         # Complex analysis
```

**2. Caching**:
```yaml
# Cache dependencies
- uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

**3. Parallel Execution**:
```yaml
# Run tasks in parallel where possible
strategy:
  matrix:
    task: [lint, test, build]
```

## Support

### Documentation

- [OpenCode CLI Documentation](https://opencode.ai/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [JasaWeb Project Documentation](./README.md)

### Community Support

- OpenCode CLI Discord
- GitHub Actions Community Forum
- JasaWeb GitHub Discussions

### Issue Reporting

For configuration issues:
1. Check this documentation first
2. Review workflow logs
3. Create issue with `configuration` label
4. Include error details and environment info

---

*This configuration guide is maintained by the OpenCode automation system and updated automatically.*