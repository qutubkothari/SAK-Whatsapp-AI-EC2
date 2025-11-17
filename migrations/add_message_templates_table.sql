-- Create message templates table for saved broadcast messages
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text', -- text, image
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    
    -- Ensure unique template names per tenant
    UNIQUE(tenant_id, template_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_message_templates_tenant_id ON message_templates(tenant_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_message_templates_updated_at();
