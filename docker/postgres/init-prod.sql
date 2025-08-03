-- Production Database Initialization Script
-- This script sets up the production database with necessary extensions and default admin user

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create production-specific configurations for performance
ALTER DATABASE dt_visuals_prod SET shared_preload_libraries = 'pg_stat_statements';
ALTER DATABASE dt_visuals_prod SET log_statement = 'mod';
ALTER DATABASE dt_visuals_prod SET log_duration = off;

-- Optimize for production workload
ALTER DATABASE dt_visuals_prod SET effective_cache_size = '256MB';
ALTER DATABASE dt_visuals_prod SET random_page_cost = '1.1';

-- Create function to set up default admin user
CREATE OR REPLACE FUNCTION create_default_admin() RETURNS void AS $$
BEGIN
    -- Check if users table exists and is empty
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        
        -- Insert default admin user (password: admin123 - should be changed immediately)
        INSERT INTO users (id, username, email, password) VALUES 
        ('default-admin-id', 'admin', 'admin@dtvisuals.com', 'da06ef17a5bce192c00d02e92aa40eb563e38084755fa219643499ef5027c4f8:7301531c4aee740d57796afabb6a00e1ee4f56a6c46376e569534ece5e61dc53a0a682b311f365e5d67acbd5d95df318e802571f8b559ca03b0338efa484a667');

        -- Insert admin role
        INSERT INTO roles (id, name, description) VALUES 
        ('prod-admin-role', 'Admin', 'Full system administrator access');

        -- Insert all permissions
        INSERT INTO permissions (id, name, description) VALUES 
        ('prod-perm-upload-media', 'upload:media', 'Upload new media files'),
        ('prod-perm-edit-media', 'edit:media', 'Edit media metadata and properties'),
        ('prod-perm-delete-media', 'delete:media', 'Delete media files'),
        ('prod-perm-assign-client', 'assign:client', 'Assign media to clients'),
        ('prod-perm-view-media', 'view:media', 'View media content'),
        ('prod-perm-view-clients', 'view:clients', 'View client information'),
        ('prod-perm-edit-clients', 'edit:clients', 'Edit client information'),
        ('prod-perm-edit-users', 'edit:users', 'Manage user accounts'),
        ('prod-perm-edit-roles', 'edit:roles', 'Manage roles and permissions'),
        ('prod-perm-edit-website', 'edit:website', 'Manage website settings and content'),
        ('prod-perm-view-analytics', 'view:analytics', 'View system analytics');

        -- Assign admin role to default user
        INSERT INTO user_roles (user_id, role_id) VALUES 
        ('default-admin-id', 'prod-admin-role');

        -- Assign all permissions to admin role
        INSERT INTO role_permissions (role_id, permission_id) VALUES 
        ('prod-admin-role', 'prod-perm-upload-media'),
        ('prod-admin-role', 'prod-perm-edit-media'),
        ('prod-admin-role', 'prod-perm-delete-media'),
        ('prod-admin-role', 'prod-perm-assign-client'),
        ('prod-admin-role', 'prod-perm-view-media'),
        ('prod-admin-role', 'prod-perm-view-clients'),
        ('prod-admin-role', 'prod-perm-edit-clients'),
        ('prod-admin-role', 'prod-perm-edit-users'),
        ('prod-admin-role', 'prod-perm-edit-roles'),
        ('prod-admin-role', 'prod-perm-edit-website'),
        ('prod-admin-role', 'prod-perm-view-analytics');

        RAISE NOTICE 'Default admin user created successfully';
        RAISE NOTICE 'Login: admin@dtvisuals.com / admin123';
        RAISE NOTICE 'IMPORTANT: Change the default password immediately after first login!';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Production database is ready for Drizzle migrations
SELECT 'Production database initialized successfully' as status;