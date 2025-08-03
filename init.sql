-- Database initialization script for Docker containers
-- This ensures the database is properly set up with timeline functionality

-- Create database if it doesn't exist (handled by Docker)
-- CREATE DATABASE IF NOT EXISTS dt_visuals;

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE dt_visuals TO postgres;

-- The tables will be created by Drizzle migrations
-- This script just ensures the database is ready for the application