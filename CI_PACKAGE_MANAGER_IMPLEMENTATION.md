# CI/CD Package Manager Installation Solution

## Critical Issue #444 - Implementation Ready

This document provides the complete solution for installing Node.js and pnpm in all CI/CD workflows.

## Problem

The CI/CD environment lacks essential package managers (`pnpm` and `npm`), which blocks:

- Security vulnerability scanning
- Dependency management and updates
- Test execution and code quality checks
- Build processes and deployment

## Solution

### Installation Step

Add the following step to ALL workflow files after the checkout step:

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

1. **`.github/workflows/oc-maintainer.yml`**
   - Add after line 46 (after checkout step)

2. **`.github/workflows/oc-issue-solver.yml`**
   - Add after line 45 (after checkout step)

3. **`.github/workflows/oc-pr-handler.yml`**
   - Add after line 35 (after checkout step)

4. **`.github/workflows/oc-problem-finder.yml`**
   - Add after line 48 (after checkout step)

5. **`.github/workflows/oc-researcher.yml`**
   - Add after line 48 (after checkout step)

6. **`.github/workflows/iFlow - PR Intelligence.yml`**
   - Add after line 32 (after checkout step)

## Implementation Instructions

### For Repository Maintainers

1. **Apply the changes** to each workflow file listed above
2. **Place the installation step** immediately after the `actions/checkout@v5` step
3. **Test the implementation** by running any workflow
4. **Verify functionality** with these commands:
   ```bash
   node --version    # Should show v20.x.x
   npm --version     # Should show latest version
   pnpm --version    # Should show latest version
   ```

### Verification Steps

After applying the changes:

1. **Run a workflow** (e.g., oc-maintainer)
2. **Check the logs** for successful package manager installation
3. **Test security scanning**:
   ```bash
   pnpm audit
   ```
4. **Verify dependency management**:
   ```bash
   pnpm install
   ```

## Expected Benefits

- ✅ **Security**: Enables vulnerability scanning with `pnpm audit`
- ✅ **Development**: Allows dependency installation and management
- ✅ **CI/CD**: Unblocks all workflows requiring package managers
- ✅ **Maintenance**: Removes critical blocker for repository maintenance

## Risk Assessment

- **Risk**: Low - Standard package manager installation
- **Rollback**: Simple - Can revert workflow changes if issues occur
- **Testing**: Verify with workflow run after changes

## Troubleshooting

### If Node.js Installation Fails

```bash
# Alternative installation method
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
```

### If pnpm Installation Fails

```bash
# Alternative installation method
corepack enable
corepack prepare pnpm@latest --activate
```

### Permission Issues

Ensure the workflow has sufficient permissions:

```yaml
permissions:
  contents: read
  actions: read
```

## Next Steps

1. **Apply changes** to all workflow files
2. **Test with workflow run**
3. **Enable security scanning** once package managers are available
4. **Proceed with other maintenance tasks** that were blocked

## Related Issues

- Fixes #444 - Critical: Install Package Managers in CI/CD Environment
- Enables all other maintenance and security improvements
