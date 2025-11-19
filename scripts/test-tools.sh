#!/bin/bash

# Test script for running different test types with coverage

set -e

echo "🧪 Running JasaWeb API Tests..."

# Function to run tests with coverage
run_tests_with_coverage() {
    local test_pattern=$1
    local test_name=$2
    
    echo "📊 Running $test_name tests with coverage..."
    cd apps/api
    pnpm test $test_pattern --coverage --coverageReporters=text-lcov | coveralls
    cd ../..
}

# Function to run unit tests
run_unit_tests() {
    echo "🔬 Running unit tests..."
    cd apps/api
    pnpm test --testPathIgnorePatterns="e2e" --verbose
    cd ../..
}

# Function to run integration tests
run_integration_tests() {
    echo "🔗 Running integration tests..."
    cd apps/api
    pnpm test --testPathPattern="e2e" --verbose
    cd ../..
}

# Function to run all tests with coverage
run_all_tests_with_coverage() {
    echo "📈 Running all tests with coverage..."
    cd apps/api
    pnpm test --coverage --coverageReporters=text-lcov --coverageReporters=html
    echo "📊 Coverage report generated in apps/api/coverage/index.html"
    cd ../..
}

# Function to run tests with watch mode
run_watch_tests() {
    echo "👀 Running tests in watch mode..."
    cd apps/api
    pnpm test --watch
    cd ../..
}

# Main script logic
case "$1" in
    "unit")
        run_unit_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "coverage")
        run_all_tests_with_coverage
        ;;
    "watch")
        run_watch_tests
        ;;
    "ci")
        echo "🚀 Running CI test suite..."
        run_unit_tests
        run_integration_tests
        run_all_tests_with_coverage
        ;;
    *)
        echo "Usage: $0 {unit|integration|coverage|watch|ci}"
        echo ""
        echo "Commands:"
        echo "  unit         - Run unit tests only"
        echo "  integration - Run integration tests only"
        echo "  coverage     - Run all tests with coverage report"
        echo "  watch        - Run tests in watch mode"
        echo "  ci           - Run complete CI test suite"
        exit 1
        ;;
esac

echo "✅ Tests completed successfully!"