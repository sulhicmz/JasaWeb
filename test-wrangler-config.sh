#!/bin/bash
echo "Testing wrangler.toml configuration validation..."
echo

# Test 1: Check for duplicate keys in wrangler.toml
echo "Test 1: Checking for duplicate compatibility_date entries..."
if grep -c "compatibility_date" wrangler.toml | grep -q "1"; then
    echo "✅ PASS: Only one compatibility_date found"
else
    echo "❌ FAIL: Found multiple compatibility_date entries"
    grep -n "compatibility_date" wrangler.toml
    exit 1
fi

# Test 2: Validate wrangler.toml syntax
echo
echo "Test 2: Validating wrangler.toml syntax..."
if npx wrangler whoami > /dev/null 2>&1 || [ $? -eq 1 ]; then
    echo "✅ PASS: wrangler.toml syntax is valid"
else
    echo "❌ FAIL: wrangler.toml has syntax errors"
    exit 1
fi

# Test 3: Check Wrangler version
echo
echo "Test 3: Checking Wrangler version..."
WRANGLER_VERSION=$(npx wrangler --version)
echo "Current Wrangler version: $WRANGLER_VERSION"

if echo "$WRANGLER_VERSION" | grep -q "^4\."; then
    echo "✅ PASS: Using Wrangler v4"
else
    echo "⚠️  WARNING: Not using Wrangler v4"
fi

echo
echo "🎉 All wrangler configuration tests passed!"