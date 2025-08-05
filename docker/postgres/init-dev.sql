
-- Development Database Initialization Script
-- This script sets up the development database with comprehensive test data

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create development-specific configurations
ALTER DATABASE dt_visuals_dev SET log_statement = 'all';
ALTER DATABASE dt_visuals_dev SET log_duration = on;

-- Wait for Drizzle to create tables, then populate with comprehensive data
-- This function will be called after tables are created
CREATE OR REPLACE FUNCTION populate_dev_test_data() RETURNS text AS $$
DECLARE
    result_text text := '';
    user_count integer;
    admin_user_id text;
    staff_user_id text;
    admin_role_id text;
    staff_role_id text;
    test_client_id text;
    test2_client_id text;
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
        -- Create basic roles
        SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
        IF admin_role_id IS NULL THEN
            admin_role_id := gen_random_uuid()::text;
            INSERT INTO roles (id, name, description) 
            VALUES (admin_role_id, 'Admin', 'Full system administrator with all permissions');
        END IF;

        SELECT id INTO staff_role_id FROM roles WHERE name = 'Staff' LIMIT 1;
        IF staff_role_id IS NULL THEN
            staff_role_id := gen_random_uuid()::text;
            INSERT INTO roles (id, name, description) 
            VALUES (staff_role_id, 'Staff', 'Staff member with limited administrative access');
        END IF;

        -- Create basic users
        SELECT id INTO admin_user_id FROM users WHERE username = 'admin' OR email = 'admin@dtvisuals.com' LIMIT 1;
        IF admin_user_id IS NULL THEN
            admin_user_id := gen_random_uuid()::text;
            INSERT INTO users (id, username, email, password, forename, surname, display_name, is_active, created_at) 
            VALUES (admin_user_id, 'admin', 'admin@dtvisuals.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', 'Admin', 'User', 'Admin User', true, NOW());
            
            -- Assign admin role
            INSERT INTO user_roles (user_id, role_id) VALUES (admin_user_id, admin_role_id) ON CONFLICT DO NOTHING;
        END IF;

        SELECT id INTO staff_user_id FROM users WHERE username = 'staff' OR email = 'staff@dtvisuals.com' LIMIT 1;
        IF staff_user_id IS NULL THEN
            staff_user_id := gen_random_uuid()::text;
            INSERT INTO users (id, username, email, password, forename, surname, display_name, is_active, created_at) 
            VALUES (staff_user_id, 'staff', 'staff@dtvisuals.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', 'Staff', 'Member', 'Staff Member', true, NOW());
            
            -- Assign staff role
            INSERT INTO user_roles (user_id, role_id) VALUES (staff_user_id, staff_role_id) ON CONFLICT DO NOTHING;
        END IF;

        -- Create test clients
        SELECT id INTO test_client_id FROM clients WHERE email = 'testclient@example.com' LIMIT 1;
        IF test_client_id IS NULL THEN
            test_client_id := gen_random_uuid()::text;
            INSERT INTO clients (id, name, email, company, phone, notes, is_active, created_by, created_at, updated_at) 
            VALUES (test_client_id, 'Test Client', 'testclient@example.com', 'Test Company', '555-0123', 'Development test client', true, admin_user_id, NOW(), NOW());
            
            -- Create client user account
            INSERT INTO client_users (id, client_id, username, email, password, is_active, created_at) 
            VALUES (gen_random_uuid()::text, test_client_id, 'testclient', 'testclient@example.com', '$2b$10$8K1p/a0dHTBS.L90wLAemOuMEDEh.Et6k0L4HkmnJ4/v4DQwE3OFO', true, NOW())
            ON CONFLICT (email) DO NOTHING;
        END IF;

        SELECT id INTO test2_client_id FROM clients WHERE email = 'test2@client.com' LIMIT 1;
        IF test2_client_id IS NULL THEN
            test2_client_id := gen_random_uuid()::text;
            INSERT INTO clients (id, name, email, company, phone, notes, is_active, created_by, created_at, updated_at) 
            VALUES (test2_client_id, 'Test2 Client', 'test2@client.com', 'Another Test Company', '555-0124', 'Another development test client', true, admin_user_id, NOW(), NOW());
            
            -- Create client user account
            INSERT INTO client_users (id, client_id, username, email, password, is_active, created_at) 
            VALUES (gen_random_uuid()::text, test2_client_id, 'test2', 'test2@client.com', '892f317ed33045523735f967abaf2e2b:03f989540668641d9515b240ade6a25cec613d30307beb471051ce924f2442e69a717c526efaf4facf9b6f230689996ac01e074bf73ac070af8bf6e05abb1eab', true, NOW())
            ON CONFLICT (email) DO NOTHING;
        END IF;

        result_text := 'SUCCESS: Development test data populated successfully! Added users, roles, and test clients.';
        RAISE NOTICE '%', result_text;
        
    ELSE
        result_text := 'INFO: Users table already contains ' || user_count || ' users, skipping population.';
        RAISE NOTICE '%', result_text;
    END IF;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

    -- Staff role
    SELECT id INTO staff_role_id FROM roles WHERE name = 'Staff' LIMIT 1;
    IF staff_role_id IS NULL THEN
        staff_role_id := gen_random_uuid()::text;
        INSERT INTO roles (id, name, description) 
        VALUES (staff_role_id, 'Staff', 'Staff member with media and client management permissions');
        roles_added := roles_added + 1;
        RAISE NOTICE 'Created Staff role with ID: %', staff_role_id;
    ELSE
        RAISE NOTICE 'Staff role already exists with ID: %', staff_role_id;
    END IF;

    -- Client role
    SELECT id INTO client_role_id FROM roles WHERE name = 'Client' LIMIT 1;
    IF client_role_id IS NULL THEN
        client_role_id := gen_random_uuid()::text;
        INSERT INTO roles (id, name, description) 
        VALUES (client_role_id, 'Client', 'Client with view-only permissions for assigned media');
        roles_added := roles_added + 1;
        RAISE NOTICE 'Created Client role with ID: %', client_role_id;
    ELSE
        RAISE NOTICE 'Client role already exists with ID: %', client_role_id;
    END IF;

    -- Editor role
    SELECT id INTO editor_role_id FROM roles WHERE name = 'Editor' LIMIT 1;
    IF editor_role_id IS NULL THEN
        editor_role_id := gen_random_uuid()::text;
        INSERT INTO roles (id, name, description) 
        VALUES (editor_role_id, 'Editor', 'Video editor with media upload and editing permissions');
        roles_added := roles_added + 1;
        RAISE NOTICE 'Created Editor role with ID: %', editor_role_id;
    ELSE
        RAISE NOTICE 'Editor role already exists with ID: %', editor_role_id;
    END IF;

    -- Marketing role
    SELECT id INTO marketing_role_id FROM roles WHERE name = 'Marketing' LIMIT 1;
    IF marketing_role_id IS NULL THEN
        marketing_role_id := gen_random_uuid()::text;
        INSERT INTO roles (id, name, description) 
        VALUES (marketing_role_id, 'Marketing', 'Marketing team with website and portfolio management permissions');
        roles_added := roles_added + 1;
        RAISE NOTICE 'Created Marketing role with ID: %', marketing_role_id;
    ELSE
        RAISE NOTICE 'Marketing role already exists with ID: %', marketing_role_id;
    END IF;

    -- 3. INSERT PERMISSIONS (check by name)
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'upload:media', 'Upload media files' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'upload:media');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'edit:media', 'Edit media metadata and assignments' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'edit:media');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'delete:media', 'Delete media files' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'delete:media');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'assign:media', 'Assign media to clients' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'assign:media');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'view:media', 'View media files and metadata' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view:media');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'view:clients', 'View client information' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view:clients');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'edit:clients', 'Edit client information' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'edit:clients');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'edit:users', 'Manage user accounts and permissions' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'edit:users');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'edit:roles', 'Manage roles and permissions' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'edit:roles');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'edit:website', 'Manage website settings and customization' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'edit:website');
    
    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'view:analytics', 'View system analytics and reports' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view:analytics');

    INSERT INTO permissions (id, name, description) 
    SELECT gen_random_uuid()::text, 'manage:feedback', 'Manage client feedback and timeline notes' 
    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage:feedback');

    GET DIAGNOSTICS permissions_added = ROW_COUNT;
    RAISE NOTICE 'Added % permissions', permissions_added;

    -- 4. INSERT USER ROLES (check if relationship exists)
    -- Admin user gets admin role
    INSERT INTO user_roles (user_id, role_id) 
    SELECT admin_user_id, admin_role_id 
    WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_user_id AND role_id = admin_role_id);

    -- Staff user gets staff role
    INSERT INTO user_roles (user_id, role_id) 
    SELECT staff_user_id, staff_role_id 
    WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = staff_user_id AND role_id = staff_role_id);

    -- Editor user gets editor role
    INSERT INTO user_roles (user_id, role_id) 
    SELECT editor_user_id, editor_role_id 
    WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = editor_user_id AND role_id = editor_role_id);

    RAISE NOTICE 'Assigned roles to users';

    -- 5. INSERT ROLE PERMISSIONS (check if relationship exists)
    -- Admin role gets all permissions
    INSERT INTO role_permissions (role_id, permission_id) 
    SELECT admin_role_id, p.id FROM permissions p 
    WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = admin_role_id AND permission_id = p.id);

    -- Staff role permissions
    INSERT INTO role_permissions (role_id, permission_id) 
    SELECT staff_role_id, p.id FROM permissions p WHERE p.name IN (
        'upload:media', 'edit:media', 'assign:media', 'view:media', 'view:clients', 'edit:clients', 'manage:feedback'
    ) AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = staff_role_id AND permission_id = p.id);

    -- Editor role permissions
    INSERT INTO role_permissions (role_id, permission_id) 
    SELECT editor_role_id, p.id FROM permissions p WHERE p.name IN (
        'upload:media', 'edit:media', 'view:media', 'view:clients'
    ) AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = editor_role_id AND permission_id = p.id);

    -- Marketing role permissions
    INSERT INTO role_permissions (role_id, permission_id) 
    SELECT marketing_role_id, p.id FROM permissions p WHERE p.name IN (
        'view:media', 'edit:website', 'view:analytics', 'view:clients'
    ) AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = marketing_role_id AND permission_id = p.id);

    -- Client role permissions
    INSERT INTO role_permissions (role_id, permission_id) 
    SELECT client_role_id, p.id FROM permissions p WHERE p.name IN ('view:media') 
    AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = client_role_id AND permission_id = p.id);

    RAISE NOTICE 'Assigned permissions to roles';

    -- 6. INSERT CLIENTS (check by name and email)
    SELECT id INTO test_client_id FROM clients WHERE name = 'Acme Corporation' OR email = 'contact@acme.com' LIMIT 1;
    IF test_client_id IS NULL THEN
        test_client_id := gen_random_uuid()::text;
        INSERT INTO clients (id, name, email, company, phone, notes, is_active, created_by, created_at, updated_at) 
        VALUES (test_client_id, 'Acme Corporation', 'contact@acme.com', 'Acme Corporation', '+1-555-0123', 'Major corporate client focused on brand development and corporate communications.', true, admin_user_id, NOW(), NOW());
        clients_added := clients_added + 1;
        RAISE NOTICE 'Created Acme Corporation client with ID: %', test_client_id;
    ELSE
        RAISE NOTICE 'Acme Corporation client already exists with ID: %', test_client_id;
    END IF;

    SELECT id INTO test2_client_id FROM clients WHERE name = 'Creative Studios' OR email = 'hello@creativestudios.com' LIMIT 1;
    IF test2_client_id IS NULL THEN
        test2_client_id := gen_random_uuid()::text;
        INSERT INTO clients (id, name, email, company, phone, notes, is_active, created_by, created_at, updated_at) 
        VALUES (test2_client_id, 'Creative Studios', 'hello@creativestudios.com', 'Creative Studios LLC', '+1-555-0456', 'Creative agency specializing in artistic and experimental video content.', true, staff_user_id, NOW(), NOW());
        clients_added := clients_added + 1;
        RAISE NOTICE 'Created Creative Studios client with ID: %', test2_client_id;
    ELSE
        RAISE NOTICE 'Creative Studios client already exists with ID: %', test2_client_id;
    END IF;

    -- 7. INSERT CLIENT USERS (check by username/email)
    SELECT id INTO test_client_user_id FROM client_users WHERE username = 'acme_client' OR email = 'client@acme.com' LIMIT 1;
    IF test_client_user_id IS NULL THEN
        test_client_user_id := gen_random_uuid()::text;
        INSERT INTO client_users (id, client_id, username, email, password, is_active, created_at) 
        VALUES (test_client_user_id, test_client_id, 'acme_client', 'client@acme.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', true, NOW());
        client_users_added := client_users_added + 1;
        RAISE NOTICE 'Created Acme client user with ID: %', test_client_user_id;
    ELSE
        RAISE NOTICE 'Acme client user already exists with ID: %', test_client_user_id;
    END IF;

    SELECT id INTO test2_client_user_id FROM client_users WHERE username = 'creative_client' OR email = 'client@creativestudios.com' LIMIT 1;
    IF test2_client_user_id IS NULL THEN
        test2_client_user_id := gen_random_uuid()::text;
        INSERT INTO client_users (id, client_id, username, email, password, is_active, created_at) 
        VALUES (test2_client_user_id, test2_client_id, 'creative_client', 'client@creativestudios.com', 'df10c71f317ded80d49fc8ebd89b928fdb6706e3bb45ea330da8a7caa009d98ebc3c57461844955f37b7dbb5651a00c42a0a924e7030550d4eb8bb2b1196878a.4e8dad95ff12fe8b727f303f8ac1a12f', true, NOW());
        client_users_added := client_users_added + 1;
        RAISE NOTICE 'Created Creative Studios client user with ID: %', test2_client_user_id;
    ELSE
        RAISE NOTICE 'Creative Studios client user already exists with ID: %', test2_client_user_id;
    END IF;

    -- 8. INSERT MEDIA (check by title and filename)
    SELECT id INTO media_video_id FROM media WHERE title = 'Corporate Brand Video' OR filename = 'corporate_brand_2024.mp4' LIMIT 1;
    IF media_video_id IS NULL THEN
        media_video_id := gen_random_uuid()::text;
        INSERT INTO media (id, title, type, url, poster_url, filename, file_size, mime_type, is_featured, show_in_portfolio, tags, project_stage, notes, client_id, uploaded_by, created_at) 
        VALUES (media_video_id, 'Corporate Brand Video', 'video', '/uploads/corporate_brand_2024.mp4', '/uploads/corporate_brand_2024_poster.jpg', 'corporate_brand_2024.mp4', 52428800, 'video/mp4', true, true, ARRAY['corporate', 'branding', 'professional'], 'completed', 'High-end corporate brand video showcasing company values and mission.', test_client_id, admin_user_id, NOW());
        media_added := media_added + 1;
        RAISE NOTICE 'Created Corporate Brand Video with ID: %', media_video_id;
    ELSE
        RAISE NOTICE 'Corporate Brand Video already exists with ID: %', media_video_id;
    END IF;

    SELECT id INTO media_photo_id FROM media WHERE title = 'Product Photography Collection' OR filename = 'product_photos_2024.jpg' LIMIT 1;
    IF media_photo_id IS NULL THEN
        media_photo_id := gen_random_uuid()::text;
        INSERT INTO media (id, title, type, url, poster_url, filename, file_size, mime_type, is_featured, show_in_portfolio, tags, project_stage, notes, client_id, uploaded_by, created_at) 
        VALUES (media_photo_id, 'Product Photography Collection', 'image', '/uploads/product_photos_2024.jpg', NULL, 'product_photos_2024.jpg', 8388608, 'image/jpeg', true, true, ARRAY['product', 'photography', 'commercial'], 'delivered', 'Professional product photography for e-commerce and marketing materials.', test_client_id, staff_user_id, NOW());
        media_added := media_added + 1;
        RAISE NOTICE 'Created Product Photography Collection with ID: %', media_photo_id;
    ELSE
        RAISE NOTICE 'Product Photography Collection already exists with ID: %', media_photo_id;
    END IF;

    SELECT id INTO media_bts_id FROM media WHERE title = 'Behind the Scenes - Creative Project' OR filename = 'bts_creative_2024.mp4' LIMIT 1;
    IF media_bts_id IS NULL THEN
        media_bts_id := gen_random_uuid()::text;
        INSERT INTO media (id, title, type, url, poster_url, filename, file_size, mime_type, is_featured, show_in_portfolio, tags, project_stage, notes, client_id, uploaded_by, created_at) 
        VALUES (media_bts_id, 'Behind the Scenes - Creative Project', 'video', '/uploads/bts_creative_2024.mp4', '/uploads/bts_creative_2024_poster.jpg', 'bts_creative_2024.mp4', 31457280, 'video/mp4', false, false, ARRAY['behind-the-scenes', 'creative', 'internal'], 'post-production', 'Behind the scenes footage from creative studio project.', test2_client_id, editor_user_id, NOW());
        media_added := media_added + 1;
        RAISE NOTICE 'Created Behind the Scenes video with ID: %', media_bts_id;
    ELSE
        RAISE NOTICE 'Behind the Scenes video already exists with ID: %', media_bts_id;
    END IF;

    SELECT id INTO media_portfolio_id FROM media WHERE title = 'Portfolio Showcase Reel' OR filename = 'portfolio_reel_2024.mp4' LIMIT 1;
    IF media_portfolio_id IS NULL THEN
        media_portfolio_id := gen_random_uuid()::text;
        INSERT INTO media (id, title, type, url, poster_url, filename, file_size, mime_type, is_featured, show_in_portfolio, tags, project_stage, notes, client_id, uploaded_by, created_at) 
        VALUES (media_portfolio_id, 'Portfolio Showcase Reel', 'video', '/uploads/portfolio_reel_2024.mp4', '/uploads/portfolio_reel_2024_poster.jpg', 'portfolio_reel_2024.mp4', 73728000, 'video/mp4', true, true, ARRAY['portfolio', 'showcase', 'demo'], 'completed', 'Company portfolio showcase reel featuring best work from 2024.', NULL, admin_user_id, NOW());
        media_added := media_added + 1;
        RAISE NOTICE 'Created Portfolio Showcase Reel with ID: %', media_portfolio_id;
    ELSE
        RAISE NOTICE 'Portfolio Showcase Reel already exists with ID: %', media_portfolio_id;
    END IF;

    SELECT id INTO media_concept_id FROM media WHERE title = 'Concept Art Collection' OR filename = 'concept_art_2024.jpg' LIMIT 1;
    IF media_concept_id IS NULL THEN
        media_concept_id := gen_random_uuid()::text;
        INSERT INTO media (id, title, type, url, poster_url, filename, file_size, mime_type, is_featured, show_in_portfolio, tags, project_stage, notes, client_id, uploaded_by, created_at) 
        VALUES (media_concept_id, 'Concept Art Collection', 'image', '/uploads/concept_art_2024.jpg', NULL, 'concept_art_2024.jpg', 12582912, 'image/jpeg', false, true, ARRAY['concept', 'art', 'creative'], 'concept', 'Initial concept art and design mockups for upcoming project.', test2_client_id, editor_user_id, NOW());
        media_added := media_added + 1;
        RAISE NOTICE 'Created Concept Art Collection with ID: %', media_concept_id;
    ELSE
        RAISE NOTICE 'Concept Art Collection already exists with ID: %', media_concept_id;
    END IF;

    -- 9. INSERT MEDIA_CLIENTS relationships (check if relationship exists)
    INSERT INTO media_clients (id, media_id, client_id) 
    SELECT gen_random_uuid()::text, media_video_id, test_client_id 
    WHERE NOT EXISTS (SELECT 1 FROM media_clients WHERE media_id = media_video_id AND client_id = test_client_id);

    INSERT INTO media_clients (id, media_id, client_id) 
    SELECT gen_random_uuid()::text, media_photo_id, test_client_id 
    WHERE NOT EXISTS (SELECT 1 FROM media_clients WHERE media_id = media_photo_id AND client_id = test_client_id);

    INSERT INTO media_clients (id, media_id, client_id) 
    SELECT gen_random_uuid()::text, media_bts_id, test2_client_id 
    WHERE NOT EXISTS (SELECT 1 FROM media_clients WHERE media_id = media_bts_id AND client_id = test2_client_id);

    INSERT INTO media_clients (id, media_id, client_id) 
    SELECT gen_random_uuid()::text, media_concept_id, test2_client_id 
    WHERE NOT EXISTS (SELECT 1 FROM media_clients WHERE media_id = media_concept_id AND client_id = test2_client_id);

    RAISE NOTICE 'Created media-client relationships';

    -- 10. INSERT WEBSITE_SETTINGS (check by section)
    INSERT INTO website_settings (id, section, background_image_id, background_video_id, contact_email, contact_phone, contact_address, updated_by, updated_at) 
    SELECT gen_random_uuid()::text, 'hero', NULL, media_portfolio_id, NULL, NULL, NULL, admin_user_id, NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM website_settings WHERE section = 'hero');

    INSERT INTO website_settings (id, section, background_image_id, background_video_id, contact_email, contact_phone, contact_address, updated_by, updated_at) 
    SELECT gen_random_uuid()::text, 'featured_work', media_photo_id, NULL, NULL, NULL, NULL, admin_user_id, NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM website_settings WHERE section = 'featured_work');

    INSERT INTO website_settings (id, section, background_image_id, background_video_id, contact_email, contact_phone, contact_address, updated_by, updated_at) 
    SELECT gen_random_uuid()::text, 'contact_info', NULL, NULL, 'hello@dtvisuals.com', '+1-555-DT-VISUAL', '123 Creative Street, Studio City, CA 90210', admin_user_id, NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM website_settings WHERE section = 'contact_info');

    INSERT INTO website_settings (id, section, background_image_id, background_video_id, contact_email, contact_phone, contact_address, updated_by, updated_at) 
    SELECT gen_random_uuid()::text, 'portfolio_header', NULL, media_video_id, NULL, NULL, NULL, admin_user_id, NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM website_settings WHERE section = 'portfolio_header');

    INSERT INTO website_settings (id, section, background_image_id, background_video_id, contact_email, contact_phone, contact_address, updated_by, updated_at) 
    SELECT gen_random_uuid()::text, 'services', media_concept_id, NULL, NULL, NULL, NULL, admin_user_id, NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM website_settings WHERE section = 'services');

    GET DIAGNOSTICS website_settings_added = ROW_COUNT;
    RAISE NOTICE 'Added % website settings', website_settings_added;

    -- 11. INSERT MEDIA_FEEDBACK (check for existing feedback by media and client user)
    INSERT INTO media_feedback (id, media_id, client_user_id, feedback_text, rating, created_at) 
    SELECT gen_random_uuid()::text, media_video_id, test_client_user_id, 'Excellent work! The video perfectly captures our brand essence. We love the cinematic quality and professional presentation.', 5, NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM media_feedback WHERE media_id = media_video_id AND client_user_id = test_client_user_id);

    INSERT INTO media_feedback (id, media_id, client_user_id, feedback_text, rating, created_at) 
    SELECT gen_random_uuid()::text, media_photo_id, test_client_user_id, 'The product photography is stunning. Great lighting and composition. These will work perfectly for our e-commerce site.', 5, NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM media_feedback WHERE media_id = media_photo_id AND client_user_id = test_client_user_id);

    INSERT INTO media_feedback (id, media_id, client_user_id, feedback_text, rating, created_at) 
    SELECT gen_random_uuid()::text, media_concept_id, test2_client_user_id, 'Love the creative direction shown in these concepts. Can we explore more variations on the third design?', 4, NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM media_feedback WHERE media_id = media_concept_id AND client_user_id = test2_client_user_id);

    GET DIAGNOSTICS feedback_added = ROW_COUNT;
    RAISE NOTICE 'Added % media feedback entries', feedback_added;

    -- 12. INSERT MEDIA_TIMELINE_NOTES (check for existing notes by media, client user, and timestamp)
    INSERT INTO media_timeline_notes (id, media_id, client_user_id, timestamp_seconds, note_text, created_at) 
    SELECT gen_random_uuid()::text, media_video_id, test_client_user_id, 15, 'Love the opening sequence with the logo animation!', NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM media_timeline_notes WHERE media_id = media_video_id AND client_user_id = test_client_user_id AND timestamp_seconds = 15);

    INSERT INTO media_timeline_notes (id, media_id, client_user_id, timestamp_seconds, note_text, created_at) 
    SELECT gen_random_uuid()::text, media_video_id, test_client_user_id, 42, 'This transition is perfect - very smooth and professional.', NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM media_timeline_notes WHERE media_id = media_video_id AND client_user_id = test_client_user_id AND timestamp_seconds = 42);

    INSERT INTO media_timeline_notes (id, media_id, client_user_id, timestamp_seconds, note_text, created_at) 
    SELECT gen_random_uuid()::text, media_video_id, test_client_user_id, 78, 'Can we make the text here slightly larger for better readability?', NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM media_timeline_notes WHERE media_id = media_video_id AND client_user_id = test_client_user_id AND timestamp_seconds = 78);

    INSERT INTO media_timeline_notes (id, media_id, client_user_id, timestamp_seconds, note_text, created_at) 
    SELECT gen_random_uuid()::text, media_bts_id, test2_client_user_id, 23, 'Great behind-the-scenes content! This shows the process really well.', NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM media_timeline_notes WHERE media_id = media_bts_id AND client_user_id = test2_client_user_id AND timestamp_seconds = 23);

    INSERT INTO media_timeline_notes (id, media_id, client_user_id, timestamp_seconds, note_text, created_at) 
    SELECT gen_random_uuid()::text, media_bts_id, test2_client_user_id, 67, 'The lighting setup discussion here is very insightful.', NOW() 
    WHERE NOT EXISTS (SELECT 1 FROM media_timeline_notes WHERE media_id = media_bts_id AND client_user_id = test2_client_user_id AND timestamp_seconds = 67);

    GET DIAGNOSTICS timeline_notes_added = ROW_COUNT;
    RAISE NOTICE 'Added % timeline notes', timeline_notes_added;

    -- Generate summary
    result_text := 'SUCCESS: Development comprehensive data population completed! ';
    result_text := result_text || 'Added: ' || users_added || ' users, ';
    result_text := result_text || roles_added || ' roles, ';
    result_text := result_text || permissions_added || ' permissions, ';
    result_text := result_text || clients_added || ' clients, ';
    result_text := result_text || client_users_added || ' client users, ';
    result_text := result_text || media_added || ' media items, ';
    result_text := result_text || website_settings_added || ' website settings, ';
    result_text := result_text || feedback_added || ' feedback entries, ';
    result_text := result_text || timeline_notes_added || ' timeline notes.';
    
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
    media_count integer;
    media_clients_count integer;
    website_settings_count integer;
    feedback_count integer;
    timeline_notes_count integer;
