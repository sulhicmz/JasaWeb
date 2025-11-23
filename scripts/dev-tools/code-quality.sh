#!/bin/bash

# =============================================================================
# JasaWeb Code Quality Tools
# =============================================================================
# Comprehensive code quality management with advanced analysis, performance
# profiling, security scanning, and automated fixing capabilities.
#
# USAGE:
#   ./scripts/dev-tools/code-quality.sh [OPTIONS] <COMMAND> [ARGS]
#
# COMMANDS:
#   all                Run all code quality checks
#   fix                Fix code issues automatically
#   check <type>       Run specific check type
#   report             Generate comprehensive quality report
#   profile            Analyze code performance and complexity
#   dependencies       Analyze dependency health and updates
#   security           Run comprehensive security analysis
#   pre-commit         Run pre-commit quality checks
#   ci                 Run CI-optimized quality checks
#   benchmark          Benchmark code quality metrics
#
# CHECK TYPES:
#   lint               ESLint code linting
#   types              TypeScript type checking
#   test               Unit and integration tests
#   security           Security vulnerability scanning
#   format             Code formatting validation
#   complexity         Code complexity analysis
#   coverage           Test coverage analysis
#   duplicates         Code duplication detection
#
# OPTIONS:
#   --fix, -f          Automatically fix issues when possible
#   --verbose, -v      Enable detailed output
#   --quiet, -q        Suppress non-error output
#   --strict, -s       Use strict mode (fail on warnings)
#   --output, -o <file> Save report to file
#   --format, -F <fmt> Report format (text, json, markdown)
#   --help, -h         Show this help message
#
# EXAMPLES:
#   ./scripts/dev-tools/code-quality.sh all
#   ./scripts/dev-tools/code-quality.sh --fix lint
#   ./scripts/dev-tools/code-quality.sh --verbose --output report.md report
#   ./scripts/dev-tools/code-quality.sh --strict pre-commit
#   ./scripts/dev-tools/code-quality.sh dependencies
#
# PREREQUISITES:
#   - Node.js 20+ and pnpm installed
#   - All project dependencies installed
#   - Optional: sonar-scanner for advanced analysis
#   - Optional: cloc for code metrics
#
# TROUBLESHOOTING:
#   - Permission issues: chmod +x scripts/dev-tools/code-quality.sh
#   - Missing tools: Run pnpm install to install all dependencies
#   - CI failures: Check logs for specific error messages
# =============================================================================

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Configuration
FIX_MODE=false
VERBOSE=false
QUIET=false
STRICT_MODE=false
OUTPUT_FILE=""
REPORT_FORMAT="text"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="quality-reports"

# Quality metrics
declare -A CHECK_RESULTS
declare -A CHECK_TIMES
TOTAL_ISSUES=0
TOTAL_CHECKS=0

# =============================================================================
# Utility Functions
# =============================================================================

print_info() {
    if [[ "$QUIET" != "true" ]]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    fi
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

print_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${CYAN}🔍 $1${NC}" >&2
    fi
}

print_header() {
    echo -e "${BOLD}${MAGENTA}$1${NC}"
}

print_metric() {
    local label=$1
    local value=$2
    local status=${3:-"info"}
    
    case $status in
        "success")
            echo -e "${GREEN}✓${NC} $label: ${BOLD}$value${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠${NC} $label: ${BOLD}$value${NC}"
            ;;
        "error")
            echo -e "${RED}✗${NC} $label: ${BOLD}$value${NC}"
            ;;
        *)
            echo -e "${BLUE}ℹ${NC} $label: ${BOLD}$value${NC}"
            ;;
    esac
}

