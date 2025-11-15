-- Create shipment_tracking table for VRL and other carriers
CREATE TABLE IF NOT EXISTS shipment_tracking (
  id SERIAL PRIMARY KEY,
  tracking_number VARCHAR(100) NOT NULL,
  carrier VARCHAR(50) NOT NULL DEFAULT 'VRL',
  customer_id INTEGER REFERENCES customers(id),
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_number ON shipment_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipment_phone ON shipment_tracking(phone_number);
CREATE INDEX IF NOT EXISTS idx_shipment_active ON shipment_tracking(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shipment_last_checked ON shipment_tracking(last_checked);

-- Create tracking history table for detailed event logs
CREATE TABLE IF NOT EXISTS shipment_tracking_history (
  id SERIAL PRIMARY KEY,
  shipment_tracking_id INTEGER REFERENCES shipment_tracking(id) ON DELETE CASCADE,
  status VARCHAR(255),
  location VARCHAR(255),
  event_datetime TIMESTAMP,
  description TEXT,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_history_shipment ON shipment_tracking_history(shipment_tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_datetime ON shipment_tracking_history(event_datetime);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shipment_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipment_tracking_updated_at
  BEFORE UPDATE ON shipment_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_shipment_tracking_updated_at();

-- Comments for documentation
COMMENT ON TABLE shipment_tracking IS 'Tracks shipments from various carriers (VRL, etc.)';
COMMENT ON COLUMN shipment_tracking.tracking_number IS 'LR number or tracking ID from carrier';
COMMENT ON COLUMN shipment_tracking.carrier IS 'Shipping carrier name (VRL, DTDC, etc.)';
COMMENT ON COLUMN shipment_tracking.is_active IS 'False when shipment is delivered or cancelled';
COMMENT ON COLUMN shipment_tracking.tracking_data IS 'Full JSON response from scraper';
