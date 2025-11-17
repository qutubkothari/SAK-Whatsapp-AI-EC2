-- Add multi-day broadcast support columns
ALTER TABLE bulk_schedules
ADD COLUMN IF NOT EXISTS parent_campaign_id UUID,
ADD COLUMN IF NOT EXISTS day_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_scheduled BOOLEAN DEFAULT FALSE;

-- Create index for multi-day campaigns
CREATE INDEX IF NOT EXISTS idx_bulk_schedules_parent_campaign ON bulk_schedules(parent_campaign_id);
CREATE INDEX IF NOT EXISTS idx_bulk_schedules_auto_scheduled ON bulk_schedules(auto_scheduled);

-- Add comments
COMMENT ON COLUMN bulk_schedules.parent_campaign_id IS 'Links child campaigns to parent for multi-day broadcasts';
COMMENT ON COLUMN bulk_schedules.day_number IS 'Which day of the multi-day campaign (1, 2, 3, etc.)';
COMMENT ON COLUMN bulk_schedules.total_days IS 'Total days required for complete broadcast';
COMMENT ON COLUMN bulk_schedules.auto_scheduled IS 'Whether this was auto-scheduled by daily limit system';
