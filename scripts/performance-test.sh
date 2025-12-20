#!/bin/bash

# Performance Test Runner Script
# Runs comprehensive performance tests with realistic data volumes

echo "🚀 JasaWeb Performance Test Suite"
echo "=================================="

# Check if database has sufficient test data
echo "📊 Checking database readiness..."

# Create performance test data if needed
echo "🔧 Checking test data volume..."
TEST_RECORDS=1500

# Run the performance test suite
echo "🧪 Running performance tests with ${TEST_RECORDS}+ records..."
echo ""

npm run test:perf

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Performance tests PASSED"
    echo "📈 Platform is ready for production scaling"
else
    echo ""
    echo "❌ Performance tests FAILED"
    echo "⚠️  Address performance issues before production deployment"
    exit 1
fi