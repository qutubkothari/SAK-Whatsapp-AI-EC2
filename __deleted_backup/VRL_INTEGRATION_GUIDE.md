# VRL Shipment Tracking Integration - Complete Setup Guide

## 🎉 Status: READY TO DEPLOY

All components have been created and integrated. Follow these steps to activate the shipment tracking feature.

---

## Step 1: Apply Database Migration

Run the SQL migration to create tracking tables:

```bash
# Connect to your Supabase database and run:
psql <your-supabase-connection-string> -f database_migrations/create_shipment_tracking_table.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Open `database_migrations/create_shipment_tracking_table.sql`
3. Execute the SQL

**Tables Created:**
- `shipment_tracking` - Main tracking data
- `shipment_tracking_history` - Detailed event logs

---

## Step 2: Add Environment Variable

Add the VRL scraper URL to your `.env` file:

```env
VRL_SCRAPER_URL=https://vrl-scraper-557586370061.asia-south1.run.app/track
```

---

## Step 3: Install Dependencies

The shipment tracking system requires `node-cron` for periodic checks:

```bash
npm install node-cron
```

---

## Step 4: Restart Your Application

```bash
# If running on App Engine
gcloud app deploy

# If running locally
npm start
```

The shipment tracking cron job will start automatically.

---

## Features Enabled

### 1. **Automatic Tracking Detection**

Customers can send tracking requests:
```
Customer: "Track my shipment 1099492944"
Customer: "1099492944"  (just the LR number)
Customer: "where is my shipment?"
Customer: "shipment status"
```

Bot automatically:
- Detects LR numbers (10 digits)
- Calls VRL scraper
- Sends formatted tracking info
- Saves to database

### 2. **Admin Commands**

Admins can manage shipments:

```
/shipments
```
Lists all active shipments with status

```
/track <LR_NUMBER>
```
Manually track a specific shipment
Example: `/track 1099492944`

```
/check_shipments
```
Manually trigger check for all active shipments
Updates status and sends notifications to customers

### 3. **Automated Status Updates**

**Cron Schedule:** Every 6 hours
- Checks all active shipments
- Compares current status with last known status
- Sends WhatsApp notifications when status changes
- Auto-deactivates delivered shipments

**Message Format:**
```
🔔 *Shipment Update*

📦 *VRL Shipment Tracking*

📋 *LR Number:* 1099492944
📊 *Status:* Waybill in Transit to Next Hub
📍 *Current Location:* AHMEDABAD

*📜 Tracking History:*

🔴 *Waybill in Transit to Next Hub*
   📅 16-Oct-2025 08:10
   📍 AHMEDABAD TPT

🟢 *Waybill Arrived at AHMEDABAD*
   📅 15-Oct-2025 01:10
   📍 AHMEDABAD TPT

💡 _Track updated: 19-Oct-2025 06:05 AM_
```

---

## API Reference

### VRL Scraper Service

**Endpoint:** `POST https://vrl-scraper-557586370061.asia-south1.run.app/track`

**Request:**
```json
{
  "lrNumber": "1099492944"
}
```

**Response (Success):**
```json
{
  "success": true,
  "lrNumber": "1099492944",
  "origin": "AHMEDABAD",
  "destination": "CHENNAI",
  "status": "Waybill in Transit to Next Hub",
  "currentLocation": "AHMEDABAD",
  "latestUpdate": "Waybill in Transit to Next Hub",
  "history": [
    {
      "status": "Waybill in Transit to Next Hub",
      "datetime": "16-Oct-2025 08:10",
      "location": "AHMEDABAD TPT",
      "description": "Waybill in Transit to Next Hub"
    }
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "lrNumber": "1099492944",
  "error": "No tracking data found"
}
```

---

## Files Created/Modified

### New Files Created:

1. **`database_migrations/create_shipment_tracking_table.sql`**
   - Database schema for shipment tracking

2. **`services/vrlTrackingService.js`**
   - Core tracking service
   - Functions: `trackVRLShipment()`, `saveShipmentTracking()`, `checkShipmentsForUpdates()`

3. **`handlers/shipmentTrackingHandler.js`**
   - Customer message handler
   - Detects tracking intents
   - Formats responses

4. **`schedulers/shipmentTrackingCron.js`**
   - Cron job for periodic checks
   - Runs every 6 hours
   - Auto-notifies customers

5. **`commands/shipments.js`**
   - Admin commands
   - `/shipments`, `/track`, `/check_shipments`

6. **`VRL_SCRAPER_SUCCESS.md`**
   - Complete scraper documentation

7. **`scraper-service/server.js`** (deployed)
   - VRL web scraper
   - Cloud Run service

8. **`scraper-service/cloudbuild.yaml`**
   - Auto-deploy configuration

9. **`scraper-service/Dockerfile`**
   - Container configuration

### Modified Files:

1. **`routes/webhook.js`**
   - Added shipment tracking integration
   - Detects tracking intents before AI routing

2. **`routes/handlers/completeAdminHandler.js`**
   - Added admin shipment commands

3. **`index.js`**
   - Started shipment tracking cron job

---

## Testing

### Test Customer Tracking:

Send a message via WhatsApp:
```
1099492944
```

Expected Response:
```
⏳ Tracking your shipment...
📋 LR Number: 1099492944

Please wait 20-30 seconds...
```

Then:
```
📦 *VRL Shipment Tracking*
...tracking details...
```

### Test Admin Commands:

```
/shipments
```
Should list all active shipments

