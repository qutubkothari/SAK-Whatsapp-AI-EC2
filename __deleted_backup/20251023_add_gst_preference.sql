-- Migration: Add GST Preference Tracking
-- Date: 2025-10-23
-- Description: Add gst_preference field to track customer GST requirement (with_gst, no_gst, or null if not asked yet)

-- Add gst_preference column to customer_profiles
ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS gst_preference VARCHAR(20) CHECK (gst_preference IN ('with_gst', 'no_gst', NULL));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_gst_preference ON customer_profiles(gst_preference);

-- Add comment to explain field
COMMENT ON COLUMN customer_profiles.gst_preference IS 'Customer GST preference: with_gst (needs GST invoice), no_gst (retail customer without GST), NULL (not asked yet)';

-- Set default to NULL for existing customers (will be asked on next order)
-- Customers who already have gst_number should be marked as 'with_gst'
UPDATE customer_profiles
SET gst_preference = 'with_gst'
WHERE gst_number IS NOT NULL AND gst_number != '' AND gst_preference IS NULL;