show_help() {
    cat << 'EOF'
JasaWeb Code Quality Tools

USAGE:
    ./scripts/dev-tools/code-quality.sh [OPTIONS] <COMMAND> [ARGS]

COMMANDS:
    all                Run all code quality checks
    fix                Fix code issues automatically
    check <type>       Run specific check type
    report             Generate comprehensive quality report
    profile            Analyze code performance and complexity
    dependencies       Analyze dependency health and updates
    security           Run comprehensive security analysis
    pre-commit         Run pre-commit quality checks
    ci                 Run CI-optimized quality checks
    benchmark          Benchmark code quality metrics

CHECK TYPES:
    lint               ESLint code linting
    types              TypeScript type checking
    test               Unit and integration tests
    security           Security vulnerability scanning
    format             Code formatting validation
    complexity         Code complexity analysis
    coverage           Test coverage analysis
    duplicates         Code duplication detection

OPTIONS:
    --fix, -f          Automatically fix issues when possible
    --verbose, -v      Enable detailed output
    --quiet, -q        Suppress non-error output
    --strict, -s       Use strict mode (fail on warnings)
    --output, -o <file> Save report to file
    --format, -F <fmt> Report format (text, json, markdown)
    --help, -h         Show this help message

EXAMPLES:
    ./scripts/dev-tools/code-quality.sh all
    ./scripts/dev-tools/code-quality.sh --fix lint
    ./scripts/dev-tools/code-quality.sh --verbose --output report.md report
    ./scripts/dev-tools/code-quality.sh --strict pre-commit
    ./scripts/dev-tools/code-quality.sh dependencies

PREREQUISITES:
    - Node.js 20+ and pnpm installed
    - All project dependencies installed
    - Optional: sonar-scanner for advanced analysis
    - Optional: cloc for code metrics
EOF
}

# =============================================================================
# Environment Validation
# =============================================================================

validate_environment() {
    print_verbose "Validating code quality environment..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        exit 1
    fi
    
    # Check project structure
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found. Run from project root."
        exit 1
    fi
    
    # Check dependencies
    if [[ ! -d "node_modules" ]]; then
        print_warning "node_modules not found. Installing dependencies..."
        pnpm install
    fi
    
    # Create reports directory
    mkdir -p "$REPORT_DIR"
    
    print_verbose "Environment validation passed ✓"
}

# =============================================================================
# Timing and Metrics
# =============================================================================

start_timer() {
    local check_name=$1
    CHECK_TIMES[$check_name]=$(date +%s.%N)
}

end_timer() {
    local check_name=$1
    if [[ -n "${CHECK_TIMES[$check_name]:-}" ]]; then
        local start_time=${CHECK_TIMES[$check_name]}
        local end_time=$(date +%s.%N)
        local duration
        duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "0")
        echo "$duration"
    fi
}

