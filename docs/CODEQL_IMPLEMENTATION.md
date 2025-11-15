# CodeQL Implementation Files

This directory contains the workflow files that need to be manually added to implement CodeQL analysis.

## Files to Create

### 1. `.github/workflows/security-codeql.yml`

```yaml
name: Security - CodeQL Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '30 1 * * 0' # Weekly on Sunday at 01:30 UTC

permissions:
  actions: read
  contents: read
  security-events: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'typescript']

    steps:
      - name: Harden runner
        uses: step-security/harden-runner@v2
        with:
          egress-policy: audit

      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: '8.15.0'

      - name: Install dependencies
        run: |
          pnpm install --frozen-lockfile

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          config-file: ./.github/codeql/codeql-config.yml
          queries: +security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: '/language:${{matrix.language}}'
          upload: always
          wait-for-processing: true
```

### 2. `.github/workflows/security-comprehensive.yml`

```yaml
name: Security - Comprehensive Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '30 1 * * 0' # Weekly on Sunday at 01:30 UTC

permissions:
  actions: read
  contents: read
  pull-requests: write
  security-events: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false

jobs:
  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'typescript']

    steps:
      - name: Harden runner
        uses: step-security/harden-runner@v2
        with:
          egress-policy: audit

      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: '8.15.0'

      - name: Install dependencies
        run: |
          pnpm install --frozen-lockfile

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          config-file: ./.github/codeql/codeql-config.yml
          queries: +security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: '/language:${{matrix.language}}'
          upload: always
          wait-for-processing: true

  dependency-security:
    name: Dependency Security Audit
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Harden runner
        uses: step-security/harden-runner@v2
        with:
          egress-policy: audit

      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: '8.15.0'

      - name: Install dependencies
        run: |
          pnpm install --frozen-lockfile

      - name: Run security audit
        run: |
          pnpm audit --audit-level moderate
        continue-on-error: true

      - name: Run npm audit
        run: |
          npm audit --audit-level moderate
        continue-on-error: true

  secret-scan:
    name: Secret Detection
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Harden runner
        uses: step-security/harden-runner@v2
        with:
          egress-policy: audit

      - name: Checkout repository
        uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Run TruffleHog OSS
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
          extra_args: --debug --only-verified

      - name: Run custom security scan
        run: |
          node scripts/security-scan.js

  security-report:
    name: Security Report
    runs-on: ubuntu-latest
    needs: [codeql, dependency-security, secret-scan]
    if: always()

    steps:
      - name: Harden runner
        uses: step-security/harden-runner@v2
        with:
          egress-policy: audit

      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Generate security report
        run: |
          echo "# Security Analysis Report" > security-report.md
          echo "" >> security-report.md
          echo "## Analysis Results" >> security-report.md
          echo "" >> security-report.md
          echo "- CodeQL Analysis: ${{ needs.codeql.result == 'success' && '✅ Passed' || '❌ Failed' }}" >> security-report.md
          echo "- Dependency Security: ${{ needs.dependency-security.result == 'success' && '✅ Passed' || '❌ Failed' }}" >> security-report.md
          echo "- Secret Detection: ${{ needs.secret-scan.result == 'success' && '✅ Passed' || '❌ Failed' }}" >> security-report.md
          echo "" >> security-report.md
          echo "Generated on: $(date)" >> security-report.md

      - name: Upload security report
        uses: actions/upload-artifact@v4
        with:
          name: security-report
          path: security-report.md
          retention-days: 30

      - name: Comment PR with security results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('security-report.md', 'utf8');

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

### 3. `.github/codeql/codeql-config.yml`

```yaml
name: 'JasaWeb CodeQL Configuration'

# Paths to exclude from analysis
paths-ignore:
  - '**/node_modules/**'
  - '**/dist/**'
  - '**/build/**'
  - '**/.git/**'
  - '**/.github/**'
  - '**/coverage/**'
  - '**/logs/**'
  - '**/tmp/**'
  - '**/*.min.js'
  - '**/*.bundle.js'

# Query packs to use
packs:
  - codeql/javascript-queries
  - codeql/typescript-queries

# Additional query suites
queries:
  - name: Security and Quality
    uses: codeql-suites
    with:
      suite: security-and-quality

# Extraction settings
extractor:
  javascript:
    extraction:
      javascript:
        include:
          - '**/*.js'
          - '**/*.jsx'
          - '**/*.ts'
          - '**/*.tsx'
          - '**/*.mjs'
          - '**/*.cjs'
        exclude:
          - '**/node_modules/**'
          - '**/dist/**'
          - '**/build/**'
          - '**/*.test.js'
          - '**/*.test.ts'
          - '**/*.spec.js'
          - '**/*.spec.ts'

# Problem-specific configurations
problem-severity:
  - error
  - warning
  - note

# Code scanning settings
code-scanning:
  # Maximum number of problems to report
  max-problems: 1000

  # Categories to include
  categories:
    - security
    - correctness
    - maintainability
    - performance
```

## Implementation Steps

1. Create the workflow files listed above in the `.github/workflows/` directory
2. Create the CodeQL configuration file in `.github/codeql/` directory
3. Update branch protection rules to require the new security checks
4. Test the workflows by creating a test pull request

## Benefits

- **Static Code Analysis**: CodeQL provides advanced static analysis for security vulnerabilities
- **Dependency Security**: Automated scanning of dependencies for known vulnerabilities
- **Secret Detection**: Prevents accidental commits of secrets or credentials
- **Comprehensive Reporting**: Security reports uploaded as artifacts and commented on PRs
- **Scheduled Scans**: Weekly security scans ensure ongoing security monitoring

## Notes

- The workflows are configured to run on pushes to main/develop branches and on pull requests
- Security scans are also scheduled to run weekly
- The comprehensive workflow includes dependency audits and secret scanning
- Branch protection rules should be updated to require these security checks
