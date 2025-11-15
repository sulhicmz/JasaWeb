# GitHub Workflow Validation Testing Strategy

## Pre-merge Validation
```bash
# 5.1 YAML syntax validation
yamllint .github/workflows/*.yml

# 5.2 Workflow action validation
act --list # List all workflows
act -j security # Test security workflow locally

# 5.3 Secret and environment validation
# Check all required secrets are documented
grep -r "secrets\." .github/workflows/ | sort | uniq
```

## Test Cases for Security Workflow
1. **Syntax Validation**: YAML must be valid
2. **Action Versions**: All GitHub Actions use specific versions
3. **Permission Checks**: Jobs have appropriate permissions
4. **Dependency Consistency**: pnpm version consistency across workflows
5. **Secret References**: All secrets exist and are properly referenced

## Local Testing with Act
```bash
# Install act (GitHub Actions runner)
# macOS: brew install act
# Linux: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test security workflow
act -j security -s GITHUB_TOKEN=your_token

# Test specific jobs
act -j codeql
act -j dependency-security
act -j secret-scan
```

## Workflow Validation Script
```bash
#!/bin/bash
# validate-workflows.sh
set -e

echo "🔄 GitHub Workflow Validation Pipeline..."

# Check YAML syntax
echo "📝 Validating YAML syntax..."
for workflow in .github/workflows/*.yml; do
  echo "Checking $workflow..."
  python -c "import yaml; yaml.safe_load(open('$workflow'))" || {
    echo "❌ YAML syntax error in $workflow"
    exit 1
  }
done

# Check for required secrets
echo "🔐 Checking secret references..."
grep -h "secrets\." .github/workflows/*.yml | sort | uniq > /tmp/secrets.txt
echo "Required secrets:"
cat /tmp/secrets.txt

# Validate action versions
echo "📦 Checking action versions..."
grep -h "uses:" .github/workflows/*.yml | grep -v "local/" | sort | uniq

# Check pnpm consistency
echo "📋 Checking pnpm version consistency..."
PNPM_VERSIONS=$(grep -h "PNPM_VERSION" .github/workflows/*.yml | sort | uniq)
if [ $(echo "$PNPM_VERSIONS" | wc -l) -gt 1 ]; then
  echo "⚠️  Inconsistent pnpm versions found:"
  echo "$PNPM_VERSIONS"
fi

echo "✅ Workflow validation completed!"
```