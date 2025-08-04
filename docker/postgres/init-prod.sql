-- Production Database Initialization Script
-- This script sets up the production database with essential admin user

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create production-specific configurations
ALTER DATABASE dt_visuals_prod SET log_statement = 'none';
ALTER DATABASE dt_visuals_prod SET log_duration = off;

-- Wait for Drizzle to create tables, then populate with essential data
-- This function will be called after tables are created
CREATE OR REPLACE FUNCTION populate_prod_essential_data() RETURNS void AS $$
BEGIN
    -- Check if users table exists and is empty
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        
        -- Insert default admin user (password: admin123)
        INSERT INTO users (id, username, email, password, forename, surname, display_name, is_active, created_at) VALUES 
        ('admin-prod-id', 'admin', 'admin@dtvisuals.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', 'Admin', 'User', 'Admin User', true, NOW());

        -- Insert essential roles
        INSERT INTO roles (id, name, description) VALUES 
        ('admin-role-prod', 'Admin', 'Full access to all admin features'),
        ('staff-role-prod', 'Staff', 'Limited access based on assigned permissions'),
        ('client-role-prod', 'Client', 'Login to view only their assigned media');

        -- Insert essential permissions
        INSERT INTO permissions (id, name, description) VALUES 
        ('perm-upload-media', 'upload:media', 'Can upload new media'),
        ('perm-assign-media', 'assign:media', 'Can assign media to clients'),
        ('perm-delete-media', 'delete:media', 'Can delete media'),
        ('perm-view-clients', 'view:clients', 'Can view client profiles'),
        ('perm-edit-users', 'edit:users', 'Can create/edit staff users'),
        ('perm-edit-roles', 'edit:roles', 'Can create/edit roles and permissions'),
        ('perm-view-analytics', 'view:analytics', 'Can view analytics and stats'),
        ('perm-manage-system', 'manage:system', 'Full system management access'),
        ('perm-edit-website', 'edit:website', 'Manage website customization settings'),
        ('perm-edit-clients', 'edit:clients', 'Manage client accounts and information'),
        ('perm-view-users', 'view:users', 'View system users'),
        ('perm-view-media', 'view:media', 'Can view media in admin panel');

        -- Assign admin role to default admin user
        INSERT INTO user_roles (user_id, role_id) VALUES 
        ('admin-prod-id', 'admin-role-prod');

        -- Assign all permissions to admin role
        INSERT INTO role_permissions (role_id, permission_id) VALUES 
        ('admin-role-prod', 'perm-upload-media'),
        ('admin-role-prod', 'perm-assign-media'),
        ('admin-role-prod', 'perm-delete-media'),
        ('admin-role-prod', 'perm-view-clients'),
        ('admin-role-prod', 'perm-edit-users'),
        ('admin-role-prod', 'perm-edit-roles'),
        ('admin-role-prod', 'perm-view-analytics'),
        ('admin-role-prod', 'perm-manage-system'),
        ('admin-role-prod', 'perm-edit-website'),
        ('admin-role-prod', 'perm-edit-clients'),
        ('admin-role-prod', 'perm-view-users'),
        ('admin-role-prod', 'perm-view-media');

        -- Assign basic permissions to staff role
        INSERT INTO role_permissions (role_id, permission_id) VALUES 
        ('staff-role-prod', 'perm-upload-media'),
        ('staff-role-prod', 'perm-assign-media'),
        ('staff-role-prod', 'perm-view-clients'),
        ('staff-role-prod', 'perm-edit-clients'),
        ('staff-role-prod', 'perm-view-media');

        RAISE NOTICE 'Production essential data populated successfully!';
        
    ELSE
        RAISE NOTICE 'Users table already contains data, skipping population.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to display production account info
CREATE OR REPLACE FUNCTION show_prod_accounts() RETURNS void AS $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== PRODUCTION ACCOUNT INFORMATION ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Default Admin Account:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Email: admin@dtvisuals.com';
    RAISE NOTICE '  Password: admin123';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Change the default admin password immediately after first login!';
    RAISE NOTICE 'IMPORTANT: Create additional staff users and disable default admin if not needed!';
    RAISE NOTICE '';
    RAISE NOTICE 'System Features:';
    RAISE NOTICE '  - Dual authentication system (Admin/Staff + Client)';
    RAISE NOTICE '  - Role-based access control (RBAC)';
    RAISE NOTICE '  - Media management with client assignment';
    RAISE NOTICE '  - Website customization system';
    RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql;