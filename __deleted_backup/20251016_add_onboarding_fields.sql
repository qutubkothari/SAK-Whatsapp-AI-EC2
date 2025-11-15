-- Add onboarding fields to customer_profiles table
-- Migration: 20251016_add_onboarding_fields.sql

ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_stage VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create index for faster onboarding queries
CREATE INDEX IF NOT EXISTS idx_customer_profiles_onboarding 
ON customer_profiles(tenant_id, onboarding_completed);

-- Update existing customers to mark them as onboarded if they have a name
UPDATE customer_profiles 
SET onboarding_completed = TRUE,
    onboarding_stage = 'completed'
WHERE first_name IS NOT NULL 
  AND onboarding_completed IS NULL;

COMMENT ON COLUMN customer_profiles.onboarding_completed IS 'Whether customer has completed the onboarding process';
COMMENT ON COLUMN customer_profiles.onboarding_stage IS 'Current onboarding stage: welcome, name, business_info, completed';
COMMENT ON COLUMN customer_profiles.address IS 'Customer business address';
