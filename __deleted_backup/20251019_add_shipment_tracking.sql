-- Create shipment_tracking table
CREATE TABLE IF NOT EXISTS shipment_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    lr_number VARCHAR(50) NOT NULL,
    transporter_name VARCHAR(100),
    tracking_data JSONB,
    last_status VARCHAR(255),
    current_location VARCHAR(255),
    destination VARCHAR(255),
    booking_date TIMESTAMP,
    expected_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    last_checked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on lr_number for quick lookups
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_lr_number ON shipment_tracking(lr_number);

-- Create index on order_id
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_order_id ON shipment_tracking(order_id);

-- Add shipping slip columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS lr_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS shipping_slip_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_slip_uploaded_at TIMESTAMP;

-- Create index on lr_number in orders
CREATE INDEX IF NOT EXISTS idx_orders_lr_number ON orders(lr_number) WHERE lr_number IS NOT NULL;

COMMENT ON TABLE shipment_tracking IS 'Tracks shipment status for orders from various logistics providers';
COMMENT ON COLUMN shipment_tracking.lr_number IS 'LR/Consignment/Docket number from transporter';
COMMENT ON COLUMN shipment_tracking.tracking_data IS 'Complete tracking information from logistics provider API';
COMMENT ON COLUMN orders.shipping_slip_url IS 'URL of uploaded shipping slip/LR copy image';
