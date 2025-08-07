-- Development Database Initialization Script
-- This script sets up the development database for DT Visuals

-- Create the development database if it doesn't exist
SELECT 'CREATE DATABASE dt_visuals_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dt_visuals_dev')\gexec

-- Connect to the development database
\c dt_visuals_dev;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Set timezone
SET timezone = 'UTC';

-- Development-specific settings (more verbose logging)
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 0;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- Note: Tables will be created by Drizzle migrations when the application starts