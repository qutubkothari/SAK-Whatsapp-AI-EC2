-- Add daily_message_limit column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS daily_message_limit INTEGER DEFAULT 1000;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_daily_limit ON tenants(daily_message_limit);

-- Update existing tenants to have default limit
UPDATE tenants SET daily_message_limit = 1000 WHERE daily_message_limit IS NULL;

-- Add comment
COMMENT ON COLUMN tenants.daily_message_limit IS 'Maximum messages this tenant can send per day (default: 1000)';
