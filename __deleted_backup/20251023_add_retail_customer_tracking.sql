-- Migration: Add Retail Customer Tracking Fields
-- Date: 2025-10-23
-- Description: Add fields to track retail counter walk-in customers

-- Add retail tracking fields to customer_profiles
ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS customer_source VARCHAR(50) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS retail_visit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_retail_visit TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_contact_date TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_source ON customer_profiles(customer_source);
CREATE INDEX IF NOT EXISTS idx_retail_visits ON customer_profiles(retail_visit_count);
CREATE INDEX IF NOT EXISTS idx_last_retail_visit ON customer_profiles(last_retail_visit);

-- Add comment to explain fields
COMMENT ON COLUMN customer_profiles.customer_source IS 'Source of customer acquisition: retail_counter, whatsapp, website, referral';
COMMENT ON COLUMN customer_profiles.retail_visit_count IS 'Number of times customer scanned QR code or visited retail counter';
COMMENT ON COLUMN customer_profiles.last_retail_visit IS 'Last time customer scanned retail QR code or made counter purchase';
COMMENT ON COLUMN customer_profiles.first_contact_date IS 'First time customer connected via any channel';

-- Update existing records to set first_contact_date if null
UPDATE customer_profiles
SET first_contact_date = created_at
WHERE first_contact_date IS NULL;

-- Add bill_number field to orders table (optional - for linking retail purchases)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS bill_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'whatsapp';

CREATE INDEX IF NOT EXISTS idx_orders_bill_number ON orders(bill_number);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);

COMMENT ON COLUMN orders.bill_number IS 'Retail counter bill/invoice number for tracking purchases';
COMMENT ON COLUMN orders.source IS 'Order source: whatsapp, retail_counter, website, phone';
