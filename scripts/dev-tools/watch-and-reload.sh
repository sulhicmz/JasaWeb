#!/bin/bash

# =============================================================================
# JasaWeb Development Watcher
# =============================================================================
# This script provides intelligent file watching and automatic reloading for
# development servers. It supports selective watching, performance monitoring,
# and optimized rebuild strategies.
#
# USAGE:
#   ./scripts/dev-tools/watch-and-reload.sh [OPTIONS] <TARGET>
#
# TARGETS:
#   api     - Watch API changes only
#   web     - Watch Web changes only  
#   all     - Watch both API and Web changes (default)
#
# OPTIONS:
#   --verbose, -v     Enable verbose output
#   --quiet, -q       Suppress non-error output
#   --performance, -p Enable performance monitoring
#   --delay, -d N     Set debounce delay in seconds (default: 1)
#   --help, -h        Show this help message
#
# EXAMPLES:
#   ./scripts/dev-tools/watch-and-reload.sh api
#   ./scripts/dev-tools/watch-and-reload.sh --verbose all
#   ./scripts/dev-tools/watch-and-reload.sh --performance --delay 2 web
#
# PREREQUISITES:
#   - Node.js 20+ and pnpm installed
#   - nodemon installed globally or locally
#   - Project dependencies installed (pnpm install)
#
# TROUBLESHOOTING:
#   - If nodemon is not found, run: npm install -g nodemon
#   - For permission issues, run: chmod +x scripts/dev-tools/watch-and-reload.sh
#   - If builds fail, ensure dependencies are up to date: pnpm update
# =============================================================================

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly NC='\033[0m' # No Color

# Default configuration
VERBOSE=false
QUIET=false
PERFORMANCE_MONITORING=false
DEBOUNCE_DELAY=1
TARGET="all"

# Performance tracking
declare -A START_TIMES
declare -A REBUILD_COUNTS

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

print_performance() {
    if [[ "$PERFORMANCE_MONITORING" == "true" ]]; then
        echo -e "${MAGENTA}⚡ $1${NC}"
    fi
}

show_help() {
    cat << 'EOF'
JasaWeb Development Watcher

USAGE:
    ./scripts/dev-tools/watch-and-reload.sh [OPTIONS] <TARGET>

TARGETS:
    api     Watch API changes only
    web     Watch Web changes only  
    all     Watch both API and Web changes (default)

OPTIONS:
    --verbose, -v     Enable verbose output
    --quiet, -q       Suppress non-error output
    --performance, -p Enable performance monitoring
    --delay, -d N     Set debounce delay in seconds (default: 1)
    --help, -h        Show this help message

EXAMPLES:
    ./scripts/dev-tools/watch-and-reload.sh api
    ./scripts/dev-tools/watch-and-reload.sh --verbose all
    ./scripts/dev-tools/watch-and-reload.sh --performance --delay 2 web

PREREQUISITES:
    - Node.js 20+ and pnpm installed
    - nodemon installed globally or locally
    - Project dependencies installed (pnpm install)

TROUBLESHOOTING:
    - If nodemon is not found, run: npm install -g nodemon
    - For permission issues, run: chmod +x scripts/dev-tools/watch-and-reload.sh
    - If builds fail, ensure dependencies are up to date: pnpm update
EOF
}

# =============================================================================
# Environment Validation
# =============================================================================

validate_environment() {
    print_verbose "Validating development environment..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20 or higher."
        exit 1
    fi
    
    local node_version
    node_version=$(node --version | cut -d'v' -f2)
    if ! node --version | grep -qE '^v[2-9][0-9]\.'; then
        print_error "Node.js version 20 or higher is required. Current version: $node_version"
        exit 1
    fi
    print_verbose "Node.js version: $node_version ✓"
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install pnpm."
        exit 1
    fi
    print_verbose "pnpm version: $(pnpm --version) ✓"
    
    # Check project structure
    if [[ ! -d "apps/api" ]] || [[ ! -d "apps/web" ]]; then
        print_error "Project structure is invalid. apps/api and apps/web directories must exist."
        exit 1
    fi
    
    # Check dependencies
    if [[ ! -f "pnpm-lock.yaml" ]]; then
        print_warning "pnpm-lock.yaml not found. Run 'pnpm install' to install dependencies."
    fi
    
    print_verbose "Environment validation passed ✓"
}

