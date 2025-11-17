-- Add humanization columns to bulk_schedules
ALTER TABLE bulk_schedules
ADD COLUMN IF NOT EXISTS greeting_template TEXT,
ADD COLUMN IF NOT EXISTS random_delay_ms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS humanized BOOLEAN DEFAULT FALSE;

-- Create greeting templates table (tenant_id NULL means global/shared templates)
CREATE TABLE IF NOT EXISTS greeting_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    template_text TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    tone VARCHAR(20) DEFAULT 'friendly',
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_greeting_templates_tenant ON greeting_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_greeting_templates_active ON greeting_templates(tenant_id, is_active);

-- Insert default global greeting templates (tenant_id is NULL for shared templates)
INSERT INTO greeting_templates (tenant_id, template_text, language, tone) VALUES
(NULL, 'Hi {name}! 👋', 'en', 'friendly'),
(NULL, 'Hello {name}! 😊', 'en', 'friendly'),
(NULL, 'Hey {name}!', 'en', 'casual'),
(NULL, 'Good day {name}!', 'en', 'formal'),
(NULL, 'Greetings {name}!', 'en', 'formal'),
(NULL, 'Hi there {name}!', 'en', 'friendly'),
(NULL, 'Hello {name}, hope you''re doing well!', 'en', 'friendly'),
(NULL, 'Hey {name}, how are you?', 'en', 'casual'),
(NULL, 'Hi {name}, hope this message finds you well!', 'en', 'formal'),
(NULL, 'Hello dear {name}!', 'en', 'warm'),
(NULL, 'Hi {name}! 🌟', 'en', 'friendly'),
(NULL, 'Hey there {name}!', 'en', 'casual'),
(NULL, 'Good morning/afternoon {name}!', 'en', 'friendly'),
(NULL, 'Hello {name}, trust you''re having a great day!', 'en', 'formal'),
(NULL, 'Hi {name}! Great to connect with you!', 'en', 'friendly'),
(NULL, 'Hey {name}! 😄', 'en', 'casual'),
(NULL, 'Hello {name}! ✨', 'en', 'friendly'),
(NULL, 'Hi {name}, it''s great to reach out to you!', 'en', 'friendly'),
(NULL, 'Greetings {name}, hope all is well!', 'en', 'formal'),
(NULL, 'Hey {name}! Hope you''re having an amazing day!', 'en', 'friendly')
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE greeting_templates IS 'Random greeting templates to humanize broadcasts. tenant_id NULL = global/shared templates available to all tenants';
COMMENT ON COLUMN greeting_templates.tenant_id IS 'NULL for global templates, or specific tenant ID for custom templates';
COMMENT ON COLUMN bulk_schedules.greeting_template IS 'Which greeting was used for this message';
COMMENT ON COLUMN bulk_schedules.random_delay_ms IS 'Random delay added to make timing more natural';
COMMENT ON COLUMN bulk_schedules.humanized IS 'Whether humanization was applied';
