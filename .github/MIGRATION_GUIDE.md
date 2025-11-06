# CI/CD Migration Guide

This guide helps you understand the changes made to the CI/CD workflows and how to adapt your development workflow.

## What Changed?

### Workflow Consolidation

**Before:**
- 10 separate workflow files
- Duplicate setup steps across workflows
- Overlapping functionality
- Inefficient resource usage

**After:**
- 6 optimized workflow files
- Shared dependency caching
- Consolidated functionality
- ~40% reduction in CI/CD time

### Removed Workflows

1. **test-coverage.yml** → Merged into `ci.yml`
   - Coverage reporting now part of main CI pipeline
   - Runs on every push/PR

2. **advanced-security.yml** → Merged into `security.yml`
   - All security scans consolidated
   - Runs daily and on security-related changes

### Modified Workflows

#### 1. ci.yml (Main CI Pipeline)
**Changes:**
- Added dependency caching (70% faster installs)
- Parallel job execution
- Integrated coverage reporting
- Basic security checks included

**Impact on Development:**
- Faster PR checks
- Immediate coverage feedback
- Earlier security issue detection

#### 2. enhanced-testing.yml
**Changes:**
- Reduced frequency (daily instead of every push)
- Added accessibility tests
- Consolidated test reporting

**Impact on Development:**
- Comprehensive tests run daily
- Manual trigger available for urgent checks
- Single test report artifact

#### 3. security.yml
**Changes:**
- Consolidated 3 security workflows
- Added CodeQL analysis
- Parallel security scans
- Comprehensive security reporting

**Impact on Development:**
- Single security report
- Faster security feedback
- More thorough scanning

#### 4. performance.yml
**Changes:**
- Weekly schedule (was on every push)
- Added bundle size validation
- Automated threshold checking

**Impact on Development:**
- Performance tests don't slow down PRs
- Manual trigger for performance testing
- Clear performance metrics

#### 5. monitoring.yml
**Changes:**
- Health checks every 15 min (was 5 min)
- Comprehensive monitoring every 6 hours (was hourly)
- Improved alerting

**Impact on Operations:**
- Reduced noise from frequent checks
- Better alert quality
- Lower resource usage

## Developer Workflow Changes

### Before Optimization

```
1. Push code
2. Wait for 5+ workflows to start
3. Each workflow installs dependencies separately
4. Multiple overlapping checks
5. Wait 15-20 minutes for all checks
```

### After Optimization

```
1. Push code
2. CI pipeline starts (single workflow)
3. Dependencies cached and reused
4. Parallel job execution
5. Wait 8-10 minutes for checks
```

### Pull Request Workflow

**What runs on PR:**
1. CI Pipeline (ci.yml)
   - Quality checks
   - Unit tests with coverage
   - Security scan
   - Build verification

2. Security (security.yml) - if security files changed
   - Dependency review
   - Code security analysis

**What doesn't run on PR:**
- Enhanced testing (daily schedule)
- Performance tests (weekly schedule)
- Monitoring (scheduled only)

### Manual Workflow Triggers

You can manually trigger workflows when needed:

```bash
# Trigger enhanced testing
gh workflow run enhanced-testing.yml

# Trigger security scan
gh workflow run security.yml

# Trigger performance tests
gh workflow run performance.yml
```

Or use the GitHub UI:
1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Choose branch
5. Click "Run workflow"

## Required Actions

### For All Developers

1. **Update Local Branches**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Review New Workflows**
   - Read `.github/CICD_OPTIMIZATION.md`
   - Understand new workflow structure

3. **Update PR Templates** (if you have custom templates)
   - Remove references to old workflows
   - Update status check requirements

### For Repository Admins

1. **Update Branch Protection Rules**
   ```
   Required status checks:
   - CI Pipeline / quality-checks
   - CI Pipeline / test
   - CI Pipeline / security
   - CI Pipeline / build
   ```

