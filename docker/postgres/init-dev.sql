-- Development Database Initialization Script
-- This script sets up the development database with current production data

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create development-specific configurations
ALTER DATABASE dt_visuals_dev SET log_statement = 'all';
ALTER DATABASE dt_visuals_dev SET log_duration = on;

-- Wait for Drizzle to create tables, then populate with current data
-- This function will be called after tables are created
CREATE OR REPLACE FUNCTION populate_dev_test_data() RETURNS text AS $$
DECLARE
    result_text text := '';
    admin_user_id text;
    staff_user_id text;
    admin_role_id text;
    staff_role_id text;
    client_role_id text;
    editor_role_id text;
    marketing_role_id text;
    test_client_id text;
    test2_client_id text;
    users_added integer := 0;
    roles_added integer := 0;
    permissions_added integer := 0;
    clients_added integer := 0;
    client_users_added integer := 0;
BEGIN
    -- Check if users table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        result_text := 'ERROR: Users table does not exist yet. Run migrations first.';
        RAISE NOTICE '%', result_text;
        RETURN result_text;
    END IF;

    result_text := 'Checking and populating development database with test data...';
    RAISE NOTICE '%', result_text;
    
    -- 1. INSERT USERS (check by username/email)
    -- Admin user
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin' OR email = 'admin@dtvisuals.com' LIMIT 1;
    IF admin_user_id IS NULL THEN
        admin_user_id := gen_random_uuid()::text;
        INSERT INTO users (id, username, email, password, forename, surname, display_name, is_active, created_at) 
        VALUES (admin_user_id, 'admin', 'admin@dtvisuals.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', 'Admin', 'User', 'Admin User', true, NOW());
        users_added := users_added + 1;
        RAISE NOTICE 'Created admin user with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;

    -- Staff user
    SELECT id INTO staff_user_id FROM users WHERE username = 'staff' OR email = 'staff@dtvisuals.com' LIMIT 1;
    IF staff_user_id IS NULL THEN
        staff_user_id := gen_random_uuid()::text;
        INSERT INTO users (id, username, email, password, forename, surname, display_name, is_active, created_at) 
        VALUES (staff_user_id, 'staff', 'staff@dtvisuals.com', '2ad353c46393615178d107953275709b50e9e625331870cc4b48281f23845a4ea36e35c84293acb2aaa6e5273499eab81251d05123b0183ff0a73b389874d5bd.ae4d67d25ca864b385d083e2b5235d54', 'Staff', 'Member', 'Staff Member', true, NOW());
        users_added := users_added + 1;
        RAISE NOTICE 'Created staff user with ID: %', staff_user_id;
    ELSE
        RAISE NOTICE 'Staff user already exists with ID: %', staff_user_id;
    END IF;

    -- 2. INSERT ROLES (check by name)
    -- Admin role
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
    IF admin_role_id IS NULL THEN
        admin_role_id := gen_random_uuid()::text;
        INSERT INTO roles (id, name, description) VALUES (admin_role_id, 'Admin', 'Full access to all admin features');
        roles_added := roles_added + 1;
        RAISE NOTICE 'Created Admin role with ID: %', admin_role_id;
    ELSE
        RAISE NOTICE 'Admin role already exists with ID: %', admin_role_id;
    END IF;

    -- Staff role
    SELECT id INTO staff_role_id FROM roles WHERE name = 'Staff' LIMIT 1;
    IF staff_role_id IS NULL THEN
        staff_role_id := gen_random_uuid()::text;
        INSERT INTO roles (id, name, description) VALUES (staff_role_id, 'Staff', 'Limited access based on assigned permissions');
        roles_added := roles_added + 1;
        RAISE NOTICE 'Created Staff role with ID: %', staff_role_id;
    ELSE
        RAISE NOTICE 'Staff role already exists with ID: %', staff_role_id;
    END IF;

    -- Client role
    SELECT id INTO client_role_id FROM roles WHERE name = 'Client' LIMIT 1;
    IF client_role_id IS NULL THEN
        client_role_id := gen_random_uuid()::text;
        INSERT INTO roles (id, name, description) VALUES (client_role_id, 'Client', 'Login to view only their assigned media');
        roles_added := roles_added + 1;
        RAISE NOTICE 'Created Client role with ID: %', client_role_id;
    ELSE
        RAISE NOTICE 'Client role already exists with ID: %', client_role_id;
    END IF;

    -- Editor role
    SELECT id INTO editor_role_id FROM roles WHERE name = 'Editor' LIMIT 1;
    IF editor_role_id IS NULL THEN
        editor_role_id := gen_random_uuid()::text;
        INSERT INTO roles (id, name, description) VALUES (editor_role_id, 'Editor', 'Content editing permissions');
        roles_added := roles_added + 1;
        RAISE NOTICE 'Created Editor role with ID: %', editor_role_id;
    ELSE
        RAISE NOTICE 'Editor role already exists with ID: %', editor_role_id;
    END IF;

    -- Marketing role
    SELECT id INTO marketing_role_id FROM roles WHERE name = 'Marketing' LIMIT 1;
    IF marketing_role_id IS NULL THEN
        marketing_role_id := gen_random_uuid()::text;
        INSERT INTO roles (id, name, description) VALUES (marketing_role_id, 'Marketing', 'Marketing team permissions');
        roles_added := roles_added + 1;
        RAISE NOTICE 'Created Marketing role with ID: %', marketing_role_id;
    ELSE
        RAISE NOTICE 'Marketing role already exists with ID: %', marketing_role_id;
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
    
    GET DIAGNOSTICS permissions_added = ROW_COUNT;
    RAISE NOTICE 'Added % new permissions', permissions_added;

    -- 4. ASSIGN USER ROLES (check if assignment exists)
    -- Admin user -> Admin role
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_user_id AND role_id = admin_role_id) THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (admin_user_id, admin_role_id);
        RAISE NOTICE 'Assigned Admin role to admin user';
    END IF;

    -- Staff user -> Staff role
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = staff_user_id AND role_id = staff_role_id) THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (staff_user_id, staff_role_id);
        RAISE NOTICE 'Assigned Staff role to staff user';
    END IF;

    -- 5. ASSIGN ROLE PERMISSIONS (check if assignment exists)
    -- Admin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, p.id FROM permissions p
    WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions rp 
        WHERE rp.role_id = admin_role_id AND rp.permission_id = p.id
    );

    -- Staff gets selected permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT staff_role_id, p.id FROM permissions p
    WHERE p.name IN ('upload:media', 'assign:media', 'view:clients', 'edit:clients', 'view:media')
    AND NOT EXISTS (
        SELECT 1 FROM role_permissions rp 
        WHERE rp.role_id = staff_role_id AND rp.permission_id = p.id
    );

    RAISE NOTICE 'Assigned permissions to roles';

    -- 6. INSERT CLIENTS (check by email)
    -- Test Client
    SELECT id INTO test_client_id FROM clients WHERE email = 'client@example.com' LIMIT 1;
    IF test_client_id IS NULL THEN
        test_client_id := gen_random_uuid()::text;
        INSERT INTO clients (id, name, email, company, phone, notes, is_active, created_by, created_at, updated_at) 
        VALUES (test_client_id, 'Test Client', 'client@example.com', 'Test Client Company', '+1-555-0123', 'Legacy client migrated from old system', true, admin_user_id, NOW(), NOW());
        clients_added := clients_added + 1;
        RAISE NOTICE 'Created Test Client with ID: %', test_client_id;
    ELSE
        RAISE NOTICE 'Test Client already exists with ID: %', test_client_id;
    END IF;

    -- Test2 Client
    SELECT id INTO test2_client_id FROM clients WHERE email = 'test2@client.com' LIMIT 1;
    IF test2_client_id IS NULL THEN
        test2_client_id := gen_random_uuid()::text;
        INSERT INTO clients (id, name, email, company, phone, notes, is_active, created_by, created_at, updated_at) 
        VALUES (test2_client_id, 'test2', 'test2@client.com', '', '', '', true, admin_user_id, NOW(), NOW());
        clients_added := clients_added + 1;
        RAISE NOTICE 'Created test2 client with ID: %', test2_client_id;
    ELSE
        RAISE NOTICE 'test2 client already exists with ID: %', test2_client_id;
    END IF;

    -- 7. INSERT CLIENT USERS (check by email/username)
    -- Test client user
    IF NOT EXISTS (SELECT 1 FROM client_users WHERE email = 'testclient@example.com' OR username = 'testclient') THEN
        INSERT INTO client_users (id, client_id, username, email, password, is_active, created_at, last_login_at) 
        VALUES (gen_random_uuid()::text, test_client_id, 'testclient', 'testclient@example.com', '$2b$10$8K1p/a0dHTBS.L90wLAemOuMEDEh.Et6k0L4HkmnJ4/v4DQwE3OFO', true, NOW(), NULL);
        client_users_added := client_users_added + 1;
        RAISE NOTICE 'Created testclient user';
    ELSE
        RAISE NOTICE 'testclient user already exists';
    END IF;

    -- Test2 client user
    IF NOT EXISTS (SELECT 1 FROM client_users WHERE email = 'test2@client.com' OR username = 'test2') THEN
        INSERT INTO client_users (id, client_id, username, email, password, is_active, created_at, last_login_at) 
        VALUES (gen_random_uuid()::text, test2_client_id, 'test2', 'test2@client.com', '892f317ed33045523735f967abaf2e2b:03f989540668641d9515b240ade6a25cec613d30307beb471051ce924f2442e69a717c526efaf4facf9b6f230689996ac01e074bf73ac070af8bf6e05abb1eab', true, NOW(), NOW());
        client_users_added := client_users_added + 1;
        RAISE NOTICE 'Created test2 client user';
    ELSE
        RAISE NOTICE 'test2 client user already exists';
    END IF;

    -- Generate summary
    result_text := 'SUCCESS: Development test data check completed! ';
    result_text := result_text || 'Added: ' || users_added || ' users, ';
    result_text := result_text || roles_added || ' roles, ';
    result_text := result_text || permissions_added || ' permissions, ';
    result_text := result_text || clients_added || ' clients, ';
    result_text := result_text || client_users_added || ' client users.';
    
    RAISE NOTICE '%', result_text;
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Create a function to display development accounts
CREATE OR REPLACE FUNCTION show_dev_accounts() RETURNS text AS $$
DECLARE
    account_info text := '';
    user_count integer;
    client_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO client_count FROM clients;

    account_info := E'\n=== DEVELOPMENT ACCOUNT INFORMATION ===\n';
    account_info := account_info || E'Database Status: ' || user_count || ' users, ' || client_count || E' clients\n\n';
    account_info := account_info || E'Admin/Staff Portal (Main System):\n';
    account_info := account_info || E'  Admin: admin@dtvisuals.com / admin123\n';
    account_info := account_info || E'  Staff: staff@dtvisuals.com / staff123\n\n';
    account_info := account_info || E'Client Portal (Separate System):\n';
    account_info := account_info || E'  Test Client: testclient@example.com / client123\n';
    account_info := account_info || E'  Test2: test2@client.com / client123\n\n';
    account_info := account_info || E'Access URLs:\n';
    account_info := account_info || E'  Main App: http://localhost:3000\n';
    account_info := account_info || E'  Client Login: http://localhost:3000/client/login\n';
    
    RAISE NOTICE '%', account_info;
    RETURN account_info;
