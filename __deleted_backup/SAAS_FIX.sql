-- =====================================================
-- PROPER SAAS FIX - Add tenant_id correctly
-- =====================================================

-- STEP 1: Add tenant_id as nullable first (so we can populate it)
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- STEP 2: Populate tenant_id from customer_profiles if there are existing records
DO $$
DECLARE
  has_tenant_id BOOLEAN;
BEGIN
  -- Check if tenant_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'tenant_id'
  ) INTO has_tenant_id;
  
  IF has_tenant_id THEN
    -- Update tenant_id from related customer_profile
    UPDATE proactive_messages pm
    SET tenant_id = cp.tenant_id
    FROM customer_profiles cp
    WHERE pm.customer_profile_id = cp.id
      AND pm.tenant_id IS NULL;
      
    RAISE NOTICE 'Updated tenant_id from customer_profiles';
  ELSE
    RAISE NOTICE 'tenant_id column does not exist, skipping population';
  END IF;
END $$;

-- STEP 3: Now make it NOT NULL (after populating)
-- Only if all records have tenant_id
DO $$
DECLARE
  null_count INTEGER;
  has_tenant_id BOOLEAN;
BEGIN
  -- Check if tenant_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'tenant_id'
  ) INTO has_tenant_id;
  
  IF has_tenant_id THEN
    SELECT COUNT(*) INTO null_count FROM proactive_messages WHERE tenant_id IS NULL;
    
    IF null_count = 0 THEN
      ALTER TABLE proactive_messages ALTER COLUMN tenant_id SET NOT NULL;
      RAISE NOTICE 'Set tenant_id to NOT NULL';
    ELSE
      RAISE NOTICE 'WARNING: % records still have NULL tenant_id - NOT setting to NOT NULL', null_count;
    END IF;
  ELSE
    RAISE NOTICE 'tenant_id column does not exist, skipping NOT NULL constraint';
  END IF;
END $$;

-- STEP 4: Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proactive_messages_tenant_id_fkey'
  ) THEN
    ALTER TABLE proactive_messages 
    ADD CONSTRAINT proactive_messages_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key: tenant_id -> tenants(id)';
  ELSE
    RAISE NOTICE 'Foreign key already exists';
  END IF;
END $$;

-- STEP 5: Add other missing columns
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS message_content TEXT;
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE proactive_messages ADD COLUMN IF NOT EXISTS trigger_data JSONB;

-- STEP 6: Set defaults for new columns
DO $$
DECLARE
  has_status BOOLEAN;
  has_scheduled_for BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'status'
  ) INTO has_status;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'scheduled_for'
  ) INTO has_scheduled_for;
  
  -- Update only if columns exist
  IF has_status THEN
    UPDATE proactive_messages SET status = 'sent' WHERE status IS NULL AND sent_at IS NOT NULL;
    UPDATE proactive_messages SET status = 'pending' WHERE status IS NULL;
    RAISE NOTICE 'Updated status defaults';
  END IF;
  
  IF has_scheduled_for THEN
    UPDATE proactive_messages SET scheduled_for = COALESCE(sent_at, created_at, NOW()) WHERE scheduled_for IS NULL;
    RAISE NOTICE 'Updated scheduled_for defaults';
  END IF;
END $$;

-- STEP 7: Create indexes (CRITICAL for SaaS multi-tenancy performance)
-- Always include tenant_id in indexes for tenant isolation
DO $$
DECLARE
  has_tenant_id BOOLEAN;
  has_status BOOLEAN;
  has_scheduled_for BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'tenant_id'
  ) INTO has_tenant_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'status'
  ) INTO has_status;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'scheduled_for'
  ) INTO has_scheduled_for;
  
  -- Create indexes based on available columns
  IF has_tenant_id THEN
    DROP INDEX IF EXISTS idx_proactive_messages_tenant_customer;
    CREATE INDEX idx_proactive_messages_tenant_customer ON proactive_messages(tenant_id, customer_profile_id, sent_at DESC);
    RAISE NOTICE 'Created index: idx_proactive_messages_tenant_customer';
    
    DROP INDEX IF EXISTS idx_proactive_messages_tenant_type;
    CREATE INDEX idx_proactive_messages_tenant_type ON proactive_messages(tenant_id, message_type, sent_at DESC);
    RAISE NOTICE 'Created index: idx_proactive_messages_tenant_type';
    
    IF has_status AND has_scheduled_for THEN
      DROP INDEX IF EXISTS idx_proactive_messages_tenant_status;
      CREATE INDEX idx_proactive_messages_tenant_status ON proactive_messages(tenant_id, status, scheduled_for);
      RAISE NOTICE 'Created index: idx_proactive_messages_tenant_status';
    END IF;
  END IF;
  
  -- Legacy indexes
  DROP INDEX IF EXISTS idx_proactive_messages_customer;
  CREATE INDEX idx_proactive_messages_customer ON proactive_messages(customer_profile_id, sent_at DESC);
  RAISE NOTICE 'Created index: idx_proactive_messages_customer';
  
  DROP INDEX IF EXISTS idx_proactive_messages_type;
  CREATE INDEX idx_proactive_messages_type ON proactive_messages(message_type, sent_at DESC);
  RAISE NOTICE 'Created index: idx_proactive_messages_type';
END $$;

-- STEP 8: Other tables
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS customer_messaging_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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

-- Multi-tenant indexes for customer_messaging_preferences
CREATE INDEX IF NOT EXISTS idx_messaging_prefs_tenant_customer ON customer_messaging_preferences(tenant_id, customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_messaging_prefs_tenant ON customer_messaging_preferences(tenant_id);

-- STEP 9: Triggers
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

-- STEP 10: Verify
DO $$
DECLARE
  col_exists BOOLEAN;
  is_not_null BOOLEAN;
BEGIN
  -- Check if tenant_id exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'tenant_id'
  ) INTO col_exists;
  
  -- Check if it's NOT NULL
  SELECT is_nullable = 'NO' INTO is_not_null
  FROM information_schema.columns 
  WHERE table_name = 'proactive_messages' AND column_name = 'tenant_id';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'tenant_id exists: %', col_exists;
  RAISE NOTICE 'tenant_id is NOT NULL: %', COALESCE(is_not_null, false);
  RAISE NOTICE '';
  RAISE NOTICE 'Run this to verify:';
  RAISE NOTICE 'SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = ''proactive_messages'';';
  RAISE NOTICE '';
END $$;
