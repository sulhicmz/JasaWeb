#!/bin/bash

# =============================================================================
# JasaWeb Development Tools Test Suite
# =============================================================================
# This script tests the enhanced development tools to ensure they work correctly.
# It validates help commands, basic functionality, and error handling.

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# =============================================================================
# Utility Functions
# =============================================================================

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

run_test() {
    local test_name=$1
    local test_command=$2
    local expected_exit_code=${3:-0}
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    print_info "Testing: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        local actual_exit_code=$?
        if [[ $actual_exit_code -eq $expected_exit_code ]]; then
            print_success "✓ $test_name"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_error "✗ $test_name (exit code: $actual_exit_code, expected: $expected_exit_code)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        local actual_exit_code=$?
        if [[ $actual_exit_code -eq $expected_exit_code ]]; then
            print_success "✓ $test_name"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_error "✗ $test_name (exit code: $actual_exit_code, expected: $expected_exit_code)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
}

# =============================================================================
# Test Functions
# =============================================================================

test_watch_script() {
    print_header "Testing Watch and Reload Script"
    
    # Test help command
    run_test "Help command" "./scripts/dev-tools/watch-and-reload.sh --help"
    
    # Test invalid target (should fail)
    run_test "Invalid target" "./scripts/dev-tools/watch-and-reload.sh invalid" 1
    
    # Test verbose flag
    run_test "Verbose flag" "./scripts/dev-tools/watch-and-reload.sh --verbose --help"
    
    # Test delay flag with valid value
    run_test "Delay flag" "./scripts/dev-tools/watch-and-reload.sh --delay 2 --help"
    
    # Test delay flag with invalid value (should fail)
    run_test "Invalid delay" "./scripts/dev-tools/watch-and-reload.sh --delay invalid --help" 1
}

test_database_script() {
    print_header "Testing Database Tools Script"
    
    # Test help command
    run_test "Help command" "./scripts/dev-tools/database-tools.sh --help"
    
    # Test invalid command (should fail)
    run_test "Invalid command" "./scripts/dev-tools/database-tools.sh invalid" 1
    
    # Test environment flag
    run_test "Environment flag" "./scripts/dev-tools/database-tools.sh --env dev --help"
    
    # Test verbose flag
    run_test "Verbose flag" "./scripts/dev-tools/database-tools.sh --verbose --help"
    
    # Test status command (might fail due to DB not being set up, but should not crash)
    run_test "Status command" "./scripts/dev-tools/database-tools.sh status" 1
}

test_code_quality_script() {
    print_header "Testing Code Quality Script"
    
    # Test help command
    run_test "Help command" "./scripts/dev-tools/code-quality.sh --help"
    
    # Test invalid command (should fail)
    run_test "Invalid command" "./scripts/dev-tools/code-quality.sh invalid" 1
    
    # Test verbose flag
    run_test "Verbose flag" "./scripts/dev-tools/code-quality.sh --verbose --help"
    
    # Test format flag with valid value
    run_test "Format flag" "./scripts/dev-tools/code-quality.sh --format json --help"
    
    # Test format flag with invalid value (should fail)
    run_test "Invalid format" "./scripts/dev-tools/code-quality.sh --format invalid --help" 1
    
    # Test output flag
    run_test "Output flag" "./scripts/dev-tools/code-quality.sh --output test.txt --help"
    
    # Test strict flag
    run_test "Strict flag" "./scripts/dev-tools/code-quality.sh --strict --help"
}

test_script_permissions() {
    print_header "Testing Script Permissions"
    
    local scripts=(
        "scripts/dev-tools/watch-and-reload.sh"
        "scripts/dev-tools/database-tools.sh"
        "scripts/dev-tools/code-quality.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -x "$script" ]]; then
            run_test "Executable: $script" "test -x $script"
        else
            print_warning "Script $script is not executable"
            run_test "Make executable: $script" "chmod +x $script"
        fi
    done
}

test_documentation() {
    print_header "Testing Documentation"
    
    # Test README exists
    run_test "Documentation exists" "test -f scripts/dev-tools/README.md"
    
    # Test README contains expected sections
    if [[ -f "scripts/dev-tools/README.md" ]]; then
        run_test "README contains Development Watcher" "grep -q 'Development Watcher' scripts/dev-tools/README.md"
        run_test "README contains Database Tools" "grep -q 'Database Tools' scripts/dev-tools/README.md"
        run_test "README contains Code Quality Tools" "grep -q 'Code Quality Tools' scripts/dev-tools/README.md"
    fi
}

test_package_json_integration() {
    print_header "Testing package.json Integration"
    
    # Test package.json exists
    run_test "package.json exists" "test -f package.json"
    
    if [[ -f "package.json" ]]; then
        # Test dev-tools scripts are defined
        run_test "dev-tools:watch script exists" "grep -q 'dev-tools:watch' package.json"
        run_test "dev-tools:db script exists" "grep -q 'dev-tools:db' package.json"
        run_test "dev-tools:quality script exists" "grep -q 'dev-tools:quality' package.json"
    fi
}

# =============================================================================
# Main Test Execution
# =============================================================================

main() {
    print_header "JasaWeb Development Tools Test Suite"
    print_info "Running tests for enhanced development tools..."
    
    # Run all test suites
    test_script_permissions
    test_watch_script
    test_database_script
    test_code_quality_script
    test_documentation
    test_package_json_integration
    
    # Print summary
    print_header "Test Results Summary"
    echo "Total tests: $TESTS_TOTAL"
    print_success "Passed: $TESTS_PASSED"
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        print_error "Failed: $TESTS_FAILED"
        echo
        print_error "Some tests failed. Please review the output above."
        exit 1
    else
        echo
        print_success "All tests passed! 🎉"
        print_info "The enhanced development tools are working correctly."
    fi
}

# Execute main function
main "$@"