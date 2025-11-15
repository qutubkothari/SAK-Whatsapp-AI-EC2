-- Table to track proactive messages sent to customers
CREATE TABLE IF NOT EXISTS proactive_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL, -- 'reorder_reminder', 'abandoned_cart', 'special_offer'
  message_content TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  trigger_data JSONB,
  days_since_last_order INTEGER,
  expected_reorder_date TIMESTAMP WITH TIME ZONE,
  customer_responded BOOLEAN DEFAULT FALSE,
  response_received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_proactive_messages_customer ON proactive_messages(customer_profile_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_proactive_messages_tenant ON proactive_messages(tenant_id, message_type, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_proactive_messages_type ON proactive_messages(message_type, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_proactive_messages_status ON proactive_messages(status, scheduled_for);

-- Add last_order_date to customer_profiles if not exists
ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP WITH TIME ZONE;

-- Create trigger to update last_order_date automatically
CREATE OR REPLACE FUNCTION update_customer_last_order_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customer_profiles
  SET last_order_date = NEW.created_at
  WHERE id = NEW.customer_profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_order_date ON orders;
CREATE TRIGGER trigger_update_last_order_date
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_last_order_date();
