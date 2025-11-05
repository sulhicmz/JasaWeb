-- Test database setup script
-- This script creates the test database and user

-- Create test database (run as postgres user)
CREATE DATABASE jasaweb_test;

-- Create test user
CREATE USER test WITH PASSWORD 'test';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE jasaweb_test TO test;

-- Connect to test database and grant schema privileges
\c jasaweb_test;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO test;

-- Grant all privileges on all tables in the schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test;

-- Grant all privileges on all sequences in the schema
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test;