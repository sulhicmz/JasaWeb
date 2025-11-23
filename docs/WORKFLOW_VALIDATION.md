# Workflow Validation Guide

## Overview

This guide provides comprehensive testing and validation procedures for all OpenCode CLI workflows implemented in JasaWeb project. Proper validation ensures workflows function correctly and deliver expected results.

## Validation Checklist

### Pre-Validation Requirements

**1. Environment Setup**:
- [ ] GitHub token configured with proper permissions
- [ ] OpenCode API key configured and valid
- [ ] Self-hosted runner installed and running
- [ ] Repository permissions configured correctly
- [ ] All required secrets added to repository

**2. Dependencies**:
- [ ] Node.js 20+ installed on runner
- [ ] pnpm 8.15.0+ installed
- [ ] OpenCode CLI installed and accessible
- [ ] Git configured with proper credentials
- [ ] Internet connectivity available

**3. Repository Configuration**:
- [ ] Branch protection rules configured
- [ ] Workflow permissions set correctly
- [ ] Actions enabled in repository
- [ ] Required secrets created
- [ ] Runner labels configured properly

## Workflow-Specific Validation

### 1. Maintenance & Monitoring Workflow (`oc-maintenance-monitoring.yml`)

**Validation Steps**:

1. **Manual Trigger Test**:
   ```bash
   # Trigger workflow manually
   gh workflow run oc-maintenance-monitoring \
     --field maintenance_type=quick
   
   # Monitor execution
   gh run view --log
   ```

2. **Schedule Test**:
   ```bash
   # Check scheduled execution
   gh run list --workflow=oc-maintenance-monitoring
   
   # Verify timing
   gh run view [run-id] --log
   ```

3. **Functionality Validation**:
   - [ ] System health check runs successfully
   - [ ] Performance analysis completes
   - [ ] Dependency maintenance executes
   - [ ] Code quality maintenance runs
   - [ ] Maintenance report generated
   - [ ] Dashboard updated correctly
   - [ ] Next maintenance scheduled

4. **Output Validation**:
   - [ ] Health report created with metrics
   - [ ] Performance improvements identified
   - [ ] Dependency updates applied
   - [ ] Code quality fixes implemented
   - [ ] Dashboard data updated
   - [ ] Issues created for critical findings

**Expected Results**:
- System health status documented
- Performance metrics collected
- Dependencies updated and secured
- Code quality improvements implemented
- Dashboard refreshed with latest data
- Next maintenance cycle scheduled

### 2. Security Scanning Workflow (`oc-security-scanning.yml`)

**Validation Steps**:

1. **Manual Trigger Test**:
   ```bash
   # Trigger with different scan levels
   gh workflow run oc-security-scanning \
     --field scan_level=quick \
     --field focus_area=dependencies
   
   # Monitor execution
   gh run view --log
   ```

2. **Security Scan Validation**:
   - [ ] Dependency security scan runs
   - [ ] Code security analysis completes
   - [ ] Infrastructure security scan executes
   - [ ] Secrets detection runs successfully
   - [ ] Security report generated
   - [ ] Security policies updated
   - [ ] Security metrics created

3. **Security Output Validation**:
   - [ ] Vulnerabilities identified and categorized
   - [ ] Security issues fixed or documented
   - [ ] SARIF reports uploaded to GitHub
   - [ ] Security policies updated
   - [ ] Metrics dashboard populated
   - [ ] Critical issues created as GitHub issues

**Expected Results**:
- Comprehensive security assessment completed
- Vulnerabilities identified and prioritized
- Security fixes implemented
- Security policies updated
- Security metrics tracked
- Next security scan scheduled

### 3. Code Quality & Testing Workflow (`oc-code-quality-testing.yml`)

**Validation Steps**:

1. **Manual Trigger Test**:
   ```bash
   # Trigger with different test levels
   gh workflow run oc-code-quality-testing \
     --field test_level=standard \
     --field focus_area=all
   
   # Monitor execution
   gh run view --log
   ```

2. **Quality Check Validation**:
   - [ ] Code quality analysis runs
   - [ ] Unit testing executes
   - [ ] Integration testing completes
   - [ ] Performance testing runs
   - [ ] Accessibility testing executes
   - [ ] Quality report generated

3. **Testing Output Validation**:
   - [ ] Code quality metrics collected
   - [ ] Test coverage measured
   - [ ] Performance benchmarks established
   - [ ] Accessibility compliance verified
   - [ ] Quality improvements implemented
   - [ ] Testing standards updated

