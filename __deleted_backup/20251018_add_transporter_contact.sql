-- Add only the missing column: default_transporter_contact
-- The other shipping columns already exist in customer_profiles

DO $$ 
BEGIN
    -- Add default_transporter_contact if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_profiles' 
                   AND column_name = 'default_transporter_contact') THEN
        ALTER TABLE customer_profiles 
        ADD COLUMN default_transporter_contact CHARACTER VARYING(20);
        RAISE NOTICE 'Added default_transporter_contact column';
    ELSE
        RAISE NOTICE 'default_transporter_contact column already exists';
    END IF;
END $$;