# =============================================================================
# Dependency Management
# =============================================================================

ensure_nodemon() {
    if ! command -v nodemon &> /dev/null; then
        print_warning "nodemon not found, attempting to install..."
        
        # Try local installation first
        if [[ -f "package.json" ]] && grep -q "nodemon" package.json; then
            print_info "Installing nodemon locally..."
            pnpm add -D nodemon
        else
            print_info "Installing nodemon globally..."
            npm install -g nodemon
        fi
        
        if ! command -v nodemon &> /dev/null; then
            print_error "Failed to install nodemon. Please install it manually: npm install -g nodemon"
            exit 1
        fi
        print_success "nodemon installed successfully"
    else
        print_verbose "nodemon found: $(nodemon --version) ✓"
    fi
}

# =============================================================================
# Performance Monitoring
# =============================================================================

start_performance_timer() {
    local service=$1
    START_TIMES[$service]=$(date +%s.%N)
}

end_performance_timer() {
    local service=$1
    local operation=$2
    
    if [[ -n "${START_TIMES[$service]:-}" ]]; then
        local start_time=${START_TIMES[$service]}
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "0")
        
        REBUILD_COUNTS[$service]=$((${REBUILD_COUNTS[$service]:-0} + 1))
        
        print_performance "$service $operation completed in ${duration}s (rebuild #${REBUILD_COUNTS[$service]})"
    fi
}

# =============================================================================
# Watch Functions
# =============================================================================

watch_api() {
    print_info "🔧 Watching API for changes..."
    print_verbose "API watch directory: apps/api/src"
    print_verbose "File extensions: ts, json"
    print_verbose "Debounce delay: ${DEBOUNCE_DELAY}s"
    
    local nodemon_cmd="nodemon"
    nodemon_cmd+=" --watch apps/api/src"
    nodemon_cmd+=" --exec 'pnpm build:api && pnpm dev:api'"
    nodemon_cmd+=" --ext ts,json"
    nodemon_cmd+=" --delay ${DEBOUNCE_DELAY}"
    
    if [[ "$VERBOSE" == "true" ]]; then
        nodemon_cmd+=" --verbose"
    fi
    
    if [[ "$PERFORMANCE_MONITORING" == "true" ]]; then
        nodemon_cmd+=" --exec 'echo \"Starting API rebuild...\" && start_performance_timer api && pnpm build:api && end_performance_timer api build && pnpm dev:api'"
    fi
    
    print_verbose "Executing: $nodemon_cmd"
    eval "$nodemon_cmd"
}

watch_web() {
    print_info "🎨 Watching Web for changes..."
    print_verbose "Web watch directory: apps/web/src"
    print_verbose "File extensions: astro, ts, tsx, js, jsx, json, css, scss, html"
    print_verbose "Debounce delay: ${DEBOUNCE_DELAY}s"
    
    local nodemon_cmd="nodemon"
    nodemon_cmd+=" --watch apps/web/src"
    nodemon_cmd+=" --exec 'pnpm build:web && pnpm dev:web'"
    nodemon_cmd+=" --ext astro,ts,tsx,js,jsx,json,css,scss,html"
    nodemon_cmd+=" --delay ${DEBOUNCE_DELAY}"
    
    if [[ "$VERBOSE" == "true" ]]; then
        nodemon_cmd+=" --verbose"
    fi
    
    if [[ "$PERFORMANCE_MONITORING" == "true" ]]; then
        nodemon_cmd+=" --exec 'echo \"Starting Web rebuild...\" && start_performance_timer web && pnpm build:web && end_performance_timer web build && pnpm dev:web'"
    fi
    
    print_verbose "Executing: $nodemon_cmd"
    eval "$nodemon_cmd"
}