END;
$$ LANGUAGE plpgsql;

-- Critical verification function that ensures admin user exists
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

-- Enhanced verification function
CREATE OR REPLACE FUNCTION verify_dev_data() RETURNS text AS $$
DECLARE
    verification_result text := '';
    user_count integer;
    role_count integer;
    permission_count integer;
    client_count integer;
    client_user_count integer;
    user_role_count integer;
    role_permission_count integer;
    admin_count integer;
    media_count integer;
    website_settings_count integer;
BEGIN
    -- Count all tables
    SELECT COUNT(*) INTO user_count FROM users WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');
    SELECT COUNT(*) INTO role_count FROM roles WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles');
    SELECT COUNT(*) INTO permission_count FROM permissions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions');
    SELECT COUNT(*) INTO client_count FROM clients WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients');
    SELECT COUNT(*) INTO client_user_count FROM client_users WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_users');
    SELECT COUNT(*) INTO user_role_count FROM user_roles WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles');
    SELECT COUNT(*) INTO role_permission_count FROM role_permissions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions');
    
    -- Count media if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media') THEN
        SELECT COUNT(*) INTO media_count FROM media;
    ELSE
        media_count := 0;
    END IF;
    
    -- Count website settings if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_settings') THEN
        SELECT COUNT(*) INTO website_settings_count FROM website_settings;
    ELSE
        website_settings_count := 0;
    END IF;
    
    -- Count admin users
    admin_count := 0;
    IF user_count > 0 AND role_count > 0 AND user_role_count > 0 THEN
        SELECT COUNT(*) INTO admin_count FROM users u 
        JOIN user_roles ur ON u.id = ur.user_id 
        JOIN roles r ON ur.role_id = r.id 
        WHERE r.name = 'Admin';
    END IF;
    
    verification_result := 'Database verification:';
    verification_result := verification_result || E'\n  Users: ' || user_count;
    verification_result := verification_result || E'\n  Admin Users: ' || admin_count;
    verification_result := verification_result || E'\n  Roles: ' || role_count;
    verification_result := verification_result || E'\n  Permissions: ' || permission_count;
    verification_result := verification_result || E'\n  User-Role Assignments: ' || user_role_count;
    verification_result := verification_result || E'\n  Role-Permission Assignments: ' || role_permission_count;
    verification_result := verification_result || E'\n  Clients: ' || client_count;
    verification_result := verification_result || E'\n  Client Users: ' || client_user_count;
    verification_result := verification_result || E'\n  Media: ' || media_count;
    verification_result := verification_result || E'\n  Website Settings: ' || website_settings_count;
    
    IF admin_count = 0 THEN
        verification_result := verification_result || E'\n  STATUS: ❌ CRITICAL - NO ADMIN USER FOUND!';
    ELSE
        verification_result := verification_result || E'\n  STATUS: ✅ READY - Admin user exists';
    END IF;
    
    RAISE NOTICE '%', verification_result;
    RETURN verification_result;
END;
$$ LANGUAGE plpgsql;