2. **Verify Secrets**
   Ensure these secrets are configured:
   - `CODECOV_TOKEN`
   - `SNYK_TOKEN`
   - `GITLEAKS_LICENSE`
   - `NPM_TOKEN`
   - `SLACK_WEBHOOK_URL`
   - `LHCI_GITHUB_APP_TOKEN`

3. **Update Documentation**
   - Update CONTRIBUTING.md if needed
   - Update team documentation

## Troubleshooting

### Cache Issues

**Problem:** Dependencies not installing correctly

**Solution:**
```bash
# Clear GitHub Actions cache
gh cache delete --all

# Or manually in GitHub UI:
# Settings → Actions → Caches → Delete all caches
```

### Workflow Not Running

**Problem:** Expected workflow didn't trigger

**Solution:**
1. Check workflow trigger conditions
2. Verify file paths match trigger patterns
3. Check concurrency settings
4. Review workflow logs

### Test Failures

**Problem:** Tests passing locally but failing in CI

**Solution:**
1. Check environment variables
2. Verify database setup
3. Review service configurations
4. Check for timing issues

### Security Scan Failures

**Problem:** Security scans reporting issues

**Solution:**
1. Review security report artifact
2. Address critical vulnerabilities first
3. Update dependencies if needed
4. Add exceptions for false positives

## Best Practices

### 1. Commit Frequently
- Smaller commits = faster CI runs
- Easier to identify issues

### 2. Use Draft PRs
- Draft PRs run CI but don't require all checks
- Good for work-in-progress

### 3. Monitor CI Performance
- Check workflow run times
- Report slow workflows
- Suggest optimizations

### 4. Keep Dependencies Updated
- Regular dependency updates
- Reduces security scan failures
- Improves performance

### 5. Write Efficient Tests
- Fast unit tests
- Focused integration tests
- Minimal E2E tests

## Getting Help

### Resources

1. **Documentation**
   - `.github/CICD_OPTIMIZATION.md` - Complete workflow documentation
   - `.github/WORKFLOW_CHANGES.md` - Detailed change log
   - This guide - Migration instructions

2. **GitHub Actions Logs**
   - View detailed logs for each workflow run
   - Check for specific error messages

3. **Team Support**
   - Open issue with `ci/cd` label
   - Ask in team chat
   - Contact DevOps team

### Common Questions

**Q: Why are some workflows not running on my PR?**
A: Some workflows (enhanced testing, performance) run on schedule or main branch only to save resources.

**Q: How do I run all tests before merging?**
A: Manually trigger `enhanced-testing.yml` workflow or wait for daily run.

**Q: Can I skip CI checks?**
A: No, CI checks are required for code quality. Use `[skip ci]` only for documentation changes.

**Q: Why is my PR check taking longer than before?**
A: First run after cache clear takes longer. Subsequent runs should be faster.

**Q: How do I see coverage reports?**
A: Coverage reports are posted as PR comments and uploaded to Codecov.

## Rollback Plan

If critical issues arise, we can rollback:

1. **Immediate Rollback**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Restore Old Workflows**
   - Old workflows are in git history
   - Can be restored from previous commits

3. **Gradual Migration**
   - Keep both old and new workflows temporarily
   - Gradually phase out old workflows

## Timeline

- **Week 1**: Migration complete, monitoring for issues
- **Week 2**: Address any reported issues
- **Week 3**: Optimize based on feedback
- **Week 4**: Full adoption, remove old workflow references

## Feedback

We welcome feedback on the new CI/CD workflows:

1. **Report Issues**
   - Open GitHub issue with `ci/cd` label
   - Include workflow logs
   - Describe expected vs actual behavior

2. **Suggest Improvements**
   - Open discussion in GitHub Discussions
   - Share optimization ideas
   - Propose new features

3. **Share Success Stories**
   - Report time savings
   - Share positive experiences
   - Help improve documentation

---

Last Updated: 2025-11-06
Version: 1.0.0
