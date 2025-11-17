-- Create table to track daily message limits per tenant
CREATE TABLE IF NOT EXISTS daily_message_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One record per tenant per day
    UNIQUE(tenant_id, date)
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_daily_message_stats_tenant_date ON daily_message_stats(tenant_id, date);

-- Function to increment daily message count
CREATE OR REPLACE FUNCTION increment_daily_message_count(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    INSERT INTO daily_message_stats (tenant_id, date, message_count, last_updated)
    VALUES (p_tenant_id, CURRENT_DATE, 1, NOW())
    ON CONFLICT (tenant_id, date)
    DO UPDATE SET 
        message_count = daily_message_stats.message_count + 1,
        last_updated = NOW()
    RETURNING message_count INTO v_count;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get today's message count
CREATE OR REPLACE FUNCTION get_daily_message_count(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COALESCE(message_count, 0) INTO v_count
    FROM daily_message_stats
    WHERE tenant_id = p_tenant_id AND date = CURRENT_DATE;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;
