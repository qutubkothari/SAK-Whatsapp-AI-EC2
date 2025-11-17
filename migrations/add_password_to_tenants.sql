-- Add password column to tenants table for login authentication
-- This migration adds password support for username/password login

-- Add password column (nullable for backward compatibility)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Create index for faster password lookups
CREATE INDEX IF NOT EXISTS idx_tenants_password ON tenants(password) WHERE password IS NOT NULL;

-- Update existing tenants to have default password (their business_name)
-- This is a temporary solution - users should change their password after first login
UPDATE tenants 
SET password = business_name 
WHERE password IS NULL;

-- Add comment
COMMENT ON COLUMN tenants.password IS 'User password for dashboard login. Defaults to business_name if not set.';
