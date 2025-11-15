-- Fix shipment_tracking table schema
-- This script will drop existing tables and recreate with correct schema

-- Step 1: Drop existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS shipment_tracking_history CASCADE;
DROP TABLE IF EXISTS shipment_tracking CASCADE;

-- Step 2: Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_shipment_tracking_updated_at() CASCADE;

-- Step 3: Create shipment_tracking table with correct schema
CREATE TABLE shipment_tracking (
  id SERIAL PRIMARY KEY,
  tracking_number VARCHAR(100) NOT NULL,
  carrier VARCHAR(50) NOT NULL DEFAULT 'VRL',
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,  -- Link to customer_profiles
  tenant_id UUID,  -- Track which tenant this belongs to
  phone_number VARCHAR(50),
  customer_name VARCHAR(255),
  status VARCHAR(255),
  origin VARCHAR(255),
  destination VARCHAR(255),
  current_location VARCHAR(255),
  latest_update TEXT,
  tracking_data JSONB,
  last_checked TIMESTAMP DEFAULT NOW(),
  last_notified TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_shipment_tracking_number ON shipment_tracking(tracking_number);
CREATE INDEX idx_shipment_phone ON shipment_tracking(phone_number);
CREATE INDEX idx_shipment_tenant ON shipment_tracking(tenant_id);
CREATE INDEX idx_shipment_customer_profile ON shipment_tracking(customer_profile_id);
CREATE INDEX idx_shipment_active ON shipment_tracking(is_active) WHERE is_active = true;
CREATE INDEX idx_shipment_last_checked ON shipment_tracking(last_checked);

-- Step 5: Create tracking history table for detailed event logs
CREATE TABLE shipment_tracking_history (
  id SERIAL PRIMARY KEY,
  shipment_tracking_id INTEGER REFERENCES shipment_tracking(id) ON DELETE CASCADE,
  status VARCHAR(255),
  location VARCHAR(255),
  event_datetime TIMESTAMP,
  description TEXT,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tracking_history_shipment ON shipment_tracking_history(shipment_tracking_id);
CREATE INDEX idx_tracking_history_datetime ON shipment_tracking_history(event_datetime);

-- Step 6: Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shipment_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger
CREATE TRIGGER shipment_tracking_updated_at
  BEFORE UPDATE ON shipment_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_shipment_tracking_updated_at();

-- Step 8: Add comments for documentation
COMMENT ON TABLE shipment_tracking IS 'Tracks shipments from various carriers (VRL, etc.)';
COMMENT ON COLUMN shipment_tracking.tracking_number IS 'LR number or tracking ID from carrier';
COMMENT ON COLUMN shipment_tracking.carrier IS 'Shipping carrier name (VRL, DTDC, etc.)';
COMMENT ON COLUMN shipment_tracking.is_active IS 'False when shipment is delivered or cancelled';
COMMENT ON COLUMN shipment_tracking.tracking_data IS 'Full JSON response from scraper';
COMMENT ON COLUMN shipment_tracking.last_checked IS 'Last time we checked for updates from carrier';
COMMENT ON COLUMN shipment_tracking.last_notified IS 'Last time we sent a notification to customer';

COMMENT ON TABLE shipment_tracking_history IS 'Historical events for shipment tracking';
COMMENT ON COLUMN shipment_tracking_history.shipment_tracking_id IS 'Reference to main tracking record';
COMMENT ON COLUMN shipment_tracking_history.event_datetime IS 'When this event occurred (from carrier data)';
COMMENT ON COLUMN shipment_tracking_history.event_data IS 'Full JSON data for this event';

-- Verification: Show table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('shipment_tracking', 'shipment_tracking_history')
ORDER BY table_name, ordinal_position;

-- Show indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('shipment_tracking', 'shipment_tracking_history')
ORDER BY tablename, indexname;

-- Final confirmation
SELECT 'shipment_tracking table created successfully!' AS message,
       (SELECT COUNT(*) FROM shipment_tracking) AS record_count;