record_result() {
    local check_name=$1
    local result=$2
    local issues=${3:-0}
    
    CHECK_RESULTS[$check_name]=$result
    TOTAL_ISSUES=$((TOTAL_ISSUES + issues))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# =============================================================================
# Quality Check Functions
# =============================================================================

run_eslint() {
    local start_time
    start_time=$(date +%s.%N)
    print_info "Running ESLint..."
    
    local eslint_cmd="pnpm lint"
    if [[ "$FIX_MODE" == "true" ]]; then
        eslint_cmd="pnpm lint:fix"
    fi
    
    if eval "$eslint_cmd" 2>/dev/null; then
        local duration
        duration=$(end_timer "eslint")
        record_result "eslint" "passed" 0
        print_metric "ESLint" "passed (${duration}s)" "success"
        return 0
    else
        local duration
        duration=$(end_timer "eslint")
        local issues
        issues=$(pnpm lint 2>&1 | grep -c "problem" || echo "unknown")
        record_result "eslint" "failed" "$issues"
        print_metric "ESLint" "failed ($issues issues, ${duration}s)" "error"
        
        if [[ "$STRICT_MODE" == "true" ]]; then
            return 1
        fi
    fi
}

run_typescript() {
    local start_time
    start_time=$(date +%s.%N)
    print_info "Running TypeScript checks..."
    
    if pnpm typecheck 2>/dev/null; then
        local duration
        duration=$(end_timer "typescript")
        record_result "typescript" "passed" 0
        print_metric "TypeScript" "passed (${duration}s)" "success"
        return 0
    else
        local duration
        duration=$(end_timer "typescript")
        local issues
        issues=$(pnpm typecheck 2>&1 | grep -c "error" || echo "unknown")
        record_result "typescript" "failed" "$issues"
        print_metric "TypeScript" "failed ($issues errors, ${duration}s)" "error"
        
        if [[ "$STRICT_MODE" == "true" ]]; then
            return 1
        fi
    fi
}

run_tests() {
    local start_time
    start_time=$(date +%s.%N)
    print_info "Running tests..."
    
    if pnpm test:run 2>/dev/null; then
        local duration
        duration=$(end_timer "tests")
        record_result "tests" "passed" 0
        print_metric "Tests" "passed (${duration}s)" "success"
        return 0
    else
        local duration
        duration=$(end_timer "tests")
        local failures
        failures=$(pnpm test:run 2>&1 | grep -c "failed" || echo "unknown")
        record_result "tests" "failed" "$failures"
        print_metric "Tests" "failed ($failures failures, ${duration}s)" "error"
        
        if [[ "$STRICT_MODE" == "true" ]]; then
            return 1
        fi
    fi
}

run_security_audit() {
    local start_time
    start_time=$(date +%s.%N)
    print_info "Running security audit..."
    
    if pnpm security:audit 2>/dev/null; then
        local duration
        duration=$(end_timer "security")
        record_result "security" "passed" 0
        print_metric "Security" "passed (${duration}s)" "success"
        return 0
    else
        local duration
        duration=$(end_timer "security")
        local vulnerabilities
        vulnerabilities=$(pnpm security:audit 2>&1 | grep -c "vulnerabilities" || echo "unknown")
        record_result "security" "warning" "$vulnerabilities"
        print_metric "Security" "found $vulnerabilities vulnerabilities (${duration}s)" "warning"
        
        # Security issues should always fail in strict mode
        if [[ "$STRICT_MODE" == "true" ]]; then
            return 1
        fi
    fi
}

run_format_check() {
    local start_time
    start_time=$(date +%s.%N)
    print_info "Checking code formatting..."
    
    # Check if files are properly formatted
    if pnpm format --check 2>/dev/null; then
        local duration
        duration=$(end_timer "format")
        record_result "format" "passed" 0
        print_metric "Format" "passed (${duration}s)" "success"
        return 0
    else
        local duration
        duration=$(end_timer "format")
        local unformatted
        unformatted=$(pnpm format --check 2>&1 | grep -c "Code style issues" || echo "unknown")
        record_result "format" "failed" "$unformatted"
        print_metric "Format" "found issues in $unformatted files (${duration}s)" "warning"
        
        if [[ "$FIX_MODE" == "true" ]]; then
            print_info "Auto-fixing formatting issues..."
            pnpm format
        fi
        
        if [[ "$STRICT_MODE" == "true" ]]; then
            return 1
        fi
    fi
}

run_complexity_analysis() {
    local start_time
    start_time=$(date +%s.%N)
    print_info "Analyzing code complexity..."
    
    # Simple complexity analysis using existing tools
    local complexity_issues=0
    
    # Check for large files (>500 lines)
    while IFS= read -r -d '' file; do
        local lines
        lines=$(wc -l < "$file")
        if [[ "$lines" -gt 500 ]]; then
            print_verbose "Large file: $file ($lines lines)"
            complexity_issues=$((complexity_issues + 1))
        fi
    done < <(find . -name "*.ts" -o -name "*.tsx" -not -path "./node_modules/*" -not -path "./dist/*" -print0)
    
    local duration
    duration=$(end_timer "complexity")
    
    if [[ "$complexity_issues" -eq 0 ]]; then
        record_result "complexity" "passed" 0
        print_metric "Complexity" "passed (${duration}s)" "success"
    else
        record_result "complexity" "warning" "$complexity_issues"
        print_metric "Complexity" "found $complexity_issues large files (${duration}s)" "warning"
    fi
}

run_coverage_analysis() {
    local start_time
    start_time=$(date +%s.%N)
    print_info "Analyzing test coverage..."
    
    if pnpm test:coverage 2>/dev/null; then
        local duration
        duration=$(end_timer "coverage")
        
        # Extract coverage percentage from output
        local coverage
        coverage=$(pnpm test:coverage 2>&1 | grep -o "All files[^%]*%" | grep -o "[0-9]*\.[0-9]*" || echo "0")
        
        if (( $(echo "$coverage >= 80" | bc -l 2>/dev/null || echo "1") )); then
            record_result "coverage" "passed" 0
            print_metric "Coverage" "${coverage}% (${duration}s)" "success"
        else
            record_result "coverage" "warning" 1
            print_metric "Coverage" "${coverage}% (target: 80%, ${duration}s)" "warning"
        fi
    else
        local duration
        duration=$(end_timer "coverage")
        record_result "coverage" "failed" 1
        print_metric "Coverage" "failed to generate (${duration}s)" "error"
    fi
}

run_dependency_analysis() {
    local start_time
    start_time=$(date +%s.%N)
    print_info "Analyzing dependencies..."
    
    local outdated_count=0
    local security_issues=0
    
    # Check for outdated packages
    if pnpm outdated 2>/dev/null; then
        outdated_count=$(pnpm outdated 2>/dev/null | grep -c "Package" || echo "0")
    fi
    
    # Check for security issues
    if ! pnpm security:audit 2>/dev/null; then
        security_issues=$(pnpm security:audit 2>&1 | grep -c "vulnerabilities" || echo "0")
    fi
    
    local duration
    duration=$(end_timer "dependencies")
    local total_issues=$((outdated_count + security_issues))
    
    if [[ "$total_issues" -eq 0 ]]; then
        record_result "dependencies" "passed" 0
        print_metric "Dependencies" "healthy (${duration}s)" "success"
    else
        record_result "dependencies" "warning" "$total_issues"
        print_metric "Dependencies" "$outdated_count outdated, $security_issues security (${duration}s)" "warning"
    fi
}

# =============================================================================
# Advanced Functions
# =============================================================================

run_all_checks() {
    print_header "🔍 Running Comprehensive Code Quality Checks"
    echo
    
    local overall_start_time
    overall_start_time=$(date +%s.%N)
    
    # Run all checks
    run_eslint || true
    run_typescript || true
    run_tests || true
    run_security_audit || true
    run_format_check || true
    run_complexity_analysis || true
    run_coverage_analysis || true
    run_dependency_analysis || true
    
    local overall_duration
    overall_duration=$(echo "$(date +%s.%N) - $overall_start_time" | bc -l 2>/dev/null || echo "0")
    
    echo
    print_header "📊 Quality Check Summary"
    echo
    
    # Print summary
    for check in "${!CHECK_RESULTS[@]}"; do
        local result=${CHECK_RESULTS[$check]}
        case $result in
            "passed")
                print_metric "$check" "✓" "success"
                ;;
            "warning")
                print_metric "$check" "⚠" "warning"
                ;;
            "failed")
                print_metric "$check" "✗" "error"
                ;;
        esac
    done
    
    echo
    print_metric "Total Checks" "$TOTAL_CHECKS"
    print_metric "Total Issues" "$TOTAL_ISSUES"
    print_metric "Duration" "${overall_duration}s"
    
    if [[ "$TOTAL_ISSUES" -eq 0 ]]; then
        echo
        print_success "All quality checks passed! 🎉"
        return 0
    else
        echo
        print_warning "Found $TOTAL_ISSUES issues. Review and fix as needed."
        return 1
    fi
}