watch_all() {
    print_info "🚀 Watching all applications for changes..."
    
    # Check if bc is available for performance timing
    if [[ "$PERFORMANCE_MONITORING" == "true" ]] && ! command -v bc &> /dev/null; then
        print_warning "bc command not found. Performance monitoring will be limited."
        print_info "Install bc for accurate timing: apt-get install bc (Ubuntu) or brew install bc (macOS)"
    fi
    
    # Start API watcher in background
    print_info "Starting API watcher in background..."
    nodemon --watch apps/api/src --exec "pnpm build:api" --ext ts,json --delay "${DEBOUNCE_DELAY}" &
    local API_PID=$!
    
    # Start Web watcher in background
    print_info "Starting Web watcher in background..."
    nodemon --watch apps/web/src --exec "pnpm build:web" --ext astro,ts,tsx,js,jsx,json,css,scss,html --delay "${DEBOUNCE_DELAY}" &
    local WEB_PID=$!
    
    print_success "Watchers started (API PID: $API_PID, Web PID: $WEB_PID)"
    print_info "Press Ctrl+C to stop all watchers"
    
    # Trap signals to clean up child processes
    trap 'print_info "Stopping watchers..."; kill $API_PID $WEB_PID 2>/dev/null || true; exit 0' INT TERM
    
    # Wait for both processes
    wait $API_PID $WEB_PID
}

# =============================================================================
# Argument Parsing
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --quiet|-q)
                QUIET=true
                shift
                ;;
            --performance|-p)
                PERFORMANCE_MONITORING=true
                shift
                ;;
            --delay|-d)
                if [[ -n "${2:-}" ]] && [[ "$2" =~ ^[0-9]+$ ]]; then
                    DEBOUNCE_DELAY="$2"
                    shift 2
                else
                    print_error "Invalid delay value. Please provide a positive integer."
                    exit 1
                fi
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            api|web|all)
                TARGET="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information."
                exit 1
                ;;
        esac
    done
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    parse_arguments "$@"
    
    print_verbose "Starting JasaWeb Development Watcher..."
    print_verbose "Configuration: Target=$TARGET, Verbose=$VERBOSE, Performance=$PERFORMANCE_MONITORING, Delay=${DEBOUNCE_DELAY}s"
    
    validate_environment
    ensure_nodemon
    
    case "$TARGET" in
        api)
            watch_api
            ;;
        web)
            watch_web
            ;;
        all)
            watch_all
            ;;
        *)
            print_error "Invalid target: $TARGET"
            echo "Valid targets: api, web, all"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"

# Function to start watching API
watch_api() {
    print_info "Watching API for changes..."
    nodemon --watch apps/api/src --exec "pnpm build:api && pnpm dev:api" --ext ts,json
}

# Function to start watching Web
watch_web() {
    print_info "Watching Web for changes..."
    nodemon --watch apps/web/src --exec "pnpm build:web && pnpm dev:web" --ext astro,ts,tsx,js,jsx,json,css,scss,html
}

# Function to start watching both
watch_all() {
    print_info "Watching all applications for changes..."
    
    # Start API watcher in background
    nodemon --watch apps/api/src --exec "pnpm build:api" --ext ts,json &
    API_PID=$!
    
    # Start Web watcher in background
    nodemon --watch apps/web/src --exec "pnpm build:web" --ext astro,ts,tsx,js,jsx,json,css,scss,html &
    WEB_PID=$!
    
    # Trap SIGINT to kill child processes
    trap "kill $API_PID $WEB_PID; exit 1" INT
    
    # Wait for both processes
    wait $API_PID $WEB_PID
}

# Main execution
case "$1" in
    api)
        watch_api
        ;;
    web)
        watch_web
        ;;
    all)
        watch_all
        ;;
    *)
        echo "Usage: $0 {api|web|all}"
        echo "  api  - Watch API changes only"
        echo "  web  - Watch Web changes only"
        echo "  all  - Watch both API and Web changes"
        exit 1
        ;;
esac