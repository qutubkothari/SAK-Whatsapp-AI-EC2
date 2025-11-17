-- Add multi-day broadcast support columns
ALTER TABLE broadcast_queue
ADD COLUMN IF NOT EXISTS parent_campaign_id UUID,
ADD COLUMN IF NOT EXISTS day_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_scheduled BOOLEAN DEFAULT FALSE;

-- Create index for multi-day campaigns
CREATE INDEX IF NOT EXISTS idx_broadcast_queue_parent_campaign ON broadcast_queue(parent_campaign_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_queue_auto_scheduled ON broadcast_queue(auto_scheduled);

-- Add comments
COMMENT ON COLUMN broadcast_queue.parent_campaign_id IS 'Links child campaigns to parent for multi-day broadcasts';
COMMENT ON COLUMN broadcast_queue.day_number IS 'Which day of the multi-day campaign (1, 2, 3, etc.)';
COMMENT ON COLUMN broadcast_queue.total_days IS 'Total days required for complete broadcast';
COMMENT ON COLUMN broadcast_queue.auto_scheduled IS 'Whether this was auto-scheduled by daily limit system';