**Expected Results**:
- Code quality score calculated
- Test coverage measured and improved
- Performance benchmarks established
- Accessibility compliance verified
- Quality standards updated
- Next quality cycle scheduled

### 4. Issue Solver Workflow (`oc-issue-solver.yml`)

**Validation Steps**:

1. **Test Issue Creation**:
   ```bash
   # Create test issue
   gh issue create \
     --title "Test Issue for Validation" \
     --body "This is a test issue for validating the issue solver workflow." \
     --label "test,validation"
   
   # Monitor workflow trigger
   gh run list --workflow=oc-issue-solver
   ```

2. **Issue Resolution Validation**:
   - [ ] Issue analysis completes
   - [ ] Solution implemented
   - [ ] Tests added and pass
   - [ ] Pull request created
   - [ ] Auto-merge process executes
   - [ ] Issue closed automatically

3. **Resolution Output Validation**:
   - [ ] Branch created for fix
   - [ ] Code changes implemented
   - [ ] Tests added and passing
   - [ ] PR created with proper description
   - [ ] Issue linked to PR
   - [ ] Issue closed after merge

**Expected Results**:
- Issue analyzed and categorized
- Solution implemented correctly
- Tests added and passing
- PR created and merged
- Issue resolved and closed
- Resolution documented

### 5. PR Automator Workflow (`oc-pr-automator.yml`)

**Validation Steps**:

1. **Test PR Creation**:
   ```bash
   # Create test branch and PR
   git checkout -b test-pr-validation
   echo "// Test change" >> test.js
   git add test.js
   git commit -m "Test PR for validation"
   git push origin test-pr-validation
   gh pr create --title "Test PR Validation" --body "Test PR for workflow validation"
   
   # Monitor workflow trigger
   gh run list --workflow=oc-pr-automator
   ```

2. **PR Processing Validation**:
   - [ ] PR analysis completes
   - [ ] Code quality checks run
   - [ ] Tests execute successfully
   - [ ] Auto-fixes applied
   - [ ] Review generated
   - [ ] Auto-merge evaluated

3. **PR Output Validation**:
   - [ ] Code quality issues fixed
   - [ ] Tests passing
   - [ ] Review comments added
   - [ ] PR status updated
   - [ ] Auto-merge executed if conditions met

**Expected Results**:
- PR analyzed and categorized
- Code quality issues fixed
- Tests passing
- Review generated
- PR processed efficiently
- Auto-merge if appropriate

### 6. Autonomous Developer Workflow (`oc-autonomous-developer.yml`)

**Validation Steps**:

1. **Manual Trigger Test**:
   ```bash
   # Trigger with different development types
   gh workflow run oc-autonomous-developer \
     --field development_type=comprehensive \
     --field priority=balanced
   
   # Monitor execution
   gh run view --log
   ```

2. **Development Validation**:
   - [ ] Project state analysis completes
   - [ ] Features implemented
   - [ ] Bugs fixed
   - [ ] Performance optimized
   - [ ] Documentation improved
   - [ ] Development report generated

3. **Development Output Validation**:
   - [ ] New features implemented
   - [ ] Critical bugs resolved
   - [ ] Performance improvements made
   - [ ] Documentation enhanced
   - [ ] Development metrics collected

**Expected Results**:
- Project analyzed thoroughly
- Features implemented successfully
- Bugs identified and fixed
- Performance optimized
- Documentation improved
- Development report generated

## Automated Validation Scripts

### Validation Script

Create `scripts/validate-workflows.sh`:

```bash
#!/bin/bash

# Workflow Validation Script
set -e

echo "🔍 Starting OpenCode Workflow Validation..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check GitHub token
if [ -z "$GH_TOKEN" ]; then
    echo "❌ GH_TOKEN not set"
    exit 1
else
    echo "✅ GH_TOKEN configured"
fi

# Check OpenCode API key
if [ -z "$IFLOW_API_KEY" ]; then
    echo "❌ IFLOW_API_KEY not set"
    exit 1
else
    echo "✅ IFLOW_API_KEY configured"
fi

# Check OpenCode CLI
if ! command -v opencode &> /dev/null; then
    echo "❌ OpenCode CLI not installed"
    exit 1
else
    echo "✅ OpenCode CLI installed"
fi

# Test workflows
echo "🧪 Testing workflows..."

# Test Issue Solver
echo "Testing Issue Solver..."
gh workflow run oc-issue-solver --field issue_number=test
sleep 30
ISSUE_SOLVER_STATUS=$(gh run list --workflow=oc-issue-solver --limit=1 --json | jq -r '.[0].status')
if [ "$ISSUE_SOLVER_STATUS" = "completed" ]; then
    echo "✅ Issue Solver workflow working"
else
    echo "❌ Issue Solver workflow failed"
fi

# Test PR Automator
echo "Testing PR Automator..."
gh workflow run oc-pr-automator --field pr_number=test
sleep 30
PR_AUTOMATOR_STATUS=$(gh run list --workflow=oc-pr-automator --limit=1 --json | jq -r '.[0].status')
if [ "$PR_AUTOMATOR_STATUS" = "completed" ]; then
    echo "✅ PR Automator workflow working"
else
    echo "❌ PR Automator workflow failed"
fi

# Test Security Scanning
echo "Testing Security Scanning..."
gh workflow run oc-security-scanning --field scan_level=quick
sleep 60
SECURITY_SCAN_STATUS=$(gh run list --workflow=oc-security-scanning --limit=1 --json | jq -r '.[0].status')
if [ "$SECURITY_SCAN_STATUS" = "completed" ]; then
    echo "✅ Security Scanning workflow working"
else
    echo "❌ Security Scanning workflow failed"
fi

echo "🎉 Workflow validation completed!"
```

