# 🚨 URGENT: Maytapi Webhook URL Update Required

## Issue Discovered: October 26, 2025

**Problem:** Google App Engine changed the application domain from `el.r.appspot.com` to `wl.r.appspot.com`, causing all webhook messages to fail with 404 errors.

**Impact:** 
- Messages sent after ~11:42 AM on Oct 26 are NOT being received
- Dashboard shows old messages but no new ones
- Customer messages from WhatsApp are not being saved to database

---

## ✅ REQUIRED ACTION

### Update your Maytapi Webhook URL

**Old URL (NOT WORKING):**
```
https://sak-whatsapp-ai-sales-assist.el.r.appspot.com/webhook
```

**New URL (WORKING):**
```
https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/webhook
```

---

## 📋 Step-by-Step Instructions

### 1. Login to Maytapi Dashboard
   - Go to: https://console.maytapi.com/
   - Use your credentials to login

### 2. Navigate to Webhook Settings
   - Select your product: **033cf406-9f19-4c8a-837f-9e9bfa9acfac**
   - Go to **Settings** or **Webhook Configuration**

### 3. Update Webhook URL
   - Find the "Webhook URL" field
   - Replace the existing URL with:
     ```
     https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/webhook
     ```

### 4. Save Changes
   - Click **Save** or **Update**
   - Verify the webhook is enabled

### 5. Test the Webhook
   - Send a test message to your WhatsApp bot
   - Check if it appears in the dashboard
   - Verify in database using:
     ```powershell
     $env:SUPABASE_URL="https://upswoeziirmshuzelizz.supabase.co"
     $env:SUPABASE_SERVICE_KEY="sb_secret_-uwce4s0ceLt0w4LiaIcKQ_i7dj4bCX"
     node check_messages_for_conversation.js 1391fe3d-34d6-4048-a5a8-2f7e427aa7cc
     ```

---

## ✨ Verification

After updating the webhook URL, you should see:

1. **Webhook logs in App Engine:**
   ```powershell
   gcloud app logs read --service default --limit 50 | Select-String "POST /webhook"
   ```

2. **Messages saved to database:**
   - Both user messages and bot responses will be saved
   - Dashboard will show real-time conversations

3. **Recent message timestamps:**
   - Messages will have current timestamps (not old dates from Oct 22)

---

## 🔧 Technical Details

### Why Did This Happen?

Google App Engine uses different region codes for serving domains:
- `el.r.appspot.com` = Europe-London region
- `wl.r.appspot.com` = Europe-West region

When you deploy, App Engine may route to different regions based on load balancing, causing the domain to change.

### Current Configuration

**Maytapi Settings (from app.yaml):**
- API Key: `6b426589-ff5a-4249-b6cc-ec9c0d0d6abd`
- Product ID: `033cf406-9f19-4c8a-837f-9e9bfa9acfac`
- Phone ID: `90369`

**Deployed Version:**
- Version: `auto-deploy-20251026-120137`
- Status: ✅ Running (100% traffic)
- Domain: `https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com`

---

## ⚠️ Note on Message Persistence Fix

The message persistence fix deployed today (Oct 26) is **working correctly**. The code changes in `mainHandler.js` are:

1. ✅ User messages are saved on receipt
2. ✅ Bot responses are saved via `sendAndSaveMessage()`
3. ✅ Conversation timestamps are updated

**The ONLY issue** is that Maytapi is sending to the old URL, so no messages are reaching the webhook handler.

Once the webhook URL is updated, all new messages will be saved correctly!

---

## 📞 Support

If you encounter issues:
1. Check Maytapi console for webhook delivery status
2. Test webhook manually using `test_webhook_message.js`
3. Check App Engine logs for errors
4. Verify Supabase database connectivity

---

**Status:** 🔴 **ACTION REQUIRED - Update Maytapi Webhook URL Now**

**Last Updated:** October 26, 2025 at 12:02 PM
