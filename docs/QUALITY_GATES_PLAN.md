# Quality Gates Implementation Plan

## Pre-commit Hooks (Husky Setup)

### Package.json additions
```json
{
  "devDependencies": {
    "@commitlint/cli": "^17.0.0",
    "@commitlint/config-conventional": "^17.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0",
    "yamllint": "^1.29.0"
  },
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,yml,yaml}": [
      "prettier --write",
      "yamllint"
    ],
    "tsconfig*.json": [
      "node scripts/validate-typescript.js"
    ]
  }
}
```

### Husky Configuration
```bash
#!/bin/sh
# .husky/pre-commit
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit quality checks..."

# TypeScript validation
echo "⚙️  Validating TypeScript configurations..."
node scripts/validate-typescript.js

# Workflow validation
echo "🔄 Validating GitHub workflows..."
node scripts/validate-workflows.js

# Lint staged files
npx lint-staged

echo "✅ Pre-commit checks passed!"
```

## GitHub Actions Quality Gates

### CI Workflow Enhancement
```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    branches: [main]

jobs:
  typescript-validation:
    name: TypeScript Validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Validate TypeScript configs
        run: node scripts/validate-typescript.js
      
      - name: Type check all packages
        run: pnpm type-check
      
      - name: Build all packages
        run: pnpm build

  workflow-validation:
    name: Workflow Validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate YAML syntax
        run: |
          pip install yamllint
          yamllint .github/workflows/*.yml
      
      - name: Check action versions
        run: |
          node scripts/check-action-versions.js
      
      - name: Validate workflow syntax
        run: node scripts/validate-workflows.js

  conflict-detection:
    name: Merge Conflict Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Check for conflict markers
        run: |
          if grep -r "^<<<<<<< \|======= \|>>>>>>> " --include="*.json" --include="*.yml" --include="*.yaml" --include="*.ts" --include="*.js" .; then
            echo "❌ Merge conflict markers found!"
            exit 1
          else
            echo "✅ No conflict markers detected"
          fi
```

## Branch Protection Rules

### Required Status Checks
```yaml
# Required checks before merge:
- "Quality Gates / TypeScript Validation"
- "Quality Gates / Workflow Validation" 
- "Quality Gates / Merge Conflict Detection"
- "CI / Build and Test"
- "Security / CodeQL Analysis"
- "Lint / ESLint"
- "Format / Prettier"
```

### Branch Protection Settings
1. **Require PR reviews**: 2 reviewers required
2. **Require status checks**: All quality gates must pass
3. **Require up-to-date branches**: PR must be up-to-date before merging
4. **Include administrators**: Enforce rules for admins too

## Automated Testing Strategy

### TypeScript Config Testing
```javascript
// scripts/test-typescript-configs.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function validateTypeScriptConfig(configPath) {
  try {
    console.log(`🔍 Validating ${configPath}...`);
    
    // Check if config is valid JSON
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Validate with TypeScript compiler
    execSync(`npx tsc --noEmit --project ${configPath}`, { stdio: 'inherit' });
    
    console.log(`✅ ${configPath} is valid`);
    return true;
  } catch (error) {
    console.error(`❌ ${configPath} validation failed:`, error.message);
    return false;
  }
}

// Test all TypeScript configs
const configFiles = [
  'tsconfig.json',
  'packages/config/tsconfig/base.json',
  'apps/api/tsconfig.json'
];

let allValid = true;
configFiles.forEach(config => {
  if (!validateTypeScriptConfig(config)) {
    allValid = false;
  }
});

process.exit(allValid ? 0 : 1);
```

### Workflow Testing
```javascript
// scripts/test-workflows.js
const { execSync } = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');

function validateWorkflow(workflowPath) {
  try {
    console.log(`🔍 Validating ${workflowPath}...`);
    
    // Parse YAML
    const content = fs.readFileSync(workflowPath, 'utf8');
    const workflow = yaml.load(content);
    
    // Basic structure validation
    if (!workflow.name || !workflow.on || !workflow.jobs) {
      throw new Error('Missing required workflow fields');
    }
    
    // Check for required fields in jobs
    Object.values(workflow.jobs).forEach(job => {
      if (!job['runs-on']) {
        throw new Error('Job missing runs-on field');
      }
    });
    
    console.log(`✅ ${workflowPath} is valid`);
    return true;
  } catch (error) {
    console.error(`❌ ${workflowPath} validation failed:`, error.message);
    return false;
  }
}

// Test all workflows
const workflowFiles = fs.readdirSync('.github/workflows')
  .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

let allValid = true;
workflowFiles.forEach(workflow => {
  if (!validateWorkflow(`.github/workflows/${workflow}`)) {
    allValid = false;
  }
});

process.exit(allValid ? 0 : 1);
```