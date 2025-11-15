-- =====================================================
-- COMPLETE PROACTIVE MESSAGING SYSTEM MIGRATION
-- Run this file to set up reorder reminders
-- =====================================================

-- =====================================================
-- PART 1: PROACTIVE MESSAGES TABLE
-- =====================================================

-- Table to track proactive messages sent to customers
CREATE TABLE IF NOT EXISTS proactive_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL,
  customer_responded BOOLEAN DEFAULT FALSE,
  response_received_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  days_since_last_order INTEGER,
  expected_reorder_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add tenant_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE proactive_messages ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;

  -- Add message_content if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'message_content'
  ) THEN
    ALTER TABLE proactive_messages ADD COLUMN message_content TEXT;
  END IF;

  -- Add scheduled_for if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'scheduled_for'
  ) THEN
    ALTER TABLE proactive_messages ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'status'
  ) THEN
    ALTER TABLE proactive_messages ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  END IF;

  -- Add trigger_data if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'trigger_data'
  ) THEN
    ALTER TABLE proactive_messages ADD COLUMN trigger_data JSONB;
  END IF;
END $$;

-- Set default values for existing records that have NULL values
UPDATE proactive_messages 
SET status = 'sent' 
WHERE status IS NULL AND sent_at IS NOT NULL;

UPDATE proactive_messages 
SET status = 'pending' 
WHERE status IS NULL;

UPDATE proactive_messages 
SET scheduled_for = COALESCE(sent_at, created_at, NOW())
WHERE scheduled_for IS NULL;

-- Index for efficient querying (create AFTER columns exist)
DROP INDEX IF EXISTS idx_proactive_messages_customer;
CREATE INDEX idx_proactive_messages_customer ON proactive_messages(customer_profile_id, sent_at DESC);

DROP INDEX IF EXISTS idx_proactive_messages_tenant;
CREATE INDEX idx_proactive_messages_tenant ON proactive_messages(tenant_id, message_type, sent_at DESC);

DROP INDEX IF EXISTS idx_proactive_messages_type;
CREATE INDEX idx_proactive_messages_type ON proactive_messages(message_type, sent_at DESC);

DROP INDEX IF EXISTS idx_proactive_messages_status;
CREATE INDEX idx_proactive_messages_status ON proactive_messages(status, scheduled_for);

-- =====================================================
-- PART 2: CUSTOMER PROFILES ENHANCEMENTS
-- =====================================================

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

-- =====================================================
-- PART 3: CUSTOMER MESSAGING PREFERENCES
-- =====================================================

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

-- =====================================================
-- PART 4: HELPER FUNCTIONS
-- =====================================================

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

-- Add trigger to update updated_at on preferences
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

-- =====================================================
-- PART 5: COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON TABLE proactive_messages IS 'Tracks scheduled and sent proactive messages (reorder reminders, abandoned carts, etc.)';
COMMENT ON TABLE customer_messaging_preferences IS 'Tracks customer preferences for proactive messaging and rate limiting';

-- =====================================================
-- VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Verify tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('proactive_messages', 'customer_messaging_preferences');

-- Verify columns exist:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'proactive_messages';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customer_messaging_preferences';

-- Check if customer_profiles has required columns:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'customer_profiles' AND column_name IN ('zoho_customer_id', 'last_order_date');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Proactive Messaging System migration completed successfully!';
  RAISE NOTICE '📊 Tables created: proactive_messages, customer_messaging_preferences';
  RAISE NOTICE '🔧 Triggers created: update_customer_last_order_date, update_messaging_prefs_timestamp';
  RAISE NOTICE '⚙️ Functions created: reset_weekly_message_counts';
END $$;
