-- Development Database Initialization Script
-- This script sets up the development database with necessary extensions and test data

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create development-specific configurations
ALTER DATABASE dt_visuals_dev SET log_statement = 'all';
ALTER DATABASE dt_visuals_dev SET log_duration = on;

-- Wait for Drizzle to create tables, then populate with test data
-- This function will be called after tables are created
CREATE OR REPLACE FUNCTION populate_dev_test_data() RETURNS void AS $$
BEGIN
    -- Check if users table exists and is empty
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        
        -- Insert test users with properly hashed passwords (scrypt algorithm)
        INSERT INTO users (id, username, email, password) VALUES 
        ('admin-user-id', 'admin', 'admin@dtvisuals.com', 'da06ef17a5bce192c00d02e92aa40eb563e38084755fa219643499ef5027c4f8:7301531c4aee740d57796afabb6a00e1ee4f56a6c46376e569534ece5e61dc53a0a682b311f365e5d67acbd5d95df318e802571f8b559ca03b0338efa484a667'),
        ('staff-user-id', 'staff', 'staff@dtvisuals.com', '4b4fea840b0bdd38c664b652f8a6be4544b05d82d5cc7f7caab4c96fed86a8c0:843fcb0ed4b9c1d9a0682864ccdfc53256ff2cf842d4b1cddd2753b7597f679d62299e6b6407876c19ed06a5a50c9c25f57ebb493afe6ccd6a39dc5a966e8131'),
        ('client-user-id', 'client', 'client@example.com', '41dcff7f69dbaa3921683e24c4037acd3bd3bfa4425df7780d8c294ced3d91ec:3280617520d7c6005060dacf9f291ba22df332d008ec673d43d68e4f29289f96768db83637882178c4444e5b41a3419a96727d3e16d64e64c04729315c12962d');

        -- Insert roles
        INSERT INTO roles (id, name, description) VALUES 
        ('admin-role-id', 'Admin', 'Full system access with all permissions'),
        ('staff-role-id', 'Staff', 'Media management and client interaction permissions'),
        ('client-role-id', 'Client', 'View assigned media content only');

        -- Insert permissions
        INSERT INTO permissions (id, name, description) VALUES 
        ('perm-upload-media', 'upload:media', 'Upload new media files'),
        ('perm-edit-media', 'edit:media', 'Edit media metadata and properties'),
        ('perm-delete-media', 'delete:media', 'Delete media files'),
        ('perm-assign-client', 'assign:client', 'Assign media to clients'),
        ('perm-view-media', 'view:media', 'View media content'),
        ('perm-view-clients', 'view:clients', 'View client information'),
        ('perm-edit-clients', 'edit:clients', 'Edit client information'),
        ('perm-edit-users', 'edit:users', 'Manage user accounts'),
        ('perm-edit-roles', 'edit:roles', 'Manage roles and permissions'),
        ('perm-edit-website', 'edit:website', 'Manage website settings and content'),
        ('perm-view-analytics', 'view:analytics', 'View system analytics');

        -- Assign roles to users
        INSERT INTO user_roles (user_id, role_id) VALUES 
        ('admin-user-id', 'admin-role-id'),
        ('staff-user-id', 'staff-role-id'),
        ('client-user-id', 'client-role-id');

        -- Assign permissions to roles
        -- Admin gets all permissions
        INSERT INTO role_permissions (role_id, permission_id) VALUES 
        ('admin-role-id', 'perm-upload-media'),
        ('admin-role-id', 'perm-edit-media'),
        ('admin-role-id', 'perm-delete-media'),
        ('admin-role-id', 'perm-assign-client'),
        ('admin-role-id', 'perm-view-media'),
        ('admin-role-id', 'perm-view-clients'),
        ('admin-role-id', 'perm-edit-clients'),
        ('admin-role-id', 'perm-edit-users'),
        ('admin-role-id', 'perm-edit-roles'),
        ('admin-role-id', 'perm-edit-website'),
        ('admin-role-id', 'perm-view-analytics');

        -- Staff gets media and client management permissions
        INSERT INTO role_permissions (role_id, permission_id) VALUES 
        ('staff-role-id', 'perm-upload-media'),
        ('staff-role-id', 'perm-edit-media'),
        ('staff-role-id', 'perm-assign-client'),
        ('staff-role-id', 'perm-view-media'),
        ('staff-role-id', 'perm-view-clients');

        -- Client gets only view permissions
        INSERT INTO role_permissions (role_id, permission_id) VALUES 
        ('client-role-id', 'perm-view-media');

        -- Insert test clients
        INSERT INTO clients (id, name, email, company, phone, notes, created_by) VALUES 
        ('test-client-1', 'Acme Corporation', 'contact@acme.com', 'Acme Corp', '+1-555-0123', 'Main corporate client', 'admin-user-id'),
        ('test-client-2', 'Creative Studios', 'hello@creativestudios.com', 'Creative Studios LLC', '+1-555-0456', 'Independent creative agency', 'staff-user-id');

        -- Insert sample media
        INSERT INTO media (id, title, type, url, filename, mime_type, is_featured, show_in_portfolio, tags, project_stage, notes, client_id, uploaded_by) VALUES 
        ('sample-video-1', 'Corporate Brand Video', 'video', '/uploads/sample-brand-video.mp4', 'sample-brand-video.mp4', 'video/mp4', true, true, ARRAY['corporate', 'branding', 'showcase'], 'completed', 'Main brand video for Acme Corporation', 'test-client-1', 'admin-user-id'),
        ('sample-image-1', 'Product Photography', 'image', '/uploads/sample-product-photo.jpg', 'sample-product-photo.jpg', 'image/jpeg', true, true, ARRAY['product', 'photography', 'commercial'], 'delivered', 'Professional product photography session', 'test-client-1', 'staff-user-id'),
        ('sample-video-2', 'Behind the Scenes', 'video', '/uploads/sample-bts-video.mp4', 'sample-bts-video.mp4', 'video/mp4', false, false, ARRAY['bts', 'documentary'], 'post-production', 'Behind the scenes footage', 'test-client-2', 'staff-user-id');

        -- Insert media-client assignments  
        INSERT INTO media_clients (media_id, client_id, access_level, expires_at, assigned_by) VALUES 
        ('sample-video-1', 'test-client-1', 'full', NULL, 'admin-user-id'),
        ('sample-image-1', 'test-client-1', 'full', NULL, 'staff-user-id'),
        ('sample-video-2', 'test-client-2', 'view', NULL, 'staff-user-id');

        -- Insert website settings
        INSERT INTO website_settings (id, section, background_media_id, background_type, settings) VALUES 
        ('hero-section', 'hero', 'sample-video-1', 'video', '{"autoplay": true, "muted": true, "loop": true}'),
        ('featured-section', 'featured', 'sample-image-1', 'image', '{"overlay": true, "blur": false}');

        RAISE NOTICE 'Development test data populated successfully';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Development database is ready for Drizzle migrations
SELECT 'Development database initialized successfully' as status;