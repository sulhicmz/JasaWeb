#!/bin/bash

# =============================================================================
# JasaWeb Database Management Tools
# =============================================================================
# Comprehensive database management utilities for development and production.
# Supports multiple environments, backup/restore, migrations, and advanced operations.
#
# USAGE:
#   ./scripts/dev-tools/database-tools.sh [OPTIONS] <COMMAND> [ARGS]
#
# COMMANDS:
#   reset              Reset database (WARNING: deletes all data)
#   migrate <name>     Create new migration with specified name
#   up                 Apply pending migrations
#   down [n]           Rollback last n migrations (default: 1)
#   studio             Open Prisma Studio
#   generate           Generate Prisma client
#   backup [name]      Create database backup
#   restore <file>     Restore database from backup file
#   seed               Seed database with initial data
#   status             Show migration status
#   validate           Validate database schema
#   env <name>         Switch to different environment
#
# OPTIONS:
#   --force, -f        Skip confirmation prompts
#   --verbose, -v      Enable verbose output
#   --env, -e <name>   Specify environment (dev, test, prod)
#   --help, -h         Show this help message
#
# EXAMPLES:
#   ./scripts/dev-tools/database-tools.sh reset
#   ./scripts/dev-tools/database-tools.sh migrate add_user_table
#   ./scripts/dev-tools/database-tools.sh --env test backup
#   ./scripts/dev-tools/database-tools.sh restore backup_20231201.sql
#   ./scripts/dev-tools/database-tools.sh down 2
#
# ENVIRONMENTS:
#   dev    - Development environment (default)
#   test   - Testing environment
#   prod   - Production environment (use with caution)
#
# PREREQUISITES:
#   - PostgreSQL installed and running
#   - pnpm and project dependencies installed
#   - Database configured in .env files
#   - Sufficient permissions for database operations
#
# TROUBLESHOOTING:
#   - Connection issues: Check DATABASE_URL in .env
#   - Permission denied: Ensure database user has required privileges
#   - Migration conflicts: Resolve manually or use --force
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

# Configuration
FORCE=false
VERBOSE=false
ENVIRONMENT="dev"
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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
    echo -e "${RED}❌ $1${NC}" >&2
}

print_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${CYAN}🔍 $1${NC}" >&2
    fi
}

print_step() {
    echo -e "${MAGENTA}🔄 $1${NC}"
}

show_help() {
    cat << 'EOF'
JasaWeb Database Management Tools

USAGE:
    ./scripts/dev-tools/database-tools.sh [OPTIONS] <COMMAND> [ARGS]

COMMANDS:
    reset              Reset database (WARNING: deletes all data)
    migrate <name>     Create new migration with specified name
    up                 Apply pending migrations
    down [n]           Rollback last n migrations (default: 1)
    studio             Open Prisma Studio
    generate           Generate Prisma client
    backup [name]      Create database backup
    restore <file>     Restore database from backup file
    seed               Seed database with initial data
    status             Show migration status
    validate           Validate database schema
    env <name>         Switch to different environment

OPTIONS:
    --force, -f        Skip confirmation prompts
    --verbose, -v      Enable verbose output
    --env, -e <name>   Specify environment (dev, test, prod)
    --help, -h         Show this help message

EXAMPLES:
    ./scripts/dev-tools/database-tools.sh reset
    ./scripts/dev-tools/database-tools.sh migrate add_user_table
    ./scripts/dev-tools/database-tools.sh --env test backup
    ./scripts/dev-tools/database-tools.sh restore backup_20231201.sql
    ./scripts/dev-tools/database-tools.sh down 2

ENVIRONMENTS:
    dev    - Development environment (default)
    test   - Testing environment
    prod   - Production environment (use with caution)

PREREQUISITES:
    - PostgreSQL installed and running
    - pnpm and project dependencies installed
    - Database configured in .env files
    - Sufficient permissions for database operations
EOF
}

# =============================================================================
# Environment Management
# =============================================================================

