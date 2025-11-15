-- Add metadata column to conversations table for storing discount offers and other temporary data
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_conversations_metadata ON conversations USING gin(metadata);

-- Add comment
COMMENT ON COLUMN conversations.metadata IS 'Stores temporary metadata like discount offers, negotiation state, etc.';