fix_code() {
    print_header "🔧 Fixing Code Issues"
    echo
    
    FIX_MODE=true
    
    run_eslint || true
    run_format_check || true
    
    print_success "Code issues fixed automatically where possible"
}

generate_report() {
    local report_file="$OUTPUT_FILE"
    if [[ -z "$report_file" ]]; then
        report_file="$REPORT_DIR/quality-report-$TIMESTAMP.$REPORT_FORMAT"
    fi
    
    print_header "📋 Generating Quality Report"
    print_info "Report will be saved to: $report_file"
    
    # Run all checks to gather data
    run_all_checks > /tmp/quality_output.txt 2>&1 || true
    
    case "$REPORT_FORMAT" in
        "markdown")
            generate_markdown_report "$report_file"
            ;;
        "json")
            generate_json_report "$report_file"
            ;;
        *)
            generate_text_report "$report_file"
            ;;
    esac
    
    print_success "Quality report generated: $report_file"
}

generate_text_report() {
    local file=$1
    {
        echo "JasaWeb Code Quality Report"
        echo "Generated: $(date)"
        echo "================================"
        echo
        cat /tmp/quality_output.txt
    } > "$file"
}

generate_markdown_report() {
    local file=$1
    {
        echo "# JasaWeb Code Quality Report"
        echo
        echo "**Generated:** $(date)"
        echo
        echo "## Summary"
        echo
        echo "- **Total Checks:** $TOTAL_CHECKS"
        echo "- **Total Issues:** $TOTAL_ISSUES"
        echo
        echo "## Check Results"
        echo
        for check in "${!CHECK_RESULTS[@]}"; do
            local result=${CHECK_RESULTS[$check]}
            local status="✅"
            [[ "$result" == "warning" ]] && status="⚠️"
            [[ "$result" == "failed" ]] && status="❌"
            echo "- $status $check: $result"
        done
        echo
        echo "## Detailed Output"
        echo
        echo '```'
        cat /tmp/quality_output.txt
        echo '```'
    } > "$file"
}

