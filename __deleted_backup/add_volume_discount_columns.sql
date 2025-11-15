-- Add volume discount columns to orders table
-- Run this migration in Supabase SQL Editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS volume_discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS volume_discount_percent DECIMAL(5,2) DEFAULT 0;

-- Add comment to columns
COMMENT ON COLUMN orders.volume_discount_amount IS 'Volume-based discount amount applied to the order';
COMMENT ON COLUMN orders.volume_discount_percent IS 'Volume-based discount percentage applied (e.g., 5.00 for 5%)';

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_volume_discount ON orders(volume_discount_amount) WHERE volume_discount_amount > 0;
