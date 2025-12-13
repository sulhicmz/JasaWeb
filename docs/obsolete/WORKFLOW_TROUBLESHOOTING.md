# GitHub Actions Workflow Troubleshooting Guide

## 📋 Table of Contents

- [Common Issues](#common-issues)
- [Diagnostic Steps](#diagnostic-steps)
- [Specific Workflow Issues](#specific-workflow-issues)
- [Performance Optimization](#performance-optimization)
- [Emergency Procedures](#emergency-procedures)
- [Preventive Measures](#preventive-measures)

## 🚨 Common Issues

### 1. Pnpm Setup Failure

**Symptoms:**

```
Error: Unable to locate executable file: pnpm
```

**Causes:**

- Incorrect setup order (Node.js before pnpm)
- Missing pnpm action configuration
- Cache configuration issues

**Solutions:**

```yaml
# Correct order:
- name: Setup pnpm
  uses: pnpm/action-setup@v3
  with:
    version: 8.15.0

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'
```

### 2. Timeout Issues

**Symptoms:**

```
The operation was timed out
```

**Causes:**

- Insufficient timeout configuration
- Long-running OpenCode CLI operations
- Network latency issues

**Solutions:**

- Increase timeout values appropriately
- Optimize OpenCode CLI prompts
- Implement retry mechanisms

### 3. Permission Errors

**Symptoms:**

```
Error: Permission denied
Resource not accessible by integration
```

**Causes:**

- Insufficient workflow permissions
- Missing token configurations
- Repository access restrictions

**Solutions:**

```yaml
permissions:
  id-token: write
  contents: write
  pull-requests: write
  issues: write
  actions: write
```

### 4. OpenCode CLI Failures

**Symptoms:**

```
opencode: command not found
OpenCode API errors
Model execution failures
```

**Causes:**

- Incorrect OpenCode CLI installation
- API key issues
- Model selection problems

**Solutions:**

```yaml
- name: Install OpenCode CLI
  run: |
    curl -fsSL https://opencode.ai/install | bash
    echo "$HOME/.opencode/bin" >> $GITHUB_PATH
```

## 🔍 Diagnostic Steps

### Step 1: Check Workflow Logs

1. Navigate to Actions tab in GitHub
2. Select failed workflow run
3. Review error messages and timestamps
4. Identify failure point in workflow sequence

### Step 2: Verify Configuration

1. Check workflow YAML syntax
2. Verify environment variables
3. Confirm secrets configuration
4. Validate action versions

### Step 3: Test Individual Components

1. Run workflow steps manually
2. Test OpenCode CLI installation
3. Verify pnpm setup sequence
4. Check Node.js configuration

### Step 4: Monitor Resources

1. Check runner resource usage
2. Monitor network connectivity
3. Verify API rate limits
4. Review storage availability

## 🔧 Specific Workflow Issues

### oc - PR Automator

**Common Issues:**

- PR checkout failures
- Comment permission errors
- Auto-merge conflicts

**Troubleshooting:**

```yaml
# Ensure proper checkout configuration
- name: Checkout
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.GH_TOKEN }}
```

### oc - Efficient Automator

**Common Issues:**

- Self-hosted runner connectivity
- Concurrency conflicts
- Resource exhaustion

**Troubleshooting:**

```yaml
# Verify runner configuration
runs-on: self-hosted
timeout-minutes: 25

# Check concurrency settings
concurrency:
  group: ${{ github.workflow }}-global
  cancel-in-progress: false
```

### oc - Code Quality & Testing

**Common Issues:**

- Test execution timeouts
- Coverage report failures
- Quality check errors

**Troubleshooting:**

- Optimize test execution time
- Verify coverage configuration
- Check quality gate settings

### oc - Autonomous Developer

**Common Issues:**

- Branch creation conflicts
- Commit permission errors
- Model execution timeouts

**Troubleshooting:**

- Verify branch naming conventions
- Check commit permissions
- Optimize OpenCode prompts

### oc - Maintenance & Monitoring

**Common Issues:**

- Dependency update conflicts
- Security scan failures
- Report generation errors

**Troubleshooting:**

- Review dependency compatibility
- Check security scan configurations
- Verify report templates

### oc - Security Scanning

**Common Issues:**

- SARIF upload failures
- Security tool errors
- Policy update conflicts

**Troubleshooting:**

- Verify SARIF configuration
- Check security tool versions
- Review policy syntax

### oc - Issue Solver

**Common Issues:**

- Issue access permissions
- Branch creation failures
- PR merge conflicts

**Troubleshooting:**

- Verify issue permissions
- Check branch protection rules
- Review merge requirements

## ⚡ Performance Optimization

### 1. Reduce Execution Time

**Strategies:**

- Optimize OpenCode CLI prompts
- Use appropriate model sizes
- Implement parallel processing
- Cache frequently used data

**Example:**

```yaml
# Use smaller models for simple tasks
--model iflowcn/qwen3-coder

# Use larger models for complex analysis
--model iflowcn/qwen3-max
```

### 2. Resource Management

**Best Practices:**

- Set appropriate timeout values
- Monitor memory usage
- Optimize runner selection
- Implement cleanup procedures

### 3. Caching Strategies

**Implementation:**

```yaml
# Enable dependency caching
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'
```

## 🚑 Emergency Procedures

### 1. Critical Workflow Failure

**Immediate Actions:**

1. Disable problematic workflows
2. Switch to manual processing
3. Communicate status to team
4. Implement temporary fixes

**Commands:**

```bash
# Disable workflow
gh workflow disable <workflow-id>

# Manual PR processing
gh pr view <pr-number>
gh pr review <pr-number> --approve
gh pr merge <pr-number> --merge
```

### 2. Security Incident Response

**Steps:**

1. Identify affected workflows
2. Review recent changes
3. Check for credential exposure
4. Implement security fixes

### 3. Performance Degradation

**Actions:**

1. Monitor execution times
2. Identify bottlenecks
3. Optimize resource usage
4. Scale runner capacity

## 🛡️ Preventive Measures

### 1. Regular Maintenance

**Schedule:**

- Weekly workflow reviews
- Monthly dependency updates
- Quarterly performance audits
- Annual security assessments

### 2. Monitoring Setup

**Implementation:**

- Real-time workflow monitoring
- Alert configuration
- Performance metrics tracking
- Error pattern analysis

### 3. Documentation Updates

**Requirements:**

- Keep troubleshooting guides current
- Document known issues and solutions
- Maintain change logs
- Provide training materials

### 4. Testing Procedures

**Best Practices:**

- Test workflow changes in staging
- Validate configuration updates
- Perform load testing
- Review security implications

## 📊 Monitoring Metrics

### Key Performance Indicators

1. **Success Rate**
   - Target: >95%
   - Measurement: Daily/Weekly/Monthly

2. **Average Execution Time**
   - Target: Within timeout limits
   - Measurement: Per workflow type

3. **Error Rate**
   - Target: <5%
   - Measurement: By error type

4. **Resource Utilization**
   - Target: <80% capacity
   - Measurement: CPU/Memory/Storage

### Alert Thresholds

**Critical Alerts:**

- Success rate <80%
- Consecutive failures >3
- Security scan failures
- Timeout rate >10%

**Warning Alerts:**

- Success rate 80-95%
- Performance degradation >20%
- Resource usage >70%
- Error rate 5-10%

## 🔗 Additional Resources

### Documentation

- [Workflow Error Analysis](WORKFLOW_ERROR_ANALYSIS_AND_FIXES.md)
- [Security Best Practices](SECURITY_BEST_PRACTICES.md)
- [OpenCode CLI Documentation](https://opencode.ai/docs)

### Tools and Utilities

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Actions Marketplace](https://github.com/marketplace?type=actions)
- [Workflow Syntax Validator](https://github.com/sdras/awesome-actions)

### Community Support

- [GitHub Actions Community Forum](https://github.community/c/code-to-cloud/github-actions)
- [OpenCode CLI Support](https://opencode.ai/support)
- [JasaWeb Project Discussions](https://github.com/sulhicmz/JasaWeb/discussions)

---

**Last Updated**: 2025-11-23  
**Version**: 1.0  
**Maintainer**: OpenCode CLI Automation Team
