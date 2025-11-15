-- Add shipping and transporter fields to customer_profiles table
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
    -- Add default_shipping_address if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_profiles' 
                   AND column_name = 'default_shipping_address') THEN
        ALTER TABLE customer_profiles 
        ADD COLUMN default_shipping_address TEXT;
        RAISE NOTICE 'Added default_shipping_address column';
    ELSE
        RAISE NOTICE 'default_shipping_address column already exists';
    END IF;

    -- Add default_shipping_city if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_profiles' 
                   AND column_name = 'default_shipping_city') THEN
        ALTER TABLE customer_profiles 
        ADD COLUMN default_shipping_city TEXT;
        RAISE NOTICE 'Added default_shipping_city column';
    ELSE
        RAISE NOTICE 'default_shipping_city column already exists';
    END IF;

    -- Add default_shipping_state if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_profiles' 
                   AND column_name = 'default_shipping_state') THEN
        ALTER TABLE customer_profiles 
        ADD COLUMN default_shipping_state TEXT;
        RAISE NOTICE 'Added default_shipping_state column';
    ELSE
        RAISE NOTICE 'default_shipping_state column already exists';
    END IF;

    -- Add default_shipping_pincode if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_profiles' 
                   AND column_name = 'default_shipping_pincode') THEN
        ALTER TABLE customer_profiles 
        ADD COLUMN default_shipping_pincode TEXT;
        RAISE NOTICE 'Added default_shipping_pincode column';
    ELSE
        RAISE NOTICE 'default_shipping_pincode column already exists';
    END IF;

    -- Add default_transporter_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_profiles' 
                   AND column_name = 'default_transporter_name') THEN
        ALTER TABLE customer_profiles 
        ADD COLUMN default_transporter_name TEXT;
        RAISE NOTICE 'Added default_transporter_name column';
    ELSE
        RAISE NOTICE 'default_transporter_name column already exists';
    END IF;

    -- Add default_transporter_contact if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_profiles' 
                   AND column_name = 'default_transporter_contact') THEN
        ALTER TABLE customer_profiles 
        ADD COLUMN default_transporter_contact TEXT;
        RAISE NOTICE 'Added default_transporter_contact column';
    ELSE
        RAISE NOTICE 'default_transporter_contact column already exists';
    END IF;
END $$;

-- Optionally: Backfill existing customer profiles with their most recent shipping info
-- (This is optional since new orders will save shipping info going forward)
/*
UPDATE customer_profiles cp
SET 
    default_shipping_address = si.address,
    default_shipping_city = si.city,
    default_shipping_state = si.state,
    default_shipping_pincode = si.pincode,
    default_transporter_name = si.transporter_name,
    default_transporter_contact = si.transporter_contact
FROM (
    SELECT DISTINCT ON (o.customer_profile_id)
        o.customer_profile_id,
        si.address,
        si.city,
        si.state,
        si.pincode,
        si.transporter_name,
        si.transporter_contact
    FROM orders o
    INNER JOIN shipping_info si ON si.order_id = o.id
    WHERE o.customer_profile_id IS NOT NULL
    ORDER BY o.customer_profile_id, o.created_at DESC
) si
WHERE cp.id = si.customer_profile_id
  AND cp.default_shipping_address IS NULL;
*/
