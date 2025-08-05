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
DECLARE
    admin_user_id text;
    admin_role_id text;
    staff_role_id text;
    result_text text := 'Production essential data population:';
BEGIN
    -- Check if users table exists and is empty
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN

        -- 1. INSERT DEFAULT ADMIN USER (check by username/email)
        SELECT id INTO admin_user_id FROM users WHERE username = 'admin' OR email = 'admin@dtvisuals.com' LIMIT 1;
        IF admin_user_id IS NULL THEN
            admin_user_id := gen_random_uuid()::text;
            INSERT INTO users (id, username, email, password, forename, surname, display_name, is_active, created_at) VALUES 
            (admin_user_id, 'admin', 'admin@dtvisuals.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', 'Admin', 'User', 'Admin User', true, NOW());
            RAISE NOTICE 'Created default admin user with ID: %', admin_user_id;
            result_text := result_text || ' Created admin user.';
        ELSE
            RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
            result_text := result_text || ' Admin user exists.';
        END IF;

        -- 2. INSERT ROLES (check by name)
        -- Admin role
        SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
        IF admin_role_id IS NULL THEN
            admin_role_id := gen_random_uuid()::text;
            INSERT INTO roles (id, name, description) VALUES (admin_role_id, 'Admin', 'Full access to all admin features');
            RAISE NOTICE 'Created Admin role with ID: %', admin_role_id;
            result_text := result_text || ' Created Admin role.';
        ELSE
            RAISE NOTICE 'Admin role already exists with ID: %', admin_role_id;
            result_text := result_text || ' Admin role exists.';
        END IF;

        -- Staff role
        SELECT id INTO staff_role_id FROM roles WHERE name = 'Staff' LIMIT 1;
        IF staff_role_id IS NULL THEN
            staff_role_id := gen_random_uuid()::text;
            INSERT INTO roles (id, name, description) VALUES (staff_role_id, 'Staff', 'Limited access based on assigned permissions');
            RAISE NOTICE 'Created Staff role with ID: %', staff_role_id;
            result_text := result_text || ' Created Staff role.';
        ELSE
            RAISE NOTICE 'Staff role already exists with ID: %', staff_role_id;
            result_text := result_text || ' Staff role exists.';
        END IF;

        -- Client role
        IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Client') THEN
            INSERT INTO roles (id, name, description) VALUES (gen_random_uuid()::text, 'Client', 'Login to view only their assigned media');
            RAISE NOTICE 'Created Client role';
            result_text := result_text || ' Created Client role.';
        END IF;

        -- 3. INSERT PERMISSIONS (check by name, use ON CONFLICT for safety)
        INSERT INTO permissions (id, name, description) VALUES 
        (gen_random_uuid()::text, 'upload:media', 'Can upload new media'),
        (gen_random_uuid()::text, 'assign:media', 'Can assign media to clients'),
        (gen_random_uuid()::text, 'delete:media', 'Can delete media'),
        (gen_random_uuid()::text, 'view:clients', 'Can view client profiles'),
        (gen_random_uuid()::text, 'edit:users', 'Can create/edit staff users'),
        (gen_random_uuid()::text, 'edit:roles', 'Can create/edit roles and permissions'),
        (gen_random_uuid()::text, 'view:analytics', 'Can view analytics and stats'),
        (gen_random_uuid()::text, 'manage:system', 'Full system management access'),
        (gen_random_uuid()::text, 'edit:website', 'Manage website customization settings'),
        (gen_random_uuid()::text, 'edit:clients', 'Manage client accounts and information'),
        (gen_random_uuid()::text, 'view:users', 'View system users'),
        (gen_random_uuid()::text, 'view:media', 'Can view media in admin panel')
        ON CONFLICT (name) DO NOTHING;

        RAISE NOTICE 'Ensured all permissions exist';

        -- 4. ASSIGN USER ROLE (check if assignment exists)
        IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_user_id AND role_id = admin_role_id) THEN
            INSERT INTO user_roles (user_id, role_id) VALUES (admin_user_id, admin_role_id);
            RAISE NOTICE 'Assigned Admin role to admin user';
            result_text := result_text || ' Assigned admin role.';
        ELSE
            RAISE NOTICE 'Admin user already has Admin role';
            result_text := result_text || ' Admin role already assigned.';
        END IF;

        -- 5. ASSIGN PERMISSIONS TO ROLES (check if assignment exists)
        -- Admin role permissions
        INSERT INTO role_permissions (role_id, permission_id) 
        SELECT admin_role_id, p.id FROM permissions p WHERE p.name IN (
            'upload:media', 'assign:media', 'delete:media', 'view:clients', 'edit:users', 
            'edit:roles', 'view:analytics', 'manage:system', 'edit:website', 'edit:clients', 
            'view:users', 'view:media'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        RAISE NOTICE 'Assigned all permissions to Admin role';
        result_text := result_text || ' Assigned admin permissions.';

        -- Staff role permissions
        INSERT INTO role_permissions (role_id, permission_id) 
        SELECT staff_role_id, p.id FROM permissions p WHERE p.name IN (
            'upload:media', 'assign:media', 'view:clients', 'edit:clients', 'view:media'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        RAISE NOTICE 'Assigned basic permissions to Staff role';
        result_text := result_text || ' Assigned staff permissions.';

        RAISE NOTICE '%', result_text;

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
    admin_user_id text;
    admin_role_id text;
BEGIN
    -- Check if admin user exists and get its ID
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin' OR email = 'admin@dtvisuals.com' LIMIT 1;

    -- Check if admin role exists and get its ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;

    IF admin_user_id IS NULL THEN
        result_text := 'CRITICAL: No admin user found. Creating emergency admin user...';
        RAISE NOTICE '%', result_text;

        -- Ensure admin role exists
        IF admin_role_id IS NULL THEN
            admin_role_id := gen_random_uuid()::text;
            INSERT INTO roles (id, name, description) VALUES 
            (admin_role_id, 'Admin', 'Emergency admin role with full access');
            RAISE NOTICE 'Created emergency Admin role with ID: %', admin_role_id;
            result_text := result_text || ' Created emergency Admin role.';

            -- Add essential permissions if they don't exist, using ON CONFLICT for safety
            INSERT INTO permissions (id, name, description) VALUES 
            ('emergency-perm-1', 'manage:system', 'Full system management access'),
            ('emergency-perm-2', 'edit:users', 'Can create/edit staff users'),
            ('emergency-perm-3', 'edit:roles', 'Can create/edit roles and permissions')
            ON CONFLICT (name) DO NOTHING;

            -- Assign permissions to emergency admin role
            INSERT INTO role_permissions (role_id, permission_id) 
            SELECT admin_role_id, p.id FROM permissions p WHERE p.name IN ('manage:system', 'edit:users', 'edit:roles')
            ON CONFLICT (role_id, permission_id) DO NOTHING;
            RAISE NOTICE 'Assigned essential permissions to emergency Admin role';
            result_text := result_text || ' Assigned emergency permissions.';
        ELSE
            RAISE NOTICE 'Admin role already exists with ID: %', admin_role_id;
            result_text := result_text || ' Admin role exists.';
        END IF;

        -- Create emergency admin user (password: admin123)
        INSERT INTO users (id, username, email, password, forename, surname, display_name, is_active, created_at) VALUES 
        ('emergency-admin-id', 'admin', 'admin@dtvisuals.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', 'Admin', 'User', 'Admin User', true, NOW());

        -- Assign admin role
        INSERT INTO user_roles (user_id, role_id) VALUES 
        ('emergency-admin-id', COALESCE(admin_role_id, 'emergency-admin-role'));

        result_text := 'SUCCESS: Emergency admin user created. Login: admin@dtvisuals.com / admin123';

    ELSE
        result_text := 'VERIFIED: Admin user exists.';
        -- Check if the existing admin user has the Admin role
        IF admin_role_id IS NULL THEN
            result_text := result_text || ' Admin role not found. Creating and assigning...';
            admin_role_id := gen_random_uuid()::text;
            INSERT INTO roles (id, name, description) VALUES 
            (admin_role_id, 'Admin', 'Admin role with full access');

            INSERT INTO permissions (id, name, description) VALUES 
            ('emergency-perm-1', 'manage:system', 'Full system management access'),
            ('emergency-perm-2', 'edit:users', 'Can create/edit staff users'),
            ('emergency-perm-3', 'edit:roles', 'Can create/edit roles and permissions')
            ON CONFLICT (name) DO NOTHING;

            INSERT INTO role_permissions (role_id, permission_id) 
            SELECT admin_role_id, p.id FROM permissions p WHERE p.name IN ('manage:system', 'edit:users', 'edit:roles')
            ON CONFLICT (role_id, permission_id) DO NOTHING;

            INSERT INTO user_roles (user_id, role_id) VALUES 
            (admin_user_id, admin_role_id)
            ON CONFLICT (user_id, role_id) DO NOTHING;
        ELSIF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_user_id AND role_id = admin_role_id) THEN
            result_text := result_text || ' Admin role found but not assigned to admin user. Assigning...';
            INSERT INTO user_roles (user_id, role_id) VALUES 
            (admin_user_id, admin_role_id)
            ON CONFLICT (user_id, role_id) DO NOTHING;
        ELSE
            result_text := result_text || ' Admin role is correctly assigned.';
        END IF;
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