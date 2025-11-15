-- Migration: Add customer_profile_id foreign key to orders table
-- This enables proper joining with customer_profiles for Zoho integration

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_profile_id'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL;
        
        -- Add index for better query performance
        CREATE INDEX idx_orders_customer_profile ON orders(customer_profile_id);
        
        -- Add comment
        COMMENT ON COLUMN orders.customer_profile_id IS 'Foreign key to customer_profiles for Zoho integration';
        
        RAISE NOTICE 'Added customer_profile_id column to orders table';
    ELSE
        RAISE NOTICE 'customer_profile_id column already exists';
    END IF;
END $$;

-- Backfill existing orders with customer_profile_id based on phone number
-- This will link historical orders to their customer profiles
UPDATE orders o
SET customer_profile_id = cp.id
FROM conversations c
JOIN customer_profiles cp ON cp.phone = c.end_user_phone AND cp.tenant_id = c.tenant_id
WHERE o.conversation_id = c.id
AND o.customer_profile_id IS NULL;
