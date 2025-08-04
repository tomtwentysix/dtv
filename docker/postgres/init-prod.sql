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

-- Critical verification function for production
CREATE OR REPLACE FUNCTION ensure_admin_user_exists() RETURNS text AS $$
DECLARE
    admin_count integer;
    admin_role_count integer;
    result_text text := '';
BEGIN
    -- Check if admin user exists
    SELECT COUNT(*) INTO admin_count FROM users WHERE username = 'admin' OR email = 'admin@dtvisuals.com';
    
    -- Check if admin role exists
    SELECT COUNT(*) INTO admin_role_count FROM roles WHERE name = 'Admin';
    
    IF admin_count = 0 THEN
        result_text := 'CRITICAL: No admin user found. Creating emergency admin user...';
        RAISE NOTICE '%', result_text;
        
        -- Ensure admin role exists
        IF admin_role_count = 0 THEN
            INSERT INTO roles (id, name, description) VALUES 
            ('emergency-admin-role', 'Admin', 'Emergency admin role with full access');
            
            -- Add essential permissions if they don't exist
            INSERT INTO permissions (id, name, description) VALUES 
            ('emergency-perm-1', 'manage:system', 'Full system management access'),
            ('emergency-perm-2', 'edit:users', 'Can create/edit staff users'),
            ('emergency-perm-3', 'edit:roles', 'Can create/edit roles and permissions')
            ON CONFLICT (name) DO NOTHING;
            
            -- Assign permissions to emergency admin role
            INSERT INTO role_permissions (role_id, permission_id) VALUES 
            ('emergency-admin-role', 'emergency-perm-1'),
            ('emergency-admin-role', 'emergency-perm-2'),
            ('emergency-admin-role', 'emergency-perm-3');
        END IF;
        
        -- Create emergency admin user (password: admin123)
        INSERT INTO users (id, username, email, password, forename, surname, display_name, is_active, created_at) VALUES 
        ('emergency-admin-id', 'admin', 'admin@dtvisuals.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', 'Admin', 'User', 'Admin User', true, NOW());
        
        -- Assign admin role
        INSERT INTO user_roles (user_id, role_id) VALUES 
        ('emergency-admin-id', COALESCE((SELECT id FROM roles WHERE name = 'Admin' LIMIT 1), 'emergency-admin-role'));
        
        result_text := 'SUCCESS: Emergency admin user created. Login: admin@dtvisuals.com / admin123';
        
    ELSE
        result_text := 'VERIFIED: Admin user exists (' || admin_count || ' admin users found)';
    END IF;
    
    RAISE NOTICE '%', result_text;
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Create a function to display production account info
CREATE OR REPLACE FUNCTION show_prod_accounts() RETURNS text AS $$
DECLARE
    account_info text := '';
    admin_count integer;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM users u 
    JOIN user_roles ur ON u.id = ur.user_id 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name = 'Admin';

    account_info := E'\n=== PRODUCTION ACCOUNT INFORMATION ===\n';
    account_info := account_info || E'Admin Users Found: ' || admin_count || E'\n\n';
    account_info := account_info || E'Default Admin Account:\n';
    account_info := account_info || E'  Username: admin\n';
    account_info := account_info || E'  Email: admin@dtvisuals.com\n';
    account_info := account_info || E'  Password: admin123\n\n';
    account_info := account_info || E'IMPORTANT: Change the default admin password immediately after first login!\n';
    account_info := account_info || E'IMPORTANT: Create additional staff users and disable default admin if not needed!\n\n';
    account_info := account_info || E'System Features:\n';
    account_info := account_info || E'  - Dual authentication system (Admin/Staff + Client)\n';
    account_info := account_info || E'  - Role-based access control (RBAC)\n';
    account_info := account_info || E'  - Media management with client assignment\n';
    account_info := account_info || E'  - Website customization system\n';
    
    RAISE NOTICE '%', account_info;
    RETURN account_info;
END;
$$ LANGUAGE plpgsql;