### Health Check Script

Create `scripts/health-check.sh`:

```bash
#!/bin/bash

# Workflow Health Check Script
set -e

echo "🏥 OpenCode Workflow Health Check"

# Check recent workflow runs
echo "📊 Checking recent workflow runs..."

WORKFLOWS=(
    "oc-maintenance-monitoring"
    "oc-security-scanning"
    "oc-code-quality-testing"
    "oc-issue-solver"
    "oc-pr-automator"
    "oc-autonomous-developer"
)

for workflow in "${WORKFLOWS[@]}"; do
    echo "Checking $workflow..."
    
    # Get latest run
    LATEST_RUN=$(gh run list --workflow="$workflow" --limit=1 --json)
    STATUS=$(echo "$LATEST_RUN" | jq -r '.[0].status')
    CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.[0].conclusion')
    
    if [ "$STATUS" = "completed" ] && [ "$CONCLUSION" = "success" ]; then
        echo "✅ $workflow: Healthy"
    elif [ "$STATUS" = "in_progress" ]; then
        echo "🔄 $workflow: Running"
    else
        echo "❌ $workflow: Failed ($CONCLUSION)"
    fi
done

echo "🏥 Health check completed!"
```

## Performance Validation

### Performance Metrics

**Key Performance Indicators**:

1. **Execution Time**:
   - Issue Solver: < 30 minutes
   - PR Automator: < 45 minutes
   - Security Scanning: < 60 minutes
   - Code Quality: < 50 minutes
   - Maintenance: < 60 minutes
   - Autonomous Developer: < 60 minutes

2. **Success Rate**:
   - All workflows: > 95%
   - Critical workflows: > 99%

3. **Resource Usage**:
   - CPU usage: < 80%
   - Memory usage: < 85%
   - Disk usage: < 90%

### Performance Testing

```bash
# Performance test script
echo "🚀 Running performance validation..."

# Test each workflow with timing
start_time=$(date +%s)

gh workflow run oc-maintenance-monitoring --field maintenance_type=quick

# Wait for completion
while true; do
    status=$(gh run list --workflow=oc-maintenance-monitoring --limit=1 --json | jq -r '.[0].status')
    if [ "$status" = "completed" ]; then
        break
    fi
    sleep 10
done

end_time=$(date +%s)
duration=$((end_time - start_time))

if [ $duration -lt 3600 ]; then
    echo "✅ Performance test passed (${duration}s)"
else
    echo "❌ Performance test failed (${duration}s)"
fi
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
gh run view [run-id] --log

# Re-run failed workflow
gh run rerun [run-id]
```

**4. OpenCode CLI Issues**:
```bash
# Check CLI version
opencode --version

# Test CLI functionality
opencode run "test" --model iflowcn/qwen3-coder

# Verify API key
opencode account info
```

### Debug Mode

Enable debug mode for troubleshooting:

```yaml
env:
  DEBUG: true
  VERBOSE: true
  OPENCODE_DEBUG: true
```

Add debug steps to workflows:

```yaml
- name: Debug Environment
  run: |
    echo "GitHub Token: ${GH_TOKEN:0:10}..."
    echo "API Key: ${IFLOW_API_KEY:0:10}..."
    echo "Runner OS: $RUNNER_OS"
    echo "Workspace: $GITHUB_WORKSPACE"
```

## Continuous Monitoring

### Monitoring Dashboard

