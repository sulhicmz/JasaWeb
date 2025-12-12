# OpenCode CLI Setup Guide

## Quick Start

Guide singkat untuk setup OpenCode CLI workflows di repositori JasaWeb.

## Prerequisites

### Required Accounts

1. **GitHub Account** dengan repository access
2. **OpenCode CLI Account** dengan API key
3. **Self-hosted Runner** (recommended)

### Required Permissions

GitHub token harus memiliki permissions:

- `contents: write`
- `issues: write`
- `pull-requests: write`
- `actions: write`
- `id-token: write`
- `security-events: write`

## Setup Steps

### 1. Install OpenCode CLI

```bash
# Install OpenCode CLI
curl -fsSL https://opencode.ai/install | bash

# Add to PATH
echo "$HOME/.opencode/bin" >> $PATH

# Verify installation
opencode --version
```

### 2. Configure GitHub Secrets

#### GitHub Token (GH_TOKEN)

1. Go to repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: `GH_TOKEN`
4. Value: Personal Access Token dengan full permissions
5. Generate token di: https://github.com/settings/tokens

#### OpenCode API Key (IFLOW_API_KEY)

1. Login ke OpenCode CLI dashboard
2. Generate API key
3. Add ke repository secrets:
   - Name: `IFLOW_API_KEY`
   - Value: API key dari OpenCode

### 3. Setup Self-Hosted Runner

#### Linux Setup

```bash
# Download runner
cd /opt
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure
./config.sh --url https://github.com/[owner]/[repo] --token [TOKEN]

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

#### Windows Setup

```powershell
# Create directory
mkdir C:\actions-runner
cd C:\actions-runner

# Download
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip -OutFile actions-runner-win-x64-2.311.0.zip

# Extract
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("actions-runner-win-x64-2.311.0.zip", "$PWD")

# Configure
.\config.cmd --url https://github.com/[owner]/[repo] --token [TOKEN]

# Install as service
.\svc.cmd install
.\svc.cmd start
```

### 4. Deploy Workflows

Copy semua workflow files ke `.github/workflows/`:

```bash
# Copy workflow files
cp .github/workflows/oc-*.yml .github/workflows/

# Verify workflows
ls .github/workflows/oc-*.yml
```

### 5. Verify Setup

#### Test Issue Solver

1. Create test issue dengan title "Test Issue"
2. Tunggu beberapa menit
3. Check apakah issue otomatis di-resolve

#### Test PR Automator

1. Create test PR
2. Tunggu proses review
3. Check apakah PR otomatis di-merge

#### Test Code Quality Testing

1. Trigger manual workflow
2. Check hasil test di Actions tab
3. Verify quality metrics

#### Test Maintenance Monitoring

1. Tunggu 6 jam atau trigger manual
2. Check monitoring reports
3. Verify system health

#### Test Security Scanning

1. Trigger manual workflow
2. Check security reports
3. Verify vulnerability scan results

## Configuration

### Environment Variables

```yaml
env:
  GH_TOKEN: ${{ secrets.GH_TOKEN }}
  IFLOW_API_KEY: ${{ secrets.IFLOW_API_KEY }}
```

### Workflow Customization

#### Issue Solver Customization

Edit `.github/workflows/oc-issue-solver.yml`:

```yaml
# Custom timeout
timeout-minutes: 60

# Custom model
--model iflowcn/qwen3-max

# Custom schedule
on:
  schedule:
    - cron: '0 */2 * * *'  # Setiap 2 jam
```

#### PR Automator Customization

Edit `.github/workflows/oc-pr-automator.yml`:

```yaml
# Custom test commands
- name: Run Tests
  run: |
    pnpm test:unit
    pnpm test:integration
    pnpm test:e2e

# Custom merge conditions
if [ "$TESTS_PASSED" = true ] && [ "$APPROVALS_COUNT" -ge 1 ]; then
  gh pr merge ${{ github.event.pull_request.number }} --merge
fi
```

#### Autonomous Developer Customization

Edit `.github/workflows/oc-autonomous-developer.yml`:

```yaml
# Custom schedule
schedule:
  - cron: '0 */4 * * *' # Setiap 4 jam

