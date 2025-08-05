
CREATE TABLE IF NOT EXISTS website_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    section TEXT NOT NULL UNIQUE,
    background_image_id VARCHAR REFERENCES media(id),
    background_video_id VARCHAR REFERENCES media(id),
    contact_email TEXT,
    contact_phone TEXT,
    contact_address TEXT,
    updated_by VARCHAR NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default contact info if it doesn't exist
INSERT INTO website_settings (section, updated_by) 
SELECT 'contact_info', id FROM users LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM website_settings WHERE section = 'contact_info');
