-- Production Database Initialization Script
-- This script sets up the production database for DT Visuals

-- Create the production database if it doesn't exist
SELECT 'CREATE DATABASE dt_visuals_prod'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dt_visuals_prod')\gexec

-- Connect to the production database
\c dt_visuals_prod;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Set timezone
SET timezone = 'UTC';

-- Create a dedicated application user (optional)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'dt_visuals_app') THEN

      CREATE ROLE dt_visuals_app LOGIN PASSWORD 'app_user_password_change_this';
   END IF;
END
$do$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE dt_visuals_prod TO dt_visuals_app;
GRANT USAGE ON SCHEMA public TO dt_visuals_app;
GRANT CREATE ON SCHEMA public TO dt_visuals_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dt_visuals_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dt_visuals_app;

-- Production-specific settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Note: Tables will be created by Drizzle migrations when the application starts