BEGIN
    -- Count all tables
    SELECT COUNT(*) INTO user_count FROM users WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');
    SELECT COUNT(*) INTO role_count FROM roles WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles');
    SELECT COUNT(*) INTO permission_count FROM permissions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions');
    SELECT COUNT(*) INTO client_count FROM clients WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients');
    SELECT COUNT(*) INTO client_user_count FROM client_users WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_users');
    SELECT COUNT(*) INTO user_role_count FROM user_roles WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles');
    SELECT COUNT(*) INTO role_permission_count FROM role_permissions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions');
    SELECT COUNT(*) INTO media_count FROM media WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media');
    SELECT COUNT(*) INTO media_clients_count FROM media_clients WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_clients');
    SELECT COUNT(*) INTO website_settings_count FROM website_settings WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_settings');
    SELECT COUNT(*) INTO feedback_count FROM media_feedback WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_feedback');
    SELECT COUNT(*) INTO timeline_notes_count FROM media_timeline_notes WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_timeline_notes');

    verification_result := E'\n=== DEVELOPMENT DATABASE VERIFICATION ===\n';
    verification_result := verification_result || E'Users: ' || user_count || E'\n';
    verification_result := verification_result || E'Roles: ' || role_count || E'\n';
    verification_result := verification_result || E'Permissions: ' || permission_count || E'\n';
    verification_result := verification_result || E'Clients: ' || client_count || E'\n';
    verification_result := verification_result || E'Client Users: ' || client_user_count || E'\n';
    verification_result := verification_result || E'User-Role Assignments: ' || user_role_count || E'\n';
    verification_result := verification_result || E'Role-Permission Assignments: ' || role_permission_count || E'\n';
    verification_result := verification_result || E'Media Items: ' || media_count || E'\n';
    verification_result := verification_result || E'Media-Client Relationships: ' || media_clients_count || E'\n';
    verification_result := verification_result || E'Website Settings: ' || website_settings_count || E'\n';
    verification_result := verification_result || E'Media Feedback: ' || feedback_count || E'\n';
    verification_result := verification_result || E'Timeline Notes: ' || timeline_notes_count || E'\n';

    RAISE NOTICE '%', verification_result;
    RETURN verification_result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to display development accounts
