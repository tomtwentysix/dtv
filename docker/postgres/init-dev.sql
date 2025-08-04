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
    user_count integer;
    result_text text := '';
BEGIN
    -- Check if users table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        result_text := 'ERROR: Users table does not exist yet. Run migrations first.';
        RAISE NOTICE '%', result_text;
        RETURN result_text;
    END IF;

    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count = 0 THEN
        result_text := 'Populating development database with test data...';
        RAISE NOTICE '%', result_text;
        
        -- Insert current users from production
        INSERT INTO users (id, username, email, password, forename, surname, display_name, is_active, created_at) VALUES 
        ('862153b3-4fce-48d8-81fd-63fc0fbd9576', 'admin', 'admin@dtvisuals.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', 'Admin', 'User', 'Admin User', true, '2025-07-29 20:42:07.651783'),
        ('be03cf3a-41b2-4e72-ac51-4b0a7e96769e', 'staff', 'staff@dtvisuals.com', '2ad353c46393615178d107953275709b50e9e625331870cc4b48281f23845a4ea36e35c84293acb2aaa6e5273499eab81251d05123b0183ff0a73b389874d5bd.ae4d67d25ca864b385d083e2b5235d54', 'Staff', 'Member', 'Staff Member', true, '2025-07-29 20:42:07.651783');

        -- Insert current roles
        INSERT INTO roles (id, name, description) VALUES 
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'Admin', 'Full access to all admin features'),
        ('8d6e6a79-118e-4345-ad1e-7a7f781232e4', 'Staff', 'Limited access based on assigned permissions'),
        ('04c4b160-c253-4fcd-b95f-3271d0ee36cf', 'Client', 'Login to view only their assigned media'),
        ('f58d2dbe-e10b-4367-9710-9ab5d587ed28', 'Editor', ''),
        ('d3dd99ec-1e30-4246-9003-68c516c6f992', 'Marketing', '');

        -- Insert current permissions
        INSERT INTO permissions (id, name, description) VALUES 
        ('f6fa4a7a-a83e-4934-92c0-1aa54fc20245', 'upload:media', 'Can upload new media'),
        ('f090ba10-53f4-4050-9277-470a90ef1c0f', 'assign:media', 'Can assign media to clients'),
        ('fc032460-bf12-48f2-8041-a0e6483eb8b7', 'delete:media', 'Can delete media'),
        ('e3bb88df-1e83-4a49-82fb-2aab359fe342', 'view:clients', 'Can view client profiles'),
        ('559b91b7-9ab9-4071-87e0-e66d7ae71e66', 'edit:users', 'Can create/edit staff users'),
        ('efe7d17d-9fd8-49de-921d-4c364947f368', 'edit:roles', 'Can create/edit roles and permissions'),
        ('de73b67c-1d4c-4a1f-8503-c96b4634f130', 'view:analytics', 'Can view analytics and stats'),
        ('e95d6008-4017-48de-87a9-02ce1d00f096', 'manage:system', 'Full system management access'),
        ('6c6a7876-c9f4-4ee0-9e48-ac94919cd5b3', 'edit:website', 'Manage website customization settings'),
        ('db874998-c4ec-431f-b7e8-f98e8847f4cd', 'edit:clients', 'Manage client accounts and information'),
        ('fc38b443-91e1-4979-859e-ecef1939c86a', 'view:users', 'View system users'),
        ('f14d0ef1-2b71-47f2-a3e5-93a9a6c428ff', 'view:media', 'Can view media in admin panel');

        -- Assign roles to users
        INSERT INTO user_roles (user_id, role_id) VALUES 
        ('862153b3-4fce-48d8-81fd-63fc0fbd9576', '34a1add2-7cb4-43f8-be14-2a5fa5647b25'),
        ('be03cf3a-41b2-4e72-ac51-4b0a7e96769e', '8d6e6a79-118e-4345-ad1e-7a7f781232e4');

        -- Assign permissions to roles
        INSERT INTO role_permissions (role_id, permission_id) VALUES 
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'f6fa4a7a-a83e-4934-92c0-1aa54fc20245'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'f090ba10-53f4-4050-9277-470a90ef1c0f'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'fc032460-bf12-48f2-8041-a0e6483eb8b7'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'e3bb88df-1e83-4a49-82fb-2aab359fe342'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', '559b91b7-9ab9-4071-87e0-e66d7ae71e66'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'efe7d17d-9fd8-49de-921d-4c364947f368'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'de73b67c-1d4c-4a1f-8503-c96b4634f130'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'e95d6008-4017-48de-87a9-02ce1d00f096'),
        ('8d6e6a79-118e-4345-ad1e-7a7f781232e4', 'f6fa4a7a-a83e-4934-92c0-1aa54fc20245'),
        ('8d6e6a79-118e-4345-ad1e-7a7f781232e4', 'f090ba10-53f4-4050-9277-470a90ef1c0f'),
        ('8d6e6a79-118e-4345-ad1e-7a7f781232e4', 'e3bb88df-1e83-4a49-82fb-2aab359fe342'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', '6c6a7876-c9f4-4ee0-9e48-ac94919cd5b3'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'fc38b443-91e1-4979-859e-ecef1939c86a'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'db874998-c4ec-431f-b7e8-f98e8847f4cd'),
        ('8d6e6a79-118e-4345-ad1e-7a7f781232e4', 'db874998-c4ec-431f-b7e8-f98e8847f4cd'),
        ('34a1add2-7cb4-43f8-be14-2a5fa5647b25', 'f14d0ef1-2b71-47f2-a3e5-93a9a6c428ff');

        -- Insert current clients
        INSERT INTO clients (id, name, email, company, phone, notes, is_active, created_by, created_at, updated_at) VALUES 
        ('d319ea4b-c311-4370-ac23-59771c8fac0b', 'Test Client', 'client@example.com', 'Test Client Company', '+1-555-0123', 'Legacy client migrated from old system', true, '862153b3-4fce-48d8-81fd-63fc0fbd9576', '2025-08-04 20:44:51.466937', '2025-08-04 20:56:51.431'),
        ('e4f8371a-1a0d-4475-b24a-535851e203ec', 'test2', 'test2@client.com', '', '', '', true, '862153b3-4fce-48d8-81fd-63fc0fbd9576', '2025-08-04 21:05:22.209424', '2025-08-04 21:05:22.209424');

        -- Insert current client users (for client authentication)
        INSERT INTO client_users (id, client_id, username, email, password, is_active, created_at, last_login_at) VALUES 
        ('68ad17ac-c17e-4324-9b21-bfe3c8cff229', 'd319ea4b-c311-4370-ac23-59771c8fac0b', 'testclient', 'testclient@example.com', '$2b$10$8K1p/a0dHTBS.L90wLAemOuMEDEh.Et6k0L4HkmnJ4/v4DQwE3OFO', true, '2025-08-04 19:40:31.087902', NULL),
        ('ee1f5e5b-b790-4055-9c9e-51ce8e2edf9e', 'e4f8371a-1a0d-4475-b24a-535851e203ec', 'test2', 'test2@client.com', '892f317ed33045523735f967abaf2e2b:03f989540668641d9515b240ade6a25cec613d30307beb471051ce924f2442e69a717c526efaf4facf9b6f230689996ac01e074bf73ac070af8bf6e05abb1eab', true, '2025-08-04 21:05:22.287751', '2025-08-04 22:23:12.115');

        result_text := 'SUCCESS: Development test data populated successfully! Added 2 users, 5 roles, 12 permissions, 2 clients, and 2 client users.';
        RAISE NOTICE '%', result_text;
        
    ELSE
        result_text := 'INFO: Users table already contains ' || user_count || ' users, skipping population.';
        RAISE NOTICE '%', result_text;
    END IF;
    
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
    admin_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO role_count FROM roles;
    SELECT COUNT(*) INTO permission_count FROM permissions;
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO client_user_count FROM client_users;
    SELECT COUNT(*) INTO admin_count FROM users u 
    JOIN user_roles ur ON u.id = ur.user_id 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name = 'Admin';
    
    verification_result := 'Database verification:';
    verification_result := verification_result || E'\n  Users: ' || user_count;
    verification_result := verification_result || E'\n  Admin Users: ' || admin_count;
    verification_result := verification_result || E'\n  Roles: ' || role_count;
    verification_result := verification_result || E'\n  Permissions: ' || permission_count;
    verification_result := verification_result || E'\n  Clients: ' || client_count;
    verification_result := verification_result || E'\n  Client Users: ' || client_user_count;
    
    IF admin_count = 0 THEN
        verification_result := verification_result || E'\n  STATUS: ❌ CRITICAL - NO ADMIN USER FOUND!';
    ELSE
        verification_result := verification_result || E'\n  STATUS: ✅ READY - Admin user exists';
    END IF;
    
    RAISE NOTICE '%', verification_result;
    RETURN verification_result;
END;
$$ LANGUAGE plpgsql;