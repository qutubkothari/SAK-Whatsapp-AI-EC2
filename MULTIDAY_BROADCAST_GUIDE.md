# Multi-Day Broadcast Setup Guide

## Overview
Your broadcast system now supports **automatic multi-day scheduling** when you upload more contacts than your daily limit!

## Example
- **Your daily limit:** 500 messages
- **You upload:** 2000 contacts
- **System automatically:** Splits into 4 days (500 × 4 = 2000)

## Step 1: Run SQL Migrations in Supabase

### Migration 1: Add Tenant Daily Limits
```sql
-- Add daily_message_limit column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS daily_message_limit INTEGER DEFAULT 1000;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_daily_limit ON tenants(daily_message_limit);

-- Update existing tenants to have default limit
UPDATE tenants SET daily_message_limit = 1000 WHERE daily_message_limit IS NULL;

-- Add comment
COMMENT ON COLUMN tenants.daily_message_limit IS 'Maximum messages this tenant can send per day (default: 1000)';
```

### Migration 2: Add Multi-Day Broadcast Support
```sql
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
```

## Step 2: How to Use

### Set Your Daily Limit
1. Go to **https://web.saksolution.com/dashboard.html**
2. Click **Broadcast** tab
3. Find the **"Daily Message Limit"** settings box (purple gradient)
4. Set your desired limit (100-10,000)
5. Click **Save**

### Upload Contacts
1. Upload your Excel/CSV with any number of contacts
2. The system automatically:
   - Checks your daily limit
   - Calculates how many days needed
   - Splits contacts evenly across days
   - Schedules each batch
   - Shows you the complete schedule

### Example Output
```
✅ Multi-Day Broadcast Scheduled Successfully!

📊 Campaign: Holiday Sale
👥 Total Recipients: 2000
📈 Daily Limit: 500 messages/day
📆 Schedule: 4 days

  📅 Day 1: 500 contacts on Nov 17 at 9:00 AM
  📅 Day 2: 500 contacts on Nov 18 at 9:00 AM
  📅 Day 3: 500 contacts on Nov 19 at 9:00 AM
  📅 Day 4: 500 contacts on Nov 20 at 9:00 AM

ℹ️ The system will automatically send each batch on its scheduled day. You don't need to do anything else!
```

## Features

### ✅ Automatic Splitting
- Upload 10,000 contacts with 500/day limit → Auto-schedules over 20 days
- No manual work required!

### ✅ Smart Scheduling
- First day uses remaining capacity (if you've already sent some today)
- Subsequent days start fresh at 9 AM
- Respects WhatsApp limits

### ✅ Resume Protection
- Each contact tracked individually
- If a campaign fails, resume sends only to pending contacts
- No duplicate sends

### ✅ Daily Limit Customization
- Each tenant can set their own limit (100-10,000)
- Adjustable anytime from dashboard
- Changes apply immediately

## Advanced Features

### Campaign Tracking
- Each day is a separate campaign: `"Holiday Sale (Day 1/4)"`, `"Holiday Sale (Day 2/4)"`
- All linked by parent campaign ID
- View progress per day in broadcast history

### Status Monitoring
- Daily limit banner shows: **Green (safe)**, **Yellow (warning)**, **Red (limit reached)**
- Real-time tracking of messages sent today
- Remaining capacity displayed

## Technical Details

### Database Schema
- `tenants.daily_message_limit`: Your configured limit
- `broadcast_queue.parent_campaign_id`: Links related campaigns
- `broadcast_queue.day_number`: Which day (1, 2, 3, etc.)
- `broadcast_queue.total_days`: Total campaign duration
- `broadcast_queue.auto_scheduled`: Flag for auto-scheduled campaigns

### API Endpoints
- `PUT /api/broadcast/daily-limit/:tenantId` - Update limit
- `GET /api/broadcast/daily-limit/:tenantId` - Get current limit
- `GET /api/broadcast/daily-stats/:tenantId` - Get today's usage

## Troubleshooting

### Issue: "Daily limit reached"
**Solution:** Wait until tomorrow OR increase your daily limit in settings

### Issue: Campaigns not sending
**Solution:** Check broadcast history - they're scheduled for future days (9 AM each day)

### Issue: Want to send immediately
**Solution:** Reduce recipient count to fit within today's remaining capacity

## Best Practices

1. **Set realistic limits:** Start with 500-1000/day for safety
2. **Monitor performance:** Check if messages deliver successfully
3. **Gradual increase:** Increase limit slowly if needed (100-200/day increments)
4. **WhatsApp guidelines:** Don't exceed 10,000 without WhatsApp approval

## Next Steps

1. ✅ Run both SQL migrations above in Supabase
2. ✅ Refresh dashboard: https://web.saksolution.com/dashboard.html
3. ✅ Set your daily limit (default is 1000)
4. ✅ Test with a small upload first (e.g., 100 contacts)
5. ✅ Once verified, upload your full list!

---

**Need help?** The system is fully automated. Just upload and the multi-day scheduling handles everything!
