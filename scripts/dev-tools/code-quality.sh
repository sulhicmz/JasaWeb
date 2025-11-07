#!/bin/bash

# Code quality tools for JasaWeb development
# This script provides utilities for code quality checks and improvements

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to run all code quality checks
run_all_checks() {
    print_info "Running all code quality checks..."
    
    # Run ESLint
    print_info "Running ESLint..."
    if pnpm lint; then
        print_success "ESLint passed"
    else
        print_error "ESLint failed"
        return 1
    fi
    
    # Run TypeScript checks
    print_info "Running TypeScript checks..."
    if pnpm typecheck; then
        print_success "TypeScript checks passed"
    else
        print_error "TypeScript checks failed"
        return 1
    fi
    
    # Run tests
    print_info "Running tests..."
    if pnpm test:run; then
        print_success "All tests passed"
    else
        print_error "Some tests failed"
        return 1
    fi
    
    # Run security audit
    print_info "Running security audit..."
    if pnpm security:audit; then
        print_success "Security audit passed"
    else
        print_warning "Security audit found issues"
    fi
    
    print_success "All code quality checks completed!"
}

# Function to fix code issues
fix_code() {
    print_info "Fixing code issues..."
    
    # Fix ESLint issues
    print_info "Fixing ESLint issues..."
    if pnpm lint:fix; then
        print_success "ESLint issues fixed"
    else
        print_error "Failed to fix ESLint issues"
        return 1
    fi
    
    # Format code
    print_info "Formatting code..."
    if pnpm format; then
        print_success "Code formatted successfully"
    else
        print_error "Failed to format code"
        return 1
    fi
    
    print_success "Code issues fixed!"
}

# Function to run specific checks
run_specific_checks() {
    local check_type=$1
    
    case "$check_type" in
        lint)
            print_info "Running ESLint..."
            pnpm lint
            ;;
        types)
            print_info "Running TypeScript checks..."
            pnpm typecheck
            ;;
        test)
            print_info "Running tests..."
            pnpm test:run
            ;;
        security)
            print_info "Running security audit..."
            pnpm security:audit
            ;;
        format)
            print_info "Checking code formatting..."
            pnpm format
            ;;
        *)
            print_error "Unknown check type: $check_type"
            echo "Available check types: lint, types, test, security, format"
            return 1
            ;;
    esac
}

# Main execution
case "$1" in
    all)
        run_all_checks
        ;;
    fix)
        fix_code
        ;;
    check)
        run_specific_checks "$2"
        ;;
    *)
        echo "Code Quality Tools for JasaWeb"
        echo "Usage: $0 {all|fix|check <type>}"
        echo ""
        echo "Commands:"
        echo "  all        Run all code quality checks"
        echo "  fix        Fix code issues (ESLint, formatting)"
        echo "  check      Run specific check (lint, types, test, security, format)"
        exit 1
        ;;
esac