validate_environment() {
    print_verbose "Validating database environment..."
    
    # Check if we're in the right directory
    if [[ ! -d "apps/api" ]]; then
        print_error "This script must be run from the project root directory"
        exit 1
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) is not installed"
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        exit 1
    fi
    
    # Check Prisma
    if ! cd apps/api && pnpm prisma --version &> /dev/null; then
        print_error "Prisma CLI is not available"
        exit 1
    fi
    cd - > /dev/null
    
    # Validate environment file
    local env_file="apps/api/.env"
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        env_file="apps/api/.env.$ENVIRONMENT"
    fi
    
    if [[ ! -f "$env_file" ]]; then
        print_warning "Environment file $env_file not found"
        print_info "Using default .env file"
        env_file="apps/api/.env"
    fi
    
    if [[ ! -f "$env_file" ]]; then
        print_error "No environment file found. Please create .env or .env.$ENVIRONMENT"
        exit 1
    fi
    
    # Test database connection
    print_verbose "Testing database connection..."
    if ! cd apps/api && pnpm db:ping &> /dev/null; then
        print_error "Cannot connect to database. Check DATABASE_URL in $env_file"
        exit 1
    fi
    cd - > /dev/null
    
    print_verbose "Environment validation passed ✓"
}

switch_environment() {
    local new_env=$1
    
    if [[ ! "$new_env" =~ ^(dev|test|prod)$ ]]; then
        print_error "Invalid environment: $new_env. Valid options: dev, test, prod"
        exit 1
    fi
    
    print_info "Switching to $new_env environment..."
    
    local env_file="apps/api/.env"
    local target_env_file="apps/api/.env.$new_env"
    
    if [[ ! -f "$target_env_file" ]]; then
        print_error "Environment file $target_env_file not found"
        exit 1
    fi
    
    # Backup current .env if it exists and isn't a symlink
    if [[ -f "$env_file" ]] && [[ ! -L "$env_file" ]]; then
        cp "$env_file" "$env_file.backup.$TIMESTAMP"
        print_info "Backed up current .env to $env_file.backup.$TIMESTAMP"
    fi
    
    # Create symlink to target environment
    ln -sf "$target_env_file" "$env_file"
    ENVIRONMENT="$new_env"
    
    print_success "Switched to $new_env environment"
    validate_environment
}

# =============================================================================
# Backup and Restore Functions
# =============================================================================

create_backup() {
    local backup_name=${1:-"backup_${TIMESTAMP}"}
    local backup_file="$BACKUP_DIR/${backup_name}.sql"
    
    print_step "Creating database backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Extract database connection info
    cd apps/api
    local db_url
    db_url=$(grep DATABASE_URL .env | cut -d'=' -f2-)
    
    if [[ -z "$db_url" ]]; then
        print_error "DATABASE_URL not found in environment file"
        exit 1
    fi
    
    # Create backup
    print_verbose "Extracting database from URL: ${db_url%%@*}@***"
    
    if pg_dump "$db_url" > "../$backup_file" 2>/dev/null; then
        cd - > /dev/null
        print_success "Backup created: $backup_file"
        print_info "Backup size: $(du -h "$backup_file" | cut -f1)"
    else
        cd - > /dev/null
        print_error "Failed to create backup"
        exit 1
    fi
}

restore_backup() {
    local backup_file=$1
    
    if [[ ! -f "$backup_file" ]]; then
        # Try to find it in backups directory
        backup_file="$BACKUP_DIR/$backup_file"
        if [[ ! -f "$backup_file" ]]; then
            print_error "Backup file not found: $backup_file"
            exit 1
        fi
    fi
    
    print_step "Restoring database from: $backup_file"
    
    if [[ "$FORCE" != "true" ]]; then
        read -p "This will replace all current data. Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Database restore cancelled"
            return
        fi
    fi
    
    # Extract database connection info
    cd apps/api
    local db_url
    db_url=$(grep DATABASE_URL .env | cut -d'=' -f2-)
    
    if [[ -z "$db_url" ]]; then
        print_error "DATABASE_URL not found in environment file"
        exit 1
    fi
    
    # Restore backup
    if psql "$db_url" < "../$backup_file" 2>/dev/null; then
        cd - > /dev/null
        print_success "Database restored successfully"
        
        # Regenerate Prisma client
        generate_client
    else
        cd - > /dev/null
        print_error "Failed to restore database"
        exit 1
    fi
}

