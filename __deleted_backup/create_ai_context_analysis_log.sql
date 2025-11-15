-- AI Context Analysis Log Table
-- Stores AI's context analysis decisions and their outcomes for self-learning

CREATE TABLE IF NOT EXISTS ai_context_analysis_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Input data
    message TEXT NOT NULL,
    conversation_state TEXT,
    quoted_products TEXT,
    context_data TEXT,
    
    -- AI's analysis
    ai_intent TEXT NOT NULL,
    ai_action TEXT NOT NULL,
    ai_confidence DECIMAL(3,2),
    ai_reasoning TEXT,
    extracted_data JSONB,
    
    -- Outcome tracking (for learning)
    outcome_correct BOOLEAN DEFAULT NULL,
    actual_intent TEXT,
    actual_action TEXT,
    actual_outcome TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for learning queries
    INDEX idx_ai_context_outcome (outcome_correct),
    INDEX idx_ai_context_intent (ai_intent),
    INDEX idx_ai_context_created (created_at DESC)
);

-- Add comment
COMMENT ON TABLE ai_context_analysis_log IS 'Logs AI context analysis decisions for self-learning and improvement';

-- View for learning insights
CREATE OR REPLACE VIEW ai_context_learning_insights AS
SELECT 
    ai_intent,
    actual_intent,
    COUNT(*) as occurrence_count,
    AVG(ai_confidence) as avg_confidence,
    SUM(CASE WHEN outcome_correct THEN 1 ELSE 0 END) as correct_count,
    SUM(CASE WHEN outcome_correct = FALSE THEN 1 ELSE 0 END) as incorrect_count,
    ROUND(100.0 * SUM(CASE WHEN outcome_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy_percentage
FROM ai_context_analysis_log
WHERE outcome_correct IS NOT NULL
GROUP BY ai_intent, actual_intent
ORDER BY occurrence_count DESC;

COMMENT ON VIEW ai_context_learning_insights IS 'Aggregates AI context analysis performance for learning';
