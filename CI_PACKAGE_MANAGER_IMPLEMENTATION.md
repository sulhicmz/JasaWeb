# CI/CD Package Manager Implementation Guide

## Critical Issue #444 - Package Manager Installation

This document provides the complete implementation for adding Node.js and pnpm installation to all CI/CD workflows.

## Problem

The CI/CD environment lacks Node.js package managers (npm and pnpm), which blocks:

- Security vulnerability scanning (`pnpm audit`)
- Dependency management and updates
- Test execution and code quality checks
- Build processes and deployment

## Solution

### Installation Step

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
   - **Location**: After line 46 (checkout step), before line 48 (Install OpenCode CLI)
   - **Insert**: The installation step above

2. `.github/workflows/oc-issue-solver.yml`
   - **Location**: After line 45 (checkout step), before line 47 (Check for open issues)
   - **Insert**: The installation step above

3. `.github/workflows/oc-pr-handler.yml`
   - **Location**: After line 35 (checkout step), before line 37 (Install OpenCode CLI)
   - **Insert**: The installation step above

4. `.github/workflows/oc-problem-finder.yml`
   - **Location**: After line 47 (checkout step), before line 49 (Install OpenCode CLI)
   - **Insert**: The installation step above

5. `.github/workflows/oc- researcher.yml`
   - **Location**: After line 48 (checkout step), before line 50 (Install OpenCode CLI)
   - **Insert**: The installation step above

6. `.github/workflows/iFlow - PR Intelligence.yml`
   - **Location**: After line 32 (checkout step), before line 33 (Collect open PR metadata)
   - **Insert**: The installation step above

## Implementation Steps

### For Repository Maintainers

1. **Apply the changes** to each of the 6 workflow files listed above
2. **Commit the changes** with a descriptive commit message
3. **Test with a workflow run** to verify package manager installation
4. **Enable security scanning** once package managers are available

### Verification Commands

After implementation, verify the installation works by running:

```bash
# In any workflow, add this test step:
- name: Test package managers
  run: |
    node --version  # Should show v20.x.x
    npm --version   # Should show npm version
    pnpm --version  # Should show pnpm version
    pnpm audit      # Should run security audit
```

## Expected Impact

- ✅ Enables security vulnerability scanning with `pnpm audit`
- ✅ Allows dependency installation and management
- ✅ Unblocks all workflows requiring package managers
- ✅ Removes critical blocker for repository maintenance activities
- ✅ Improves overall repository security posture

## Risk Assessment

- **Risk**: Low - Standard package manager installation
- **Rollback**: Simple - Can revert workflow changes if issues occur
- **Testing**: Verify with workflow run after changes
- **Compatibility**: Node.js 20.x is current LTS version

## Troubleshooting

### If installation fails:

1. Check runner internet connectivity
2. Verify sudo permissions on runner
3. Check for conflicting Node.js installations
4. Review workflow logs for specific error messages

### If pnpm audit fails:

1. Ensure pnpm is properly installed
2. Check if package.json exists in repository
3. Verify pnpm version compatibility

## Next Steps After Implementation

1. **Enable security scanning** in repository settings
2. **Schedule regular dependency audits**
3. **Set up Dependabot** for automated dependency updates
4. **Add package manager verification** to CI pipeline

---

**Priority**: CRITICAL - This blocks all other maintenance activities and security scanning.
**Issue**: #444
**Expected Resolution**: Immediate - Once workflow changes are applied manually by maintainers.