```
/track 1099492944
```
Should show tracking details

```
/check_shipments
```
Should trigger manual check

---

## Monitoring

### Check Cron Status:

```javascript
const shipmentTrackingCron = require('./schedulers/shipmentTrackingCron');
console.log(shipmentTrackingCron.getStatus());
```

**Output:**
```javascript
{
  isRunning: false,
  isScheduled: true,
  schedule: '0 */6 * * * (every 6 hours)'
}
```

### View Logs:

**Scraper Logs:**
```bash
gcloud run services logs read vrl-scraper --region=asia-south1 --limit=100
```

**Main App Logs:**
```bash
gcloud app logs read --limit=100 | Select-String "SHIPMENT_TRACKING"
```

### Database Queries:

**Active Shipments:**
```sql
SELECT * FROM shipment_tracking WHERE is_active = true ORDER BY last_checked ASC;
```

**Recent Tracking History:**
```sql
SELECT 
  st.tracking_number,
  st.status,
  st.current_location,
  sth.event_datetime,
  sth.description
FROM shipment_tracking st
JOIN shipment_tracking_history sth ON sth.shipment_tracking_id = st.id
ORDER BY sth.event_datetime DESC
LIMIT 50;
```

---

## Customization

### Change Cron Schedule:

Edit `schedulers/shipmentTrackingCron.js`:

```javascript
// Current: Every 6 hours
this.cronJob = cron.schedule('0 */6 * * *', async () => { ... });

// Every 3 hours:
this.cronJob = cron.schedule('0 */3 * * *', async () => { ... });

// Every hour:
this.cronJob = cron.schedule('0 * * * *', async () => { ... });

// Twice a day (6 AM and 6 PM):
this.cronJob = cron.schedule('0 6,18 * * *', async () => { ... });
```

### Add More Carriers:

The system is designed to support multiple carriers. To add DTDC, BlueDart, etc.:

1. Create scraper service (similar to VRL)
2. Update `vrlTrackingService.js` to handle carrier detection
3. Add carrier-specific formatters

---

## Troubleshooting

### Issue: Scraper Returns success: false

**Check:**
1. LR number is valid (10 digits)
2. Shipment exists in VRL system
3. VRL website is accessible

**Test Manually:**
```bash
Invoke-RestMethod -Uri "https://vrl-scraper-557586370061.asia-south1.run.app/track" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"lrNumber":"1099492944"}'
```

### Issue: Cron Job Not Running

**Check Status:**
```javascript
const cron = require('./schedulers/shipmentTrackingCron');
console.log('Cron status:', cron.getStatus());
```

**Manually Trigger:**
```javascript
await cron.checkShipments();
```

### Issue: Database Errors

**Check Tables Exist:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name IN ('shipment_tracking', 'shipment_tracking_history');
```

**Verify Permissions:**
```sql
GRANT ALL ON shipment_tracking TO your_user;
GRANT ALL ON shipment_tracking_history TO your_user;
```

---

## Performance Considerations

### Scraper Performance:
- **Average Time:** 25-30 seconds per request
- **Timeout:** 90 seconds (Cloud Run)
- **Concurrent Requests:** Supported

### Cron Performance:
- **100 shipments:** ~50 minutes (30s each + 2s delay)
- **200 shipments:** ~100 minutes
- **Recommendation:** Run during low-traffic hours

### Optimization Options:
1. **Caching:** Store results for 1 hour
2. **Parallel Processing:** Use multiple browser instances
3. **Batch Processing:** Group LR numbers in single request

---

## Cost Estimate

### Cloud Run (VRL Scraper):
- **CPU:** 1 vCPU @ $0.00002400 per vCPU-second
- **Memory:** 512 MB @ $0.00000250 per GB-second
- **Per Request:** ~$0.002 (30 seconds)
- **Monthly (1000 requests):** ~$2

### Database Storage:
- **Supabase Free Tier:** Up to 500 MB
- **Estimated:** 1 KB per shipment = 1,000 shipments = 1 MB
- **Cost:** Free (within limits)

### WhatsApp Messages:
- **Per message:** Varies by provider
- **Notifications:** 1 per status change
- **Estimate:** 2-3 messages per shipment

---

## Next Steps

### Phase 2 Enhancements:

1. **SMS Notifications**
   - Add SMS alerts for critical events
   - Integrate Twilio/AWS SNS

2. **Email Notifications**
   - Send email summaries
   - PDF tracking reports

3. **Delivery Predictions**
   - ML model for delivery time estimation
   - Historical data analysis

4. **Multi-Carrier Support**
   - DTDC scraper
   - BlueDart scraper
   - FedEx/DHL API integration

5. **Customer Portal**
   - Web dashboard for tracking
   - Real-time updates via WebSocket

6. **Analytics Dashboard**
   - Average delivery time
   - Carrier performance metrics
   - Route optimization

---

## Support

### Documentation:
- VRL Scraper: `VRL_SCRAPER_SUCCESS.md`
- Integration: This file
- API Reference: `VRL_SCRAPER_SUCCESS.md` (API section)

### Logs:
```bash
# Scraper logs
gcloud run services logs read vrl-scraper --region=asia-south1

# App logs
gcloud app logs read | Select-String "VRL_TRACKING|SHIPMENT_TRACKING"
```

### Need Help?
1. Check logs first
2. Test scraper manually
3. Verify database schema
4. Check environment variables

---

**Integration Complete! 🎉**

All features are ready to use. Deploy and test with a real customer!
