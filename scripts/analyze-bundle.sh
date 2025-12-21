#!/bin/bash

# Bundle Analysis Script for JasaWeb Platform
# This script runs bundle analysis and generates performance reports

set -e

echo "🔍 Starting Bundle Analysis..."
echo "================================"

# Ensure we're using pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is required but not installed."
    exit 1
fi

# Run tests first to ensure everything is working
echo "🧪 Running tests..."
pnpm test

echo ""
echo "📦 Running type check..."
pnpm typecheck

echo ""
echo "🔧 Running ESLint..."
pnpm lint

echo ""
echo "🏗️ Building with analysis..."
ANALYZE=true pnpm build

echo ""
echo "📊 Bundle Analysis Complete!"
echo "================================"
echo "✅ All checks passed!"
echo "✅ Bundle built and analyzed!"
echo ""
echo "📈 Performance Report: Available in build output"
echo "🔧 Optimization suggestions: Check the console output above"