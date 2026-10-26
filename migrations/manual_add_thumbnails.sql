-- Migration to add thumbnailUrl field and update showInPortfolio default
-- This should be run manually on existing databases

-- Add thumbnailUrl column to media table
ALTER TABLE media ADD COLUMN thumbnail_url TEXT;

-- Update default for show_in_portfolio for new records
-- Note: This only affects new records, existing records are not changed
ALTER TABLE media ALTER COLUMN show_in_portfolio SET DEFAULT false;

-- Optional: Update existing records to respect user preference
-- Uncomment the line below if you want to hide all existing media from portfolio by default
-- UPDATE media SET show_in_portfolio = false WHERE show_in_portfolio = true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_show_in_portfolio ON media(show_in_portfolio) WHERE show_in_portfolio = true;
CREATE INDEX IF NOT EXISTS idx_media_thumbnail_url ON media(thumbnail_url) WHERE thumbnail_url IS NOT NULL;