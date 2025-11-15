#!/bin/bash

# Verification script to ensure critical directories are included in TypeScript compilation
# This script addresses issue #79: Critical application directories excluded from compilation

echo "🔍 Verifying TypeScript compilation includes critical directories..."

# Check current exclusions in tsconfig.json
echo "Current exclusions in tsconfig.json:"
jq -r '.exclude[]?' apps/api/tsconfig.json 2>/dev/null | sed 's/^/  - /'

# List of critical directories that should NEVER be excluded
CRITICAL_DIRS=(
  "src/approvals"
  "src/files" 
  "src/tickets"
  "src/invoices"
  "src/milestones"
  "src/projects"
  "src/common/database"
)

# Check if any critical directories are excluded
echo ""
echo "🔍 Checking for critical directories in exclude array..."
EXCLUDED_CRITICAL=$(jq -r '.exclude[]?' apps/api/tsconfig.json 2>/dev/null | grep -E "$(IFS='|'; echo "${CRITICAL_DIRS[*]}")" || true)

if [ -n "$EXCLUDED_CRITICAL" ]; then
  echo "❌ CRITICAL ISSUE FOUND: The following critical directories are excluded:"
  echo "$EXCLUDED_CRITICAL" | sed 's/^/  - /'
  echo ""
  echo "This violates TypeScript compilation best practices and must be fixed immediately."
  exit 1
else
  echo "✅ No critical directories are excluded from compilation."
fi

# Verify critical directories exist and contain TypeScript files
echo ""
echo "🔍 Verifying critical directories exist and contain TypeScript files..."
for dir in "${CRITICAL_DIRS[@]}"; do
  if [ -d "apps/api/$dir" ]; then
    TS_FILES=$(find "apps/api/$dir" -name "*.ts" -type f | wc -l)
    echo "  ✅ $dir: $TS_FILES TypeScript files found"
  else
    echo "  ❌ $dir: Directory not found"
    exit 1
  fi
done

# Test that TypeScript actually attempts to compile these directories
echo ""
echo "🔍 Checking if TypeScript attempts to compile critical directories..."
cd apps/api
# Run tsc --noEmit --listFiles and capture output, filtering out dependency errors
COMPILED_FILES=$(npx tsc --noEmit --listFiles 2>/dev/null | grep -E "src/(approvals|files|tickets|invoices|milestones|projects|common/database)/" | wc -l)

if [ "$COMPILED_FILES" -gt 0 ]; then
  echo "✅ TypeScript is attempting to compile files from critical directories."
  echo "   (Dependency errors are expected in this environment)"
else
  echo "❌ TypeScript is not compiling files from critical directories."
  exit 1
fi

echo ""
echo "🎉 Verification complete: TypeScript configuration is correct."
echo "All critical application directories are properly included in compilation."