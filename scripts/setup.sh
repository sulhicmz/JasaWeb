#!/bin/bash

# JasaWeb Development Environment Setup Script
# This script sets up a complete development environment for JasaWeb

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}🚀 JasaWeb Development Environment Setup${NC}"
    echo -e "${BLUE}=============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check system requirements
check_requirements() {
    print_info "Checking system requirements..."
    
    # Check Node.js
    if check_command node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
        
        # Check if version is 20+
        if [[ $(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1) -ge 20 ]]; then
            print_success "Node.js version is compatible (20+)"
        else
            print_error "Node.js version 20+ is required. Current: $NODE_VERSION"
            print_info "Please install Node.js 20+ from https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Node.js not found"
        print_info "Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check pnpm
    if check_command pnpm; then
        PNPM_VERSION=$(pnpm --version)
        print_success "pnpm found: $PNPM_VERSION"
    else
        print_warning "pnpm not found, enabling corepack..."
        corepack enable
        if check_command pnpm; then
            print_success "pnpm enabled via corepack"
        else
            print_error "Failed to enable pnpm"
            exit 1
        fi
    fi
    
    # Check Docker
    if check_command docker; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker found: $DOCKER_VERSION"
    else
        print_warning "Docker not found. Some features may not work."
        print_info "Install Docker from https://docker.com/"
    fi
    
    # Check Docker Compose
    if check_command docker-compose || docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose found"
    else
        print_warning "Docker Compose not found. Database setup may fail."
    fi
    
    # Check Git
    if check_command git; then
        GIT_VERSION=$(git --version)
        print_success "Git found: $GIT_VERSION"
    else
        print_error "Git not found"
        print_info "Please install Git from https://git-scm.com/"
        exit 1
    fi
}

# Setup environment files
setup_environment() {
    print_info "Setting up environment files..."
    
    # Root .env
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
            print_warning "Please edit .env with your configuration"
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_info ".env already exists"
    fi
    
    # API .env
    if [ ! -f apps/api/.env ]; then
        if [ -f apps/api/.env.example ]; then
            cp apps/api/.env.example apps/api/.env
            print_success "Created apps/api/.env from .env.example"
        else
            print_warning "apps/api/.env.example not found"
        fi
    else
        print_info "apps/api/.env already exists"
    fi
    
    # Web .env
    if [ ! -f apps/web/.env ]; then
        if [ -f apps/web/.env.example ]; then
            cp apps/web/.env.example apps/web/.env
            print_success "Created apps/web/.env from .env.example"
        else
            print_warning "apps/web/.env.example not found"
        fi
    else
        print_info "apps/web/.env already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    if pnpm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    if check_command docker-compose || docker compose version >/dev/null 2>&1; then
        print_info "Starting database services..."
        
        if docker-compose up -d; then
            print_success "Database services started"
            
            # Wait for database to be ready
            print_info "Waiting for database to be ready..."
            sleep 10
            
            # Run migrations
            print_info "Running database migrations..."
            if pnpm db:migrate; then
                print_success "Database migrations completed"
            else
                print_warning "Database migrations failed, you may need to run them manually"
            fi
            
            # Seed database (optional)
            read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "Seeding database..."
                if pnpm db:seed; then
                    print_success "Database seeded successfully"
                else
                    print_warning "Database seeding failed"
                fi
            fi
        else
            print_error "Failed to start database services"
            exit 1
        fi
    else
        print_warning "Docker Compose not available. Please setup database manually."
        print_info "See README.md for database setup instructions."
    fi
}

# Build applications
build_applications() {
    print_info "Building applications..."
    
    if pnpm build; then
        print_success "Applications built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    if pnpm test:run; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed. Check the output above."
    fi
}

# Setup Git hooks
setup_git_hooks() {
    print_info "Setting up Git hooks..."
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for JasaWeb

echo "🔍 Running pre-commit checks..."

# Run linting
echo "Running ESLint..."
if ! pnpm lint; then
    echo "❌ ESLint failed"
    exit 1
fi

# Run type checking
echo "Running TypeScript checks..."
if ! pnpm typecheck; then
    echo "❌ TypeScript checks failed"
    exit 1
fi

# Run tests
echo "Running tests..."
if ! pnpm test:run; then
    echo "❌ Tests failed"
    exit 1
fi

echo "✅ All pre-commit checks passed!"
EOF

    chmod +x .git/hooks/pre-commit
    print_success "Git hooks installed"
}

# Final verification
verify_setup() {
    print_info "Verifying setup..."
    
    # Check if applications can start
    print_info "Testing application startup..."
    
    # Test API
    cd apps/api
    if timeout 10s pnpm start:dev >/dev/null 2>&1; then
        print_success "API can start successfully"
    else
        print_warning "API startup test failed"
    fi
    cd ../..
    
    # Test Web
    cd apps/web
    if timeout 10s pnpm dev >/dev/null 2>&1; then
        print_success "Web application can start successfully"
    else
        print_warning "Web application startup test failed"
    fi
    cd ../..
}

# Print next steps
print_next_steps() {
    echo ""
    print_success "🎉 Development environment setup complete!"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Review and update environment files:"
    echo "   - .env"
    echo "   - apps/api/.env"
    echo "   - apps/web/.env"
    echo ""
    echo "2. Start development servers:"
    echo "   ${YELLOW}pnpm dev${NC}                    # Start all applications"
    echo "   ${YELLOW}pnpm dev:web${NC}                # Start web application only"
    echo "   ${YELLOW}pnpm dev:api${NC}                # Start API only"
    echo ""
    echo "3. Access applications:"
    echo "   - Web: http://localhost:4321"
    echo "   - API: http://localhost:3000"
    echo "   - API Docs: http://localhost:3000/api/docs"
    echo ""
    echo "4. Useful commands:"
    echo "   ${YELLOW}pnpm test${NC}                   # Run tests"
    echo "   ${YELLOW}pnpm lint${NC}                   # Run linter"
    echo "   ${YELLOW}pnpm build${NC}                  # Build for production"
    echo "   ${YELLOW}pnpm db:studio${NC}              # Open Prisma Studio"
    echo ""
    echo "5. Database management:"
    echo "   ${YELLOW}pnpm db:migrate${NC}             # Run migrations"
    echo "   ${YELLOW}pnpm db:generate${NC}            # Generate Prisma client"
    echo "   ${YELLOW}pnpm db:seed${NC}                # Seed database"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Main execution
main() {
    print_header
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
        print_error "Please run this script from the JasaWeb root directory"
        exit 1
    fi
    
    check_requirements
    setup_environment
    install_dependencies
    setup_database
    build_applications
    run_tests
    setup_git_hooks
    verify_setup
    print_next_steps
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT

# Run main function
main "$@"