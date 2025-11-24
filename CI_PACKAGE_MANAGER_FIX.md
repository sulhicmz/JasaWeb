# CI/CD Package Manager Installation Guide

## 🚨 Critical Issue #444

This document provides the complete solution for installing Node.js and pnpm in all CI/CD workflows to resolve the critical package manager issue.

## Problem

The CI/CD environment lacks Node.js package managers (npm and pnpm), which blocks:

- Security vulnerability scanning (`pnpm audit`)
- Dependency management and updates
- Test execution and code quality checks
- Build processes and deployment

## Solution: Add Package Manager Installation to All Workflows

### Required Changes

Add the following step to ALL 6 workflow files after the checkout step:

```yaml
- name: Install Node.js and pnpm
  run: |
    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Install pnpm
    npm install -g pnpm

    # Verify installations
    node --version
    npm --version
    pnpm --version
```

### Workflow Files Requiring Updates

1. `.github/workflows/oc-maintainer.yml`
   - Add after line 46 (after checkout step)
   - Before line 48 (Install OpenCode CLI)

2. `.github/workflows/oc-issue-solver.yml`
   - Add after line 45 (after checkout step)
   - Before line 47 (Check for open issues)

3. `.github/workflows/oc-pr-handler.yml`
   - Add after line 35 (after checkout step)
   - Before line 37 (Install OpenCode CLI)

4. `.github/workflows/oc-problem-finder.yml`
   - Add after line 48 (after checkout step)
   - Before line 49 (Install OpenCode CLI)

5. `.github/workflows/oc- researcher.yml`
   - Add after line 48 (after checkout step)
   - Before line 49 (Install OpenCode CLI)

6. `.github/workflows/iFlow - PR Intelligence.yml`
   - Add after line 32 (after checkout step)
   - Before line 33 (Collect open PR metadata)

### Implementation Steps

1. **Manual Application Required**
   - Due to GitHub App permission constraints, these changes must be applied manually by a repository maintainer
   - Each workflow file needs the installation step added at the specified location

2. **Testing After Implementation**
   - Run any workflow to verify package manager installation
   - Check that `node --version`, `npm --version`, and `pnpm --version` all return valid outputs
   - Test `pnpm audit` to verify security scanning functionality

3. **Verification Commands**

   ```bash
   # Test package manager availability
   node --version  # Should return v20.x.x
   npm --version   # Should return 10.x.x
   pnpm --version  # Should return 9.x.x

   # Test security scanning
   pnpm audit      # Should run without errors
   ```

### Expected Impact

After implementation:

- ✅ Enables security vulnerability scanning with `pnpm audit`
- ✅ Allows dependency installation and management
- ✅ Unblocks all workflows requiring package managers
- ✅ Removes critical blocker for repository maintenance activities
- ✅ Improves overall repository security posture

### Risk Assessment

- **Risk**: Low - Standard package manager installation
- **Rollback**: Simple - Can revert workflow changes if issues occur
- **Testing**: Verify with workflow run after changes
- **Compatibility**: Node.js 20.x is LTS and widely supported

### Troubleshooting

If installation fails:

1. Check runner internet connectivity
2. Verify sudo permissions on runner
3. Check for conflicting Node.js installations
4. Review workflow logs for specific error messages

### Next Steps

1. Apply changes to all 6 workflow files
2. Test with a workflow run
3. Enable security scanning
4. Proceed with other maintenance activities that were blocked

## Priority

**CRITICAL** - This blocks all other maintenance activities and security scanning.

## Related Issue

Fixes #444 - 🚨 Critical: Install Package Managers in CI/CD Environment
