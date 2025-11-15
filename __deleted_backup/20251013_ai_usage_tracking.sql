-- Track AI usage for cost monitoring
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  usage_type VARCHAR(50) NOT NULL, -- 'response_generation', 'order_extraction', etc.
  cost_usd DECIMAL(10, 6) NOT NULL,
  tokens_used INTEGER,
  model VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_ai_usage_tenant ON ai_usage_tracking(tenant_id, timestamp DESC);
CREATE INDEX idx_ai_usage_date ON ai_usage_tracking(DATE(timestamp), tenant_id);

-- Create view for daily costs
CREATE OR REPLACE VIEW ai_daily_costs AS
SELECT 
  tenant_id,
  DATE(timestamp) as date,
  COUNT(*) as total_calls,
  SUM(cost_usd) as total_cost_usd,
  SUM(cost_usd) * 85 as total_cost_inr,
  AVG(cost_usd) as avg_cost_per_call
FROM ai_usage_tracking
GROUP BY tenant_id, DATE(timestamp)
ORDER BY date DESC;