# =============================================================================
# Migration Functions
# =============================================================================

reset_database() {
    print_step "Resetting database..."
    
    if [[ "$FORCE" != "true" ]]; then
        read -p "This will delete all data. Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Database reset cancelled"
            return
        fi
    fi
    
    # Create backup before reset
    if [[ "$ENVIRONMENT" == "prod" ]] && [[ "$FORCE" != "true" ]]; then
        print_warning "Creating backup before production reset..."
        create_backup "pre_reset_backup"
    fi
    
    cd apps/api
    
    if pnpm db:reset; then
        cd - > /dev/null
        print_success "Database reset successfully"
        
        # Ask about seeding
        if [[ "$FORCE" != "true" ]]; then
            read -p "Do you want to seed the database? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                seed_database
            fi
        else
            seed_database
        fi
    else
        cd - > /dev/null
        print_error "Failed to reset database"
        exit 1
    fi
}

create_migration() {
    local name=$1
    
    if [[ -z "$name" ]]; then
        print_error "Migration name is required"
        echo "Usage: $0 migrate <migration-name>"
        exit 1
    fi
    
    # Validate migration name
    if [[ ! "$name" =~ ^[a-z][a-z0-9_]*$ ]]; then
        print_error "Migration name must start with a letter and contain only lowercase letters, numbers, and underscores"
        exit 1
    fi
    
    print_step "Creating migration: $name"
    
    cd apps/api
    
    if pnpm db:migrate --name "$name"; then
        cd - > /dev/null
        print_success "Migration created successfully"
        print_info "Migration file: apps/api/prisma/migrations/*_${name}.migration.sql"
    else
        cd - > /dev/null
        print_error "Failed to create migration"
        exit 1
    fi
}

run_migrations() {
    print_step "Running database migrations..."
    
    cd apps/api
    
    if pnpm db:migrate; then
        cd - > /dev/null
        print_success "Migrations applied successfully"
    else
        cd - > /dev/null
        print_error "Failed to apply migrations"
        exit 1
    fi
}

rollback_migrations() {
    local count=${1:-1}
    
    if [[ ! "$count" =~ ^[0-9]+$ ]] || [[ "$count" -lt 1 ]]; then
        print_error "Invalid rollback count: $count"
        exit 1
    fi
    
    print_step "Rolling back $count migration(s)..."
    
    cd apps/api
    
    # Get current migration status
    local applied_migrations
    applied_migrations=$(pnpm prisma migrate status 2>/dev/null | grep -c "Applied" || echo "0")
    
    if [[ "$applied_migrations" -lt "$count" ]]; then
        print_error "Cannot rollback $count migrations. Only $applied_migrations applied."
        exit 1
    fi
    
    if pnpm prisma migrate reset --force --skip-seed; then
        cd - > /dev/null
        print_warning "All migrations have been reset. Please reapply migrations manually."
        print_info "Use '$0 up' to reapply all migrations"
    else
        cd - > /dev/null
        print_error "Failed to rollback migrations"
        exit 1
    fi
}

# =============================================================================
# Utility Functions
# =============================================================================

open_studio() {
    print_info "Opening Prisma Studio..."
    print_info "Studio will open in your default browser"
    
    cd apps/api
    pnpm db:studio
    cd - > /dev/null
}

generate_client() {
    print_step "Generating Prisma client..."
    
    cd apps/api
    
    if pnpm db:generate; then
        cd - > /dev/null
        print_success "Prisma client generated successfully"
    else
        cd - > /dev/null
        print_error "Failed to generate Prisma client"
        exit 1
    fi
}