CREATE OR REPLACE FUNCTION show_dev_accounts() RETURNS text AS $$
DECLARE
    account_info text := '';
    user_count integer;
    client_count integer;
    media_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO media_count FROM media;

    account_info := E'\n=== DEVELOPMENT ACCOUNT INFORMATION ===\n';
    account_info := account_info || E'Total Users: ' || user_count || E'\n';
    account_info := account_info || E'Total Clients: ' || client_count || E'\n';
    account_info := account_info || E'Total Media Items: ' || media_count || E'\n\n';
    
    account_info := account_info || E'Admin/Staff Accounts (for /auth login):\n';
    account_info := account_info || E'  Admin: admin@dtvisuals.com / admin123\n';
    account_info := account_info || E'  Staff: staff@dtvisuals.com / staff123\n';
    account_info := account_info || E'  Editor: editor@dtvisuals.com / editor123\n\n';
    
    account_info := account_info || E'Client Portal Accounts (for /client/login):\n';
    account_info := account_info || E'  Acme Corp: acme_client / client123 (client@acme.com)\n';
    account_info := account_info || E'  Creative Studios: creative_client / client123 (client@creativestudios.com)\n\n';
    
    account_info := account_info || E'System Features:\n';
    account_info := account_info || E'  - Complete RBAC system with 5 roles and 12 permissions\n';
    account_info := account_info || E'  - Dual authentication (Admin/Staff + Client portals)\n';
    account_info := account_info || E'  - 5 sample media items with client assignments\n';
    account_info := account_info || E'  - Website customization settings\n';
    account_info := account_info || E'  - Client feedback and timeline notes system\n';
    account_info := account_info || E'  - Media-client relationship management\n\n';
    
    account_info := account_info || E'All passwords are: admin123 / staff123 / editor123 / client123\n';

    RAISE NOTICE '%', account_info;
    RETURN account_info;
END;
$$ LANGUAGE plpgsql;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Development database initialization script loaded successfully.';
    RAISE NOTICE 'Call populate_dev_test_data() after table creation to populate with comprehensive test data.';
END $$;
