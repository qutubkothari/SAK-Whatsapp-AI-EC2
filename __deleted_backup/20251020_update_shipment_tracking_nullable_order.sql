-- Update shipment_tracking table to allow null order_ids
-- This allows tracking shipments that aren't associated with orders yet

-- Remove the NOT NULL constraint from order_id
ALTER TABLE shipment_tracking ALTER COLUMN order_id DROP NOT NULL;

-- Drop the unique constraint on order_id first (this will also drop the underlying index)
ALTER TABLE shipment_tracking DROP CONSTRAINT IF EXISTS shipment_tracking_order_id_key;

-- Add a partial unique index that only applies to non-null order_ids
-- This ensures one tracking record per order, but allows multiple null order_ids
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipment_tracking_unique_order
ON shipment_tracking(order_id)
WHERE order_id IS NOT NULL;

COMMENT ON TABLE shipment_tracking IS 'Tracks shipment status for orders from various logistics providers. order_id can be null for shipments not yet associated with orders.';