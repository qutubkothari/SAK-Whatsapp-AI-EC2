-- =====================================================
-- SAFE PROACTIVE MESSAGING SYSTEM MIGRATION
-- This version safely adds only missing columns
-- =====================================================

-- =====================================================
-- PART 1: ADD MISSING COLUMNS TO PROACTIVE_MESSAGES
-- =====================================================

-- Check and add columns one by one with error handling
DO $$ 
BEGIN
  -- Add tenant_id if not exists
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'proactive_messages' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE proactive_messages ADD COLUMN tenant_id UUID;
      RAISE NOTICE 'Added column: tenant_id';
    ELSE
      RAISE NOTICE 'Column tenant_id already exists';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add tenant_id: %', SQLERRM;
  END;

  -- Add message_content if not exists
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'proactive_messages' AND column_name = 'message_content'
    ) THEN
      ALTER TABLE proactive_messages ADD COLUMN message_content TEXT;
      RAISE NOTICE 'Added column: message_content';
    ELSE
      RAISE NOTICE 'Column message_content already exists';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add message_content: %', SQLERRM;
  END;

  -- Add scheduled_for if not exists
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'proactive_messages' AND column_name = 'scheduled_for'
    ) THEN
      ALTER TABLE proactive_messages ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added column: scheduled_for';
    ELSE
      RAISE NOTICE 'Column scheduled_for already exists';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add scheduled_for: %', SQLERRM;
  END;

  -- Add status if not exists
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'proactive_messages' AND column_name = 'status'
    ) THEN
      ALTER TABLE proactive_messages ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
      RAISE NOTICE 'Added column: status';
    ELSE
      RAISE NOTICE 'Column status already exists';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add status: %', SQLERRM;
  END;

  -- Add trigger_data if not exists
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'proactive_messages' AND column_name = 'trigger_data'
    ) THEN
      ALTER TABLE proactive_messages ADD COLUMN trigger_data JSONB;
      RAISE NOTICE 'Added column: trigger_data';
    ELSE
      RAISE NOTICE 'Column trigger_data already exists';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add trigger_data: %', SQLERRM;
  END;
END $$;

-- Add foreign key constraint for tenant_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'proactive_messages_tenant_id_fkey'
  ) THEN
    ALTER TABLE proactive_messages 
    ADD CONSTRAINT proactive_messages_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key: tenant_id -> tenants(id)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add foreign key for tenant_id: %', SQLERRM;
END $$;

-- =====================================================
-- PART 2: SET DEFAULT VALUES FOR EXISTING RECORDS
-- =====================================================

-- Set default values for existing records that have NULL values
DO $$
DECLARE
  has_status BOOLEAN;
  has_scheduled_for BOOLEAN;
BEGIN
  -- Check if columns exist before updating
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'status'
  ) INTO has_status;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proactive_messages' AND column_name = 'scheduled_for'
  ) INTO has_scheduled_for;

  -- Update status only if column exists
  IF has_status THEN
    UPDATE proactive_messages 
    SET status = 'sent' 
    WHERE status IS NULL AND sent_at IS NOT NULL;

    UPDATE proactive_messages 
    SET status = 'pending' 
    WHERE status IS NULL;
    
    RAISE NOTICE 'Updated status values';
  END IF;

  -- Update scheduled_for only if column exists
  IF has_scheduled_for THEN
    UPDATE proactive_messages 
    SET scheduled_for = COALESCE(sent_at, created_at, NOW())
    WHERE scheduled_for IS NULL;
    
    RAISE NOTICE 'Updated scheduled_for values';
  END IF;

  RAISE NOTICE 'Completed default value updates';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error updating default values: %', SQLERRM;
END $$;

-- =====================================================
-- PART 3: CREATE INDEXES
-- =====================================================

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

  -- Create indexes only if columns exist
  BEGIN
    DROP INDEX IF EXISTS idx_proactive_messages_customer;
    CREATE INDEX idx_proactive_messages_customer ON proactive_messages(customer_profile_id, sent_at DESC);
    RAISE NOTICE 'Created index: idx_proactive_messages_customer';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create idx_proactive_messages_customer: %', SQLERRM;
  END;

  IF has_tenant_id THEN
    BEGIN
      DROP INDEX IF EXISTS idx_proactive_messages_tenant;
      CREATE INDEX idx_proactive_messages_tenant ON proactive_messages(tenant_id, message_type, sent_at DESC);
      RAISE NOTICE 'Created index: idx_proactive_messages_tenant';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create idx_proactive_messages_tenant: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Skipped idx_proactive_messages_tenant (tenant_id column does not exist)';
  END IF;

  BEGIN
    DROP INDEX IF EXISTS idx_proactive_messages_type;
    CREATE INDEX idx_proactive_messages_type ON proactive_messages(message_type, sent_at DESC);
    RAISE NOTICE 'Created index: idx_proactive_messages_type';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create idx_proactive_messages_type: %', SQLERRM;
  END;

  IF has_status AND has_scheduled_for THEN
    BEGIN
      DROP INDEX IF EXISTS idx_proactive_messages_status;
      CREATE INDEX idx_proactive_messages_status ON proactive_messages(status, scheduled_for);
      RAISE NOTICE 'Created index: idx_proactive_messages_status';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create idx_proactive_messages_status: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Skipped idx_proactive_messages_status (status or scheduled_for column does not exist)';
  END IF;
END $$;

-- =====================================================
-- PART 4: CUSTOMER PROFILES ENHANCEMENTS
-- =====================================================

-- Add last_order_date to customer_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_profiles' AND column_name = 'last_order_date'
  ) THEN
    ALTER TABLE customer_profiles ADD COLUMN last_order_date TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added column: customer_profiles.last_order_date';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add last_order_date: %', SQLERRM;
END $$;

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
-- PART 5: CUSTOMER MESSAGING PREFERENCES TABLE
-- =====================================================

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
-- PART 6: HELPER FUNCTIONS
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
-- PART 7: COMMENTS
-- =====================================================

COMMENT ON TABLE proactive_messages IS 'Tracks scheduled and sent proactive messages (reorder reminders, abandoned carts, etc.)';
COMMENT ON TABLE customer_messaging_preferences IS 'Tracks customer preferences for proactive messaging and rate limiting';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration completed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify columns:';
  RAISE NOTICE '   SELECT column_name FROM information_schema.columns WHERE table_name = ''proactive_messages'';';
  RAISE NOTICE '';
  RAISE NOTICE '2. Check your app logs for proactive messaging:';
  RAISE NOTICE '   gcloud app logs read --service=default --limit=100 | grep PROACTIVE';
  RAISE NOTICE '';
END $$;