seed_database() {
    print_step "Seeding database..."
    
    cd apps/api
    
    if pnpm db:seed; then
        cd - > /dev/null
        print_success "Database seeded successfully"
    else
        cd - > /dev/null
        print_warning "Database seeding completed with warnings"
    fi
}

show_migration_status() {
    print_info "Migration Status:"
    echo
    
    cd apps/api
    
    if pnpm prisma migrate status; then
        echo
        print_success "Migration status retrieved successfully"
    else
        print_error "Failed to get migration status"
    fi
    
    cd - > /dev/null
}

validate_schema() {
    print_step "Validating database schema..."
    
    cd apps/api
    
    # Check Prisma schema syntax
    if pnpm prisma validate; then
        print_success "Prisma schema is valid"
    else
        print_error "Prisma schema validation failed"
        exit 1
    fi
    
    # Check database connection and schema sync
    local status_output
    status_output=$(pnpm prisma migrate status 2>&1)
    
    if echo "$status_output" | grep -q "Your database is up to date"; then
        print_success "Database schema is in sync"
    elif echo "$status_output" | grep -q "Your database is not up to date"; then
        print_warning "Database schema is out of sync"
        print_info "Run '$0 up' to apply pending migrations"
    else
        print_error "Database schema validation failed"
        echo "$status_output"
        exit 1
    fi
    
    cd - > /dev/null
}

# =============================================================================
# Argument Parsing
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force|-f)
                FORCE=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --env|-e)
                if [[ -n "${2:-}" ]]; then
                    ENVIRONMENT="$2"
                    shift 2
                else
                    print_error "Environment name required after --env"
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
# Main Execution
# =============================================================================

main() {
    parse_arguments "$@"
    
    # Remove processed options from arguments
    while [[ $# -gt 0 ]] && [[ "$1" =~ ^-- ]]; do
        case $1 in
            --force|--verbose|-f|-v)
                shift
                ;;
            --env|-e)
                shift 2
                ;;
            *)
                break
                ;;
        esac
    done
    
    local command=${1:-}
    shift || true
    
    print_verbose "Starting JasaWeb Database Tools..."
    print_verbose "Environment: $ENVIRONMENT, Force: $FORCE, Verbose: $VERBOSE"
    
    # Special case for env command - don't validate before switching
    if [[ "$command" == "env" ]]; then
        switch_environment "$1"
        exit 0
    fi
    
    validate_environment
    
    case "$command" in
        reset)
            reset_database
            ;;
        migrate)
            create_migration "$1"
            ;;
        up)
            run_migrations
            ;;
        down)
            rollback_migrations "${1:-1}"
            ;;
        studio)
            open_studio
            ;;
        generate)
            generate_client
            ;;
        backup)
            create_backup "$1"
            ;;
        restore)
            restore_backup "$1"
            ;;
        seed)
            seed_database
            ;;
        status)
            show_migration_status
            ;;
        validate)
            validate_schema
            ;;
        *)
            echo "JasaWeb Database Management Tools"
            echo "Usage: $0 [OPTIONS] <COMMAND> [ARGS]"
            echo ""
            echo "Commands:"
            echo "  reset              Reset the database (WARNING: This will delete all data)"
            echo "  migrate <name>     Create a new migration"
            echo "  up                 Run pending migrations"
            echo "  down [n]           Rollback last n migrations"
            echo "  studio             Open Prisma Studio"
            echo "  generate           Generate Prisma client"
            echo "  backup [name]      Create database backup"
            echo "  restore <file>     Restore database from backup"
            echo "  seed               Seed database with initial data"
            echo "  status             Show migration status"
            echo "  validate           Validate database schema"
            echo "  env <name>         Switch environment"
            echo ""
            echo "Options:"
            echo "  --force, -f        Skip confirmation prompts"
            echo "  --verbose, -v      Enable verbose output"
            echo "  --env, -e <name>   Specify environment"
            echo "  --help, -h         Show this help message"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"

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