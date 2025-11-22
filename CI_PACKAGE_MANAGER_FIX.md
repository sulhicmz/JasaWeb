# CI/CD Package Manager Implementation Guide

## 🚨 Critical Issue #444

This document provides the complete solution for installing Node.js and pnpm in all CI/CD workflows to resolve the critical package manager issue.

## Problem

The CI/CD environment lacks essential package managers (`pnpm` and `npm`), which blocks:

- Security vulnerability scanning
- Dependency management and updates
- Test execution and code quality checks
- Build processes and deployment

## Solution

Add the following installation step to ALL 6 workflow files after the checkout step:

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

## Workflow Files Requiring Updates

1. `.github/workflows/oc-maintainer.yml`
2. `.github/workflows/oc-issue-solver.yml`
3. `.github/workflows/oc-pr-handler.yml`
4. `.github/workflows/oc-problem-finder.yml`
5. `.github/workflows/oc-researcher.yml`
6. `.github/workflows/iFlow - PR Intelligence.yml`

## Implementation Instructions

For each workflow file:

1. Add the installation step immediately after the `actions/checkout@v5` step
2. Place it before any steps that require package managers
3. Test by running any workflow to verify installation

## Expected Benefits

- ✅ **Security**: Enables vulnerability scanning with `pnpm audit`
- ✅ **Development**: Allows dependency installation and management
- ✅ **CI/CD**: Unblocks all workflows requiring package managers
- ✅ **Maintenance**: Removes critical blocker for repository maintenance

## Verification

After implementation, workflow logs should show:

```
v20.x.x    # Node.js version
10.x.x     # npm version
9.x.x      # pnpm version
```

---

**Priority**: CRITICAL - This unblocks all other maintenance activities and security improvements.
