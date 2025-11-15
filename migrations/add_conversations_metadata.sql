-- Add metadata column to conversations table if it doesn't exist
-- This column stores additional conversation context like pending_shipping_order_id

DO $$ 
BEGIN
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added metadata column to conversations table';
    ELSE
        RAISE NOTICE 'metadata column already exists in conversations table';
    END IF;
END $$;

-- Update existing rows to have empty JSON object if null
UPDATE conversations 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;

COMMENT ON COLUMN conversations.metadata IS 'Stores additional conversation context like pending_shipping_order_id, registration state, etc.';