Create `docs/monitoring-dashboard.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>OpenCode Workflow Monitoring</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { background-color: #d4edda; color: #155724; }
        .warning { background-color: #fff3cd; color: #856404; }
        .error { background-color: #f8d7da; color: #721c24; }
        .chart { margin-top: 20px; }
    </style>
</head>
<body>
    <h1>OpenCode Workflow Monitoring Dashboard</h1>
    
    <div class="dashboard">
        <div class="card">
            <h2>Workflow Status</h2>
            <div id="workflow-status"></div>
        </div>
        
        <div class="card">
            <h2>Performance Metrics</h2>
            <div id="performance-metrics"></div>
        </div>
        
        <div class="card">
            <h2>Success Rate</h2>
            <canvas id="success-rate-chart" class="chart"></canvas>
        </div>
        
        <div class="card">
            <h2>Execution Time</h2>
            <canvas id="execution-time-chart" class="chart"></canvas>
        </div>
    </div>
    
    <script>
        // Fetch workflow data from GitHub API
        async function fetchWorkflowData() {
            // Implementation for fetching workflow data
            // Update dashboard with real-time data
        }
        
        // Initialize dashboard
        fetchWorkflowData();
        setInterval(fetchWorkflowData, 30000); // Update every 30 seconds
    </script>
</body>
</html>
```

### Alert Configuration

Set up alerts for workflow failures:

```yaml
# .github/workflows/workflow-alerts.yml
name: Workflow Alerts

on:
  workflow_run:
    workflows: ["oc-*"]
    types: [completed]

jobs:
  alert-on-failure:
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    steps:
      - name: Send Alert
        run: |
          # Send alert notification
          echo "Workflow ${{ github.event.workflow_run.name }} failed"
          # Implement notification logic (email, Slack, etc.)
```

## Validation Report

### Report Template

Create `docs/validation-report.md`:

```markdown
# OpenCode Workflow Validation Report

## Validation Summary

**Date**: [Date of validation]
**Validator**: [Name/Team]
**Environment**: [Development/Staging/Production]

## Workflow Validation Results

### 1. Maintenance & Monitoring
- **Status**: [✅/❌]
- **Execution Time**: [X minutes]
- **Issues Found**: [Number]
- **Recommendations**: [List]

### 2. Security Scanning
- **Status**: [✅/❌]
- **Vulnerabilities Found**: [Number]
- **Critical Issues**: [Number]
- **Fixes Applied**: [Number]

### 3. Code Quality & Testing
- **Status**: [✅/❌]
- **Code Quality Score**: [X/10]
- **Test Coverage**: [X%]
- **Issues Fixed**: [Number]

### 4. Issue Solver
- **Status**: [✅/❌]
- **Issues Processed**: [Number]
- **Resolution Rate**: [X%]
- **Average Resolution Time**: [X minutes]

### 5. PR Automator
- **Status**: [✅/❌]
- **PRs Processed**: [Number]
- **Auto-merge Rate**: [X%]
- **Quality Improvements**: [Number]

### 6. Autonomous Developer
- **Status**: [✅/❌]
- **Features Implemented**: [Number]
- **Bugs Fixed**: [Number]
- **Performance Improvements**: [Number]

## Overall Assessment

### Health Score: [X/100]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

### Next Steps
1. [Next step 1]
2. [Next step 2]
3. [Next step 3]

## Validation Evidence

- [Link to workflow runs]
- [Link to test results]
- [Link to monitoring dashboard]
- [Screenshots if applicable]

---

*This report was generated automatically by the OpenCode validation system.*
```

## Best Practices

### Validation Best Practices

1. **Regular Validation**:
   - Validate workflows weekly
   - Test after any changes
   - Monitor performance continuously
   - Document all validation results

2. **Comprehensive Testing**:
   - Test all workflow triggers
   - Validate all output formats
   - Check error handling
   - Verify integration points

3. **Performance Monitoring**:
   - Track execution times
   - Monitor resource usage
   - Set up alerts for failures
   - Analyze trends over time

4. **Documentation**:
   - Document validation procedures
   - Maintain validation history
   - Update documentation regularly
   - Share findings with team

### Continuous Improvement

1. **Feedback Loop**:
   - Collect feedback from users
   - Monitor workflow effectiveness
   - Identify improvement opportunities
   - Implement changes systematically

2. **Optimization**:
   - Optimize slow workflows
   - Reduce resource usage
   - Improve error handling
   - Enhance monitoring capabilities

3. **Scaling**:
   - Plan for increased load
   - Optimize for larger repositories
   - Implement caching strategies
   - Consider distributed execution

---

*This validation guide is maintained by the OpenCode automation system and updated regularly.*