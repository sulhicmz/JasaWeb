@echo off
REM Test Database Setup Script for Windows
REM This script sets up the test database for running tests

echo Setting up test database for JasaWeb API...

REM Check if PostgreSQL is running
pg_isready -q >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: PostgreSQL is not running
    exit /b 1
)

REM Check if psql is available
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: psql command not found
    exit /b 1
)

REM Drop test database if it exists (clean slate)
echo Dropping existing test database (if exists)...
psql -U postgres -c "DROP DATABASE IF EXISTS jasaweb_test;" 2>nul

REM Drop test user if it exists
echo Dropping existing test user (if exists)...
psql -U postgres -c "DROP USER IF EXISTS test;" 2>nul

REM Create test database
echo Creating test database...
psql -U postgres -c "CREATE DATABASE jasaweb_test;"

REM Create test user
echo Creating test user...
psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';"

REM Grant privileges
echo Granting privileges...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE jasaweb_test TO test;"

REM Connect to test database and set up schema
echo Setting up schema privileges...
psql -U postgres -d jasaweb_test -c "GRANT USAGE ON SCHEMA public TO test; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test;"

echo Test database setup completed successfully!
echo Database: jasaweb_test
echo User: test
echo Password: test