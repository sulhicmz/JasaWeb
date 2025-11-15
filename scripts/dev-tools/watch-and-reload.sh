#!/bin/bash

# Script to watch file changes and automatically reload development servers
# This script uses nodemon to watch for file changes and restart services

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

# Check if nodemon is installed
if ! command -v nodemon &> /dev/null; then
    print_warning "nodemon not found, installing..."
    npm install -g nodemon
fi

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