#!/bin/bash

# Security Validation Script for JasaWeb
# This script performs basic security checks on the codebase

echo "🛡️  Starting Security Validation..."
echo "=================================="

ISSUES=0
WARNINGS=0

# Check for hardcoded secrets in .env files
echo "🔍 Checking for hardcoded secrets..."
if grep -r "password.*=.*[^change|example|test]" .env* 2>/dev/null; then
    echo "❌ Potential hardcoded secrets found"
    ISSUES=$((ISSUES + 1))
else
    echo "✅ No hardcoded secrets found"
fi

# Check for console statements
echo "🔍 Checking for console statements..."
CONSOLE_FILES=$(find apps/api/src apps/web/src -name "*.ts" -exec grep -l "console\." {} \; 2>/dev/null)
if [ ! -z "$CONSOLE_FILES" ]; then
    echo "⚠️  Console statements found in:"
    echo "$CONSOLE_FILES" | sed 's/^/   /'
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ No console statements found"
fi

# Check for TypeScript any types
echo "🔍 Checking for TypeScript any types..."
ANY_FILES=$(find apps/api/src -name "*.ts" -exec grep -l ": any" {} \; 2>/dev/null)
if [ ! -z "$ANY_FILES" ]; then
    echo "⚠️  TypeScript any types found in:"
    echo "$ANY_FILES" | sed 's/^/   /'
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ No TypeScript any types found"
fi

# Check package.json for security overrides
echo "🔍 Checking security overrides..."
if grep -q "pnpm.*overrides" package.json; then
    echo "⚠️  Security overrides found in package.json"
    echo "   This indicates known vulnerabilities are being patched"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ No security overrides needed"
fi

# Check for proper .gitignore
echo "🔍 Checking .gitignore for security..."
if grep -q "\.env" .gitignore; then
    echo "✅ .env files properly ignored"
else
    echo "❌ .env files not in .gitignore"
    ISSUES=$((ISSUES + 1))
fi

echo ""
echo "📊 Security Validation Summary"
echo "=============================="
echo "Issues: $ISSUES"
echo "Warnings: $WARNINGS"

if [ $ISSUES -gt 0 ]; then
    echo "❌ Security issues found - please address before deploying"
    exit 1
else
    echo "✅ Security validation passed"
    exit 0
fi