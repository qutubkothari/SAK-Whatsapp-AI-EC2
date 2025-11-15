-- Create contact_groups table for saving broadcast recipient groups
CREATE TABLE IF NOT EXISTS contact_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    group_name VARCHAR(255) NOT NULL,
    contacts JSONB NOT NULL,
    contact_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique group names per tenant
    UNIQUE(tenant_id, group_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_groups_tenant_id ON contact_groups(tenant_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_contact_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_groups_updated_at
    BEFORE UPDATE ON contact_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_groups_updated_at();
