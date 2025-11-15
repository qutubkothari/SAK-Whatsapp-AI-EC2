-- Database Migration: Create uploaded_images table
-- Run this SQL in your Supabase SQL editor

CREATE TABLE uploaded_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    end_user_phone VARCHAR(20) NOT NULL,
    original_url TEXT NOT NULL,
    gcs_url TEXT,
    category VARCHAR(50) DEFAULT 'general_image',
    analysis_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_uploaded_images_tenant_phone ON uploaded_images(tenant_id, end_user_phone);
CREATE INDEX idx_uploaded_images_category ON uploaded_images(tenant_id, category);
CREATE INDEX idx_uploaded_images_created_at ON uploaded_images(created_at);

-- Optional: Add RLS (Row Level Security) policies if needed
-- ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY;

-- Example policy for tenant isolation (uncomment if using RLS):
-- CREATE POLICY "Users can access their tenant's uploaded images" ON uploaded_images
--     FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Add helpful comments
COMMENT ON TABLE uploaded_images IS 'Stores metadata for customer uploaded images with GCS URLs';
COMMENT ON COLUMN uploaded_images.category IS 'Image category: invoice_detected, delivery_receipt, purchase_order, general_image';
COMMENT ON COLUMN uploaded_images.analysis_result IS 'JSON object containing smart analysis results';
COMMENT ON COLUMN uploaded_images.gcs_url IS 'Google Cloud Storage permanent URL for the image';
