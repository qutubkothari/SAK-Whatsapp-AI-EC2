-- =============================================
-- Migration: Add discount_negotiations table
-- Tracks AI-powered discount negotiations
-- =============================================

-- Create discount_negotiations table
CREATE TABLE IF NOT EXISTS discount_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20) NOT NULL,
    cart_id UUID REFERENCES carts(id) ON DELETE SET NULL,
    
    -- Customer input
    customer_message TEXT NOT NULL,
    
    -- AI analysis results
    ai_intent_result JSONB, -- Full AI intent detection result
    ai_extracted_details JSONB, -- Extracted products/quantities/discounts
    
    -- Negotiation details
    offered_discount DECIMAL(5,2), -- What we offered (e.g., 5.50 for 5.5%)
    max_discount DECIMAL(5,2), -- Max we could offer for this quantity
    discount_type VARCHAR(50), -- initial_request, counter_offer, asking_for_more, etc.
    
    -- AI response
    ai_response_tone VARCHAR(50), -- enthusiastic, apologetic, firm, friendly
    should_escalate BOOLEAN DEFAULT false, -- True if needs human intervention
    
    -- Outcome tracking
    accepted BOOLEAN, -- Did customer accept?
    final_discount DECIMAL(5,2), -- Final discount if different from offered
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for common queries
    INDEX idx_discount_negotiations_tenant (tenant_id),
    INDEX idx_discount_negotiations_customer (customer_phone),
    INDEX idx_discount_negotiations_cart (cart_id),
    INDEX idx_discount_negotiations_escalate (should_escalate),
    INDEX idx_discount_negotiations_created (created_at DESC)
);

-- Add RLS policies
ALTER TABLE discount_negotiations ENABLE ROW LEVEL SECURITY;

-- Tenants can see their own negotiations
CREATE POLICY discount_negotiations_tenant_policy ON discount_negotiations
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Comment for documentation
COMMENT ON TABLE discount_negotiations IS 'Tracks AI-powered discount negotiations with customers';
COMMENT ON COLUMN discount_negotiations.ai_intent_result IS 'Full JSON result from AI intent detection including confidence and reasoning';
COMMENT ON COLUMN discount_negotiations.ai_extracted_details IS 'Extracted product codes, quantities, and discount requests from AI';
COMMENT ON COLUMN discount_negotiations.should_escalate IS 'True if customer request exceeds max discount or needs human intervention';

-- =============================================
-- Analytics view for discount performance
-- =============================================

CREATE OR REPLACE VIEW discount_negotiation_analytics AS
SELECT 
    tenant_id,
    DATE(created_at) as date,
    COUNT(*) as total_negotiations,
    COUNT(*) FILTER (WHERE accepted = true) as accepted_count,
    COUNT(*) FILTER (WHERE accepted = false) as rejected_count,
    COUNT(*) FILTER (WHERE should_escalate = true) as escalated_count,
    AVG(offered_discount) as avg_offered_discount,
    AVG(final_discount) FILTER (WHERE accepted = true) as avg_accepted_discount,
    COUNT(*) FILTER (WHERE discount_type = 'initial_request') as initial_requests,
    COUNT(*) FILTER (WHERE discount_type = 'counter_offer') as counter_offers,
    COUNT(*) FILTER (WHERE discount_type = 'asking_for_more') as asking_for_more,
    COUNT(*) FILTER (WHERE discount_type = 'best_price') as best_price_requests
FROM discount_negotiations
GROUP BY tenant_id, DATE(created_at);

COMMENT ON VIEW discount_negotiation_analytics IS 'Daily analytics for AI discount negotiation performance';

-- =============================================
-- Rollback instructions
-- =============================================
-- To rollback this migration:
-- DROP VIEW IF EXISTS discount_negotiation_analytics;
-- DROP TABLE IF EXISTS discount_negotiations CASCADE;
