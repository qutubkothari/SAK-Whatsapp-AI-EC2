-- Table to track customer messaging preferences and limits
CREATE TABLE IF NOT EXISTS customer_messaging_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE UNIQUE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Preferences
  proactive_reminders_enabled BOOLEAN DEFAULT TRUE,
  abandoned_cart_reminders_enabled BOOLEAN DEFAULT TRUE,
  special_offers_enabled BOOLEAN DEFAULT TRUE,
  
  -- Rate limiting
  max_messages_per_week INTEGER DEFAULT 3,
  messages_sent_this_week INTEGER DEFAULT 0,
  last_message_sent_at TIMESTAMP WITH TIME ZONE,
  week_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_messaging_prefs_customer ON customer_messaging_preferences(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_messaging_prefs_tenant ON customer_messaging_preferences(tenant_id);

-- Function to reset weekly message count
CREATE OR REPLACE FUNCTION reset_weekly_message_counts()
RETURNS void AS $$
BEGIN
  UPDATE customer_messaging_preferences
  SET 
    messages_sent_this_week = 0,
    week_reset_date = NOW()
  WHERE week_reset_date < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_messaging_prefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_messaging_prefs_timestamp ON customer_messaging_preferences;
CREATE TRIGGER trigger_update_messaging_prefs_timestamp
BEFORE UPDATE ON customer_messaging_preferences
FOR EACH ROW
EXECUTE FUNCTION update_messaging_prefs_timestamp();

-- Insert comment
COMMENT ON TABLE customer_messaging_preferences IS 'Tracks customer preferences for proactive messaging and rate limiting';
