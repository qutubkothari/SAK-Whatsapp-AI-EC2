-- =====================================================
-- ULTRA SIMPLE FIX - Just add the damn columns
-- =====================================================

-- Step 1: Add columns (no references, no constraints, just add them)
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS message_content TEXT;
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS trigger_data JSONB;

-- Step 2: Set defaults for new columns
UPDATE proactive_messages SET status = 'sent' WHERE status IS NULL AND sent_at IS NOT NULL;
UPDATE proactive_messages SET status = 'pending' WHERE status IS NULL;
UPDATE proactive_messages SET scheduled_for = COALESCE(sent_at, created_at, NOW()) WHERE scheduled_for IS NULL;

-- Step 3: Add foreign key (after column exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proactive_messages_tenant_id_fkey'
  ) THEN
    ALTER TABLE proactive_messages 
    ADD CONSTRAINT proactive_messages_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Create indexes
DROP INDEX IF EXISTS idx_proactive_messages_customer;
CREATE INDEX idx_proactive_messages_customer ON proactive_messages(customer_profile_id, sent_at DESC);

DROP INDEX IF EXISTS idx_proactive_messages_tenant;
CREATE INDEX idx_proactive_messages_tenant ON proactive_messages(tenant_id, message_type, sent_at DESC);

DROP INDEX IF EXISTS idx_proactive_messages_type;
CREATE INDEX idx_proactive_messages_type ON proactive_messages(message_type, sent_at DESC);

DROP INDEX IF EXISTS idx_proactive_messages_status;
CREATE INDEX idx_proactive_messages_status ON proactive_messages(status, scheduled_for);

-- Step 5: Other tables
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS customer_messaging_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE UNIQUE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  proactive_reminders_enabled BOOLEAN DEFAULT TRUE,
  abandoned_cart_reminders_enabled BOOLEAN DEFAULT TRUE,
  special_offers_enabled BOOLEAN DEFAULT TRUE,
  max_messages_per_week INTEGER DEFAULT 3,
  messages_sent_this_week INTEGER DEFAULT 0,
  last_message_sent_at TIMESTAMP WITH TIME ZONE,
  week_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messaging_prefs_customer ON customer_messaging_preferences(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_messaging_prefs_tenant ON customer_messaging_preferences(tenant_id);

-- Step 6: Triggers
CREATE OR REPLACE FUNCTION update_customer_last_order_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customer_profiles SET last_order_date = NEW.created_at WHERE id = NEW.customer_profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_order_date ON orders;
CREATE TRIGGER trigger_update_last_order_date AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION update_customer_last_order_date();

CREATE OR REPLACE FUNCTION update_messaging_prefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_messaging_prefs_timestamp ON customer_messaging_preferences;
CREATE TRIGGER trigger_update_messaging_prefs_timestamp BEFORE UPDATE ON customer_messaging_preferences FOR EACH ROW EXECUTE FUNCTION update_messaging_prefs_timestamp();

CREATE OR REPLACE FUNCTION reset_weekly_message_counts()
RETURNS void AS $$
BEGIN
  UPDATE customer_messaging_preferences SET messages_sent_this_week = 0, week_reset_date = NOW() WHERE week_reset_date < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

SELECT 'DONE! ✅' as status;
