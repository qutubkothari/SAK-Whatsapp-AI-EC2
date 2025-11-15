-- =====================================================
-- SHIPPING & TRANSPORTER DETAILS MIGRATION
-- Adds shipping address and transporter fields
-- =====================================================

-- Add shipping columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_pincode VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_landmark TEXT;

-- Add transporter columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transporter_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transporter_contact VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transporter_vehicle_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Add status tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_details_collected BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_details_collected_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS idx_orders_shipping_collected ON orders(tenant_id, shipping_details_collected);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(tenant_id, preferred_delivery_date);

-- Add columns to customer_profiles for default shipping addresses
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS default_shipping_address TEXT;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS default_shipping_city VARCHAR(100);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS default_shipping_state VARCHAR(100);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS default_shipping_pincode VARCHAR(20);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS default_transporter_name VARCHAR(255);

-- Comments
COMMENT ON COLUMN orders.shipping_address IS 'Complete shipping address for delivery';
COMMENT ON COLUMN orders.transporter_name IS 'Name of transport company or delivery partner';
COMMENT ON COLUMN orders.transporter_contact IS 'Transporter contact number';
COMMENT ON COLUMN orders.shipping_details_collected IS 'Flag to track if shipping info was captured';

-- Verify
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SHIPPING DETAILS MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Added columns to orders table:';
  RAISE NOTICE '  - shipping_address, city, state, pincode, landmark';
  RAISE NOTICE '  - transporter_name, contact, vehicle_number';
  RAISE NOTICE '  - preferred_delivery_date, special_instructions';
  RAISE NOTICE '  - shipping_details_collected flag';
  RAISE NOTICE '';
  RAISE NOTICE 'Added default shipping columns to customer_profiles';
  RAISE NOTICE '';
END $$;
