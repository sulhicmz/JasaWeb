#!/bin/bash

# Test Database Setup Script
# This script sets up the test database for running tests

set -e

echo "Setting up test database for JasaWeb API..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "Error: PostgreSQL is not running"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql command not found"
    exit 1
fi

# Drop test database if it exists (clean slate)
echo "Dropping existing test database (if exists)..."
psql -U postgres -c "DROP DATABASE IF EXISTS jasaweb_test;" || true

# Drop test user if it exists
echo "Dropping existing test user (if exists)..."
psql -U postgres -c "DROP USER IF EXISTS test;" || true

# Create test database
echo "Creating test database..."
psql -U postgres -c "CREATE DATABASE jasaweb_test;"

# Create test user
echo "Creating test user..."
psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';"

# Grant privileges
echo "Granting privileges..."
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE jasaweb_test TO test;"

# Connect to test database and set up schema
echo "Setting up schema privileges..."
psql -U postgres -d jasaweb_test -c "
    GRANT USAGE ON SCHEMA public TO test;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test;
"

echo "Test database setup completed successfully!"
echo "Database: jasaweb_test"
echo "User: test"
echo "Password: test"