# Custom focus areas
focus_area:
  - api
  - frontend
  - database
```

## Monitoring

### Monitoring Access

1. Go to repository > Actions tab
2. Pilih workflow yang ingin dimonitor
3. Check hasil execution dan logs

### Metrics Collection

Metrics otomatis dikumpulkan di:

- Actions workflow logs
- Security scan reports
- Code quality reports
- Maintenance monitoring logs

### Alert Configuration

Alerts otomatis dibuat untuk:

- Success rate < 80%
- Token usage > 100,000
- Workflow failures
- Security vulnerabilities

## Troubleshooting

### Common Issues

#### Token Issues

```bash
# Check token balance
opencode account info

# Refresh token
gh auth refresh

# Verify permissions
gh auth status
```

#### Runner Issues

```bash
# Check runner status
sudo ./svc.sh status

# Restart runner
sudo ./svc.sh restart

# Check logs
sudo journalctl -u actions.runner
```

#### Workflow Issues

```bash
# Check workflow logs
gh run list --limit 10

# Debug specific run
gh run view [run-id]

# Re-run failed workflow
gh run rerun [run-id]
```

### Debug Mode

Enable debug mode dengan menambahkan ke workflow:

```yaml
env:
  DEBUG: true
  VERBOSE: true
```

### Manual Override

Untuk override otomasi:

1. Pause workflows:

   ```bash
   gh workflow disable [workflow-name]
   ```

2. Manual intervention:

   ```bash
   gh issue close [issue-number] --comment "Manual override"
   gh pr merge [pr-number] --merge
   ```

3. Resume workflows:
   ```bash
   gh workflow enable [workflow-name]
   ```

## Optimization

### Token Optimization

#### Model Selection

```yaml
# Untuk code tasks
--model iflowcn/qwen3-coder-plus

# Untuk analysis tasks
--model iflowcn/qwen3-max

# Untuk simple tasks
--model iflowcn/qwen3-coder
```

#### Prompt Optimization

```yaml
# Focused prompts
opencode run "Fix this specific bug in file.ts" \
  --model iflowcn/qwen3-coder-plus

# Minimal context
opencode run "Add unit test for function()" \
  --model iflowcn/qwen3-coder
```

### Performance Optimization

#### Parallel Execution

```yaml
strategy:
  matrix:
    task: [test, lint, type-check]
```

#### Caching

```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

## Security

### Best Practices

1. **Token Security**:
   - Rotate API keys monthly
   - Use repository secrets
   - Limit token permissions

2. **Runner Security**:
   - Isolate runner environment
   - Regular security updates
   - Monitor runner logs

3. **Code Security**:
   - Enable security scanning
   - Review auto-generated code
   - Implement security policies

### Security Monitoring

```yaml
# Security scan
- name: Security Scan
  run: |
    npm audit --audit-level high
    opencode run "Check for security vulnerabilities" \
      --model iflowcn/qwen3-max
```

## Maintenance

### Regular Tasks

#### Weekly

1. Review dashboard metrics
2. Check token usage
3. Update documentation
4. Review workflow performance

#### Monthly

1. Rotate API keys
2. Update runner software
3. Optimize workflows
4. Review costs

#### Quarterly

1. Architecture review
2. Performance optimization
3. Security audit
4. Capacity planning

### Automated Maintenance

```yaml
# Cleanup old branches
- name: Cleanup
  run: |
    gh api repos/:owner/:repo/git/refs/heads --jq '.[].ref' |
    grep 'refs/heads/old-' |
    xargs -I {} gh api --method DELETE repos/:owner/:repo/git/refs/{}
```

## Support

### Documentation

- [OpenCode CLI Documentation](https://opencode.ai/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Documentation](./OPENCODE_WORKFLOWS.md)

### Community

- OpenCode CLI Discord
- GitHub Actions Community
- Repository Issues

### Contact

For setup issues:

1. Check troubleshooting section
2. Review workflow logs
3. Create issue dengan tag `setup-issue`

---

_Setup guide maintained by AI agent_
