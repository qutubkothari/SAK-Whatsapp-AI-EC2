-- =====================================================
-- ADD SHIPPING AND TRANSPORTER FIELDS TO ORDERS
-- =====================================================

-- Add shipping address and transporter details to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transporter_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transporter_contact VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_collected_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying orders pending shipping info
CREATE INDEX IF NOT EXISTS idx_orders_shipping_pending 
ON orders(tenant_id, created_at DESC) 
WHERE shipping_address IS NULL;

-- Add comments
COMMENT ON COLUMN orders.shipping_address IS 'Full shipping address provided by customer';
COMMENT ON COLUMN orders.transporter_name IS 'Transporter/courier service name';
COMMENT ON COLUMN orders.transporter_contact IS 'Transporter contact number';
COMMENT ON COLUMN orders.shipping_collected_at IS 'Timestamp when shipping info was collected';

-- Verify
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('shipping_address', 'transporter_name', 'transporter_contact', 'shipping_collected_at');

SELECT '✅ Shipping fields added to orders table' as status;
