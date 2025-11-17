-- Track per-recipient delivery status for each broadcast campaign
CREATE TABLE IF NOT EXISTS broadcast_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- sent, failed, pending
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    UNIQUE(campaign_id, phone)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_campaign_id ON broadcast_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_phone ON broadcast_recipients(phone);

-- Usage:
-- When sending a campaign, insert all recipients as 'pending'.
-- Update status to 'sent' or 'failed' as each message is processed.
-- To resume, select recipients with status 'pending' and continue sending only to those.
