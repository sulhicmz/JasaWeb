# CI/CD Package Manager Setup

## Problem

The CI/CD environment lacks essential package managers (`pnpm` and `npm`), which blocks security scanning, dependency management, and build processes.

## Solution

Add the following step to all GitHub workflow files after the OpenCode CLI installation:

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

## Affected Workflows

- `.github/workflows/oc-maintainer.yml`
- `.github/workflows/oc-pr-handler.yml`
- `.github/workflows/oc-issue-solver.yml`
- `.github/workflows/oc-problem-finder.yml`
- `.github/workflows/oc- researcher.yml`
- `.github/workflows/iFlow - PR Intelligence.yml`

## Implementation Notes

- Requires `workflows: write` permission for GitHub App
- Node.js 20.x is the current LTS version
- pnpm is installed globally for all workflows
- Version verification ensures successful installation

## Benefits

- ✅ Enables security vulnerability scanning
- ✅ Allows dependency management and updates
- ✅ Unblocks test execution and CI processes
- ✅ Improves overall repository security posture

## Testing

After implementation, verify with:

```bash
node --version  # Should show v20.x.x
npm --version   # Should show latest version
pnpm --version  # Should show latest version
```
