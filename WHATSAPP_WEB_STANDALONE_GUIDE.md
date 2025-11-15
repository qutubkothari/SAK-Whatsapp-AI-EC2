# WhatsApp Web Standalone System

## Overview
This is a **completely separate** WhatsApp broadcast system that runs alongside your existing Maytapi-based system. Your current clients and demos using Maytapi will continue working without any changes.

## Key Features
- ✅ **Standalone Operation**: Uses WhatsApp Web QR code connection (no Maytapi dependency)
- ✅ **Separate API Routes**: All endpoints under `/api/whatsapp-web/*` (doesn't touch existing routes)
- ✅ **Isolated Service**: New `whatsappWebService.js` service (doesn't modify existing services)
- ✅ **Per-Tenant Sessions**: Each tenant gets their own WhatsApp Web connection
- ✅ **Persistent Sessions**: LocalAuth strategy saves sessions for auto-reconnect

## Architecture

### New Files Created (Zero Impact on Existing System)
1. **`services/whatsappWebService.js`** - WhatsApp Web client manager
2. **`routes/api/whatsappWeb.js`** - API endpoints for connection management
3. **`migrations/20251115_create_whatsapp_connections.sql`** - New database table

### Database
- **New Table**: `whatsapp_connections` (stores connection status)
- **Existing Tables**: No modifications to any existing tables

### API Endpoints (All New, No Overlap)
```
POST   /api/whatsapp-web/connect       - Initialize WhatsApp Web client
GET    /api/whatsapp-web/qr/:tenantId  - Get QR code for scanning
GET    /api/whatsapp-web/status/:tenantId - Check connection status
POST   /api/whatsapp-web/disconnect    - Disconnect session
GET    /api/whatsapp-web/connections   - List all connections (admin)
```

## Installation

### 1. Install Dependencies
```bash
npm install whatsapp-web.js qrcode puppeteer
```

### 2. Run Database Migration
Execute the SQL file in Supabase:
```sql
-- Run: migrations/20251115_create_whatsapp_connections.sql
```

### 3. Restart Server
```bash
npm start
```

## Usage Flow

### Step 1: Initialize Connection
```javascript
POST /api/whatsapp-web/connect
{
  "tenantId": "tenant_123"
}
```

### Step 2: Get QR Code
```javascript
GET /api/whatsapp-web/qr/tenant_123

Response:
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "status": "qr_ready"
}
```

### Step 3: Scan QR Code
- Display the QR code in dashboard
- User scans with their WhatsApp mobile app
- System automatically detects authentication

### Step 4: Check Status
```javascript
GET /api/whatsapp-web/status/tenant_123

Response:
{
  "success": true,
  "status": "ready",
  "hasClient": true,
  "connection": {
    "tenant_id": "tenant_123",
    "phone_number": "1234567890",
    "status": "ready",
    "connected_at": "2025-11-15T10:30:00Z"
  }
}
```

## Connection States

| State | Description |
|-------|-------------|
| `disconnected` | No active connection |
| `initializing` | Client is starting up |
| `qr_ready` | QR code generated, waiting for scan |
| `authenticated` | QR scanned, authenticating |
| `ready` | Fully connected and ready to send messages |
| `auth_failed` | Authentication failed |
| `error` | Connection error occurred |

## How It Coexists with Existing System

### Existing Maytapi System (Unchanged)
- API: `/api/broadcast/*` (existing broadcast endpoints)
- Service: `services/broadcastService.js` (unchanged)
- Handler: `handlers/messageHandler.js` (unchanged)
- Routes: `routes/webhook.js` (unchanged)

### New WhatsApp Web System (Standalone)
- API: `/api/whatsapp-web/*` (new endpoints)
- Service: `services/whatsappWebService.js` (new file)
- Table: `whatsapp_connections` (new table)
- Sessions: `./wa_sessions/` directory (new)

### No Conflicts
- Different API routes (`/api/broadcast` vs `/api/whatsapp-web`)
- Different database tables
- Different service files
- Existing clients continue using Maytapi
- New tenants can choose WhatsApp Web

## Session Management

### Session Storage
- Location: `./wa_sessions/tenant_<tenantId>/`
- Format: LocalAuth (whatsapp-web.js default)
- Persistence: Sessions survive server restarts

### Auto-Reconnect
- On server restart, sessions automatically restore
- No need to scan QR code again
- Status updated in database

## Technical Details

### Dependencies
- **whatsapp-web.js**: WhatsApp Web protocol implementation
- **puppeteer**: Chromium automation for WhatsApp Web
- **qrcode**: QR code generation

### Configuration
```javascript
// Puppeteer config (in whatsappWebService.js)
puppeteer: {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
  ]
}
```

### Message Sending
```javascript
// Text message
await sendWebMessage(tenantId, recipientNumber, textMessage);

// Image message
await sendWebImageMessage(tenantId, recipientNumber, imageUrl);
```

## Dashboard Integration (Next Step)

Add WhatsApp Web connection UI to existing dashboard:

1. **New Tab**: "WhatsApp Web" in sidebar
2. **QR Display**: Show QR code when status is `qr_ready`
3. **Status Indicator**: Real-time connection status
4. **Controls**: Connect/Disconnect buttons

### Dashboard HTML (to be added to dashboard.html)
```html
<div class="sidebar-item" onclick="switchTab('whatsapp-web')">
  <i class="fas fa-qrcode"></i>
  WhatsApp Web
</div>

<div class="tab-content" id="whatsapp-web-tab">
  <h2>WhatsApp Web Connection</h2>
  <div id="wa-web-status"></div>
  <div id="wa-web-qr"></div>
  <button onclick="connectWhatsAppWeb()">Connect</button>
  <button onclick="disconnectWhatsAppWeb()">Disconnect</button>
</div>
```

## Security Considerations

1. **Session Security**: Sessions stored locally, protected by file system permissions
2. **Tenant Isolation**: Each tenant has separate client instance
3. **Status Validation**: Connection status verified before message sending
4. **Error Handling**: Comprehensive error logging and recovery

## Future Integration with Broadcasts

### Option 1: Manual Selection
- Tenant selects connection method in dashboard
- "Use Maytapi" or "Use WhatsApp Web"

### Option 2: Auto-Fallback
- Check WhatsApp Web status first
- If not connected, fallback to Maytapi
- Transparent to user

### Option 3: Dual Send
- Send through both systems simultaneously
- Better reliability and redundancy

## Troubleshooting

### QR Code Not Generating
- Check Puppeteer installation: `npm list puppeteer`
- Verify Chrome/Chromium is available
- Check logs for initialization errors

### Connection Drops
- Check session files in `./wa_sessions/`
- Verify WhatsApp mobile app is online
- Check for multiple devices connected

### Messages Not Sending
- Verify connection status is `ready`
- Check recipient number format (digits only)
- Ensure number is registered on WhatsApp

## Monitoring

### Check Active Connections
```javascript
GET /api/whatsapp-web/connections

Response:
{
  "success": true,
  "activeConnections": [
    { "tenantId": "tenant_123", "status": "ready" }
  ],
  "allConnections": [/* database records */]
}
```

### View Logs
```bash
# Server logs show WhatsApp Web events
[WA_WEB] Client initialized for tenant: tenant_123
[WA_WEB] QR code generated
[WA_WEB] Client authenticated
[WA_WEB] Client ready
```

## Summary

This is a **completely independent** WhatsApp broadcasting system that:
- ✅ Doesn't touch existing Maytapi code
- ✅ Uses separate API routes
- ✅ Has its own database table
- ✅ Can run alongside existing system
- ✅ Provides QR code-based WhatsApp Web connection
- ✅ Ready for dashboard UI integration

**Your existing clients and demos are 100% safe and will continue working exactly as before.**