generate_json_report() {
    local file=$1
    local json_data="{"
    json_data+='"timestamp":"'$(date)'",'
    json_data+='"summary":{'
    json_data+='"total_checks":'$TOTAL_CHECKS','
    json_data+='"total_issues":'$TOTAL_ISSUES
    json_data+='},'
    json_data+='"results":{'
    
    local first=true
    for check in "${!CHECK_RESULTS[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            json_data+=','
        fi
        json_data+='"'$check'":"'${CHECK_RESULTS[$check]}'"'
    done
    
    json_data+='}}'
    echo "$json_data" > "$file"
}

# =============================================================================
# Argument Parsing
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --fix|-f)
                FIX_MODE=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --quiet|-q)
                QUIET=true
                shift
                ;;
            --strict|-s)
                STRICT_MODE=true
                shift
                ;;
            --output|-o)
                if [[ -n "${2:-}" ]]; then
                    OUTPUT_FILE="$2"
                    shift 2
                else
                    print_error "Output file required after --output"
                    exit 1
                fi
                ;;
            --format|-F)
                if [[ -n "${2:-}" ]] && [[ "$2" =~ ^(text|json|markdown)$ ]]; then
                    REPORT_FORMAT="$2"
                    shift 2
                else
                    print_error "Invalid format. Use: text, json, or markdown"
                    exit 1
                fi
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
}

# =============================================================================
# Additional Functions
# =============================================================================

# Function to run specific checks
run_specific_checks() {
    local check_type=$1
    
    case "$check_type" in
        lint)
            run_eslint
            ;;
        types|typescript)
            run_typescript
            ;;
        test)
            run_tests
            ;;
        security)
            run_security_audit
            ;;
        format)
            run_format_check
            ;;
        complexity)
            run_complexity_analysis
            ;;
        coverage)
            run_coverage_analysis
            ;;
        dependencies)
            run_dependency_analysis
            ;;
        *)
            print_error "Unknown check type: $check_type"
            echo "Available check types: lint, types, test, security, format, complexity, coverage, dependencies"
            return 1
            ;;
    esac
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    parse_arguments "$@"
    
    # Remove processed options from arguments
    while [[ $# -gt 0 ]] && [[ "$1" =~ ^-- ]]; do
        case $1 in
            --fix|--verbose|--quiet|--strict|-f|-v|-q|-s)
                shift
                ;;
            --output|--format|-o|-F)
                shift 2
                ;;
            *)
                break
                ;;
        esac
    done
    
    local command=${1:-"all"}
    shift || true
    
    print_verbose "Starting JasaWeb Code Quality Tools..."
    print_verbose "Command: $command, Fix: $FIX_MODE, Strict: $STRICT_MODE"
    
    validate_environment
    
    case "$command" in
        all)
            run_all_checks
            ;;
        fix)
            fix_code
            ;;
        check)
            run_specific_checks "$1"
            ;;
        report)
            generate_report
            ;;
        profile)
            run_complexity_analysis
            run_coverage_analysis
            ;;
        dependencies)
            run_dependency_analysis
            ;;
        security)
            run_security_audit
            ;;
        pre-commit)
            # Optimized for pre-commit hooks
            QUIET=true
            STRICT_MODE=true
            run_eslint && run_typescript && run_format_check
            ;;
        ci)
            # Optimized for CI environments
            run_all_checks
            ;;
        benchmark)
            run_all_checks
            echo
            print_header "🏆 Quality Benchmark"
            print_metric "Quality Score" "$((100 - TOTAL_ISSUES))%"
            ;;
        *)
            print_error "Unknown command: $command"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"