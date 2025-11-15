#!/bin/bash

# Database management tools for JasaWeb development
# This script provides utilities for database operations

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

# Function to reset database
reset_database() {
    print_info "Resetting database..."
    
    # Confirm action
    read -p "This will delete all data. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Database reset cancelled"
        return
    fi
    
    # Reset database
    if pnpm db:reset; then
        print_success "Database reset successfully"
        
        # Ask about seeding
        read -p "Do you want to seed the database? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if pnpm db:seed; then
                print_success "Database seeded successfully"
            else
                print_error "Failed to seed database"
            fi
        fi
    else
        print_error "Failed to reset database"
    fi
}

# Function to create migration
create_migration() {
    local name=$1
    
    if [ -z "$name" ]; then
        print_error "Migration name is required"
        echo "Usage: $0 migrate <migration-name>"
        return 1
    fi
    
    print_info "Creating migration: $name"
    
    if pnpm db:migrate --name "$name"; then
        print_success "Migration created successfully"
    else
        print_error "Failed to create migration"
    fi
}

# Function to run migrations
run_migrations() {
    print_info "Running database migrations..."
    
    if pnpm db:migrate; then
        print_success "Migrations applied successfully"
    else
        print_error "Failed to apply migrations"
    fi
}

# Function to open Prisma Studio
open_studio() {
    print_info "Opening Prisma Studio..."
    pnpm db:studio
}

# Function to generate Prisma client
generate_client() {
    print_info "Generating Prisma client..."
    
    if pnpm db:generate; then
        print_success "Prisma client generated successfully"
    else
        print_error "Failed to generate Prisma client"
    fi
}

# Main execution
case "$1" in
    reset)
        reset_database
        ;;
    migrate)
        create_migration "$2"
        ;;
    up)
        run_migrations
        ;;
    studio)
        open_studio
        ;;
    generate)
        generate_client
        ;;
    *)
        echo "Database Tools for JasaWeb"
        echo "Usage: $0 {reset|migrate|up|studio|generate}"
        echo ""
        echo "Commands:"
        echo "  reset      Reset the database (WARNING: This will delete all data)"
        echo "  migrate    Create a new migration (requires migration name)"
        echo "  up         Run pending migrations"
        echo "  studio     Open Prisma Studio"
        echo "  generate   Generate Prisma client"
        exit 1
        ;;
esac