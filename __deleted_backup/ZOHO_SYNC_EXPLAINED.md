# Zoho Sync - How It Works

## Overview

Your WhatsApp AI Sales Assistant has **LIMITED automatic sync** with Zoho. Here's exactly what syncs and what doesn't:

---

## 📊 What Currently Syncs (One-Way: Your App → Zoho)

### 1. **Customer Information**
- **When**: When a customer completes GST verification in WhatsApp
- **Direction**: Your Database → Zoho Books
- **What syncs**: 
  - Company name
  - GST number
  - Contact person name
  - Phone number
  - Business address
- **File**: `services/businessInfoCaptureService.js` (line ~586)
- **How**: Calls `zoho.syncCustomer()` after GST verification

### 2. **Orders Created in WhatsApp**
- **When**: Customer completes checkout in WhatsApp
- **Direction**: Your Database → Zoho Books
- **What syncs**:
  - Sales Order with all items
  - Customer details
  - Prices, quantities, GST
  - Discount information
- **File**: `services/zohoSalesOrderService.js`
- **How**: Creates Zoho Sales Order after order confirmation

---

## 🔄 What Currently Syncs (One-Way: Zoho → Your App)

### 3. **Products from Zoho**
- **When**: Automatically every day at 2 AM IST
- **Direction**: Zoho Books → Your Database
- **What syncs**:
  - All products/items from Zoho Books
  - Product codes, names, descriptions
  - Prices (standard pricing)
  - Stock status
- **Scheduler**: `scheduler.js` (line ~391)
- **Frequency**: Daily at 2 AM IST
- **File**: `scripts/syncZohoProducts.js`

```javascript
// Runs daily at 2 AM IST
cron.schedule('0 2 * * *', async () => {
    await syncProductsFromZoho();
});
```

### 4. **Orders Created in Zoho** (Last 30 Days)
- **When**: Automatically every hour
- **Direction**: Zoho Books → Your Database
- **What syncs**:
  - Sales Orders created directly in Zoho Books
  - Customer information
  - Order items and prices
  - Order status
- **Scheduler**: `scheduler.js` (line ~405)
- **Frequency**: Every hour
- **File**: `services/zohoOrderSyncService.js`

```javascript
// Runs every hour
cron.schedule('0 * * * *', async () => {
    await scheduleZohoOrderSync();
});
```

### 5. **Invoices (Optional - Webhook Based)**
- **When**: When configured with Zoho webhook
- **Direction**: Zoho Books → Your Database
- **What syncs**:
  - Invoice created/updated/paid events
  - Payment status changes
- **Webhook URL**: `https://your-app.com/api/zoho/webhook/invoice`
- **File**: `services/zohoInvoiceSyncService.js`
- **Status**: ⚠️ **NOT CONFIGURED** (requires manual Zoho setup)

---

## ❌ What Does NOT Auto-Sync

### Products
- ❌ Product updates in Zoho Books → **Only syncs once daily at 2 AM**
- ❌ New products added in Zoho during the day → **Won't appear until next day 2 AM**
- ❌ Price changes in Zoho → **Won't reflect until next day 2 AM**
- ❌ Products deleted in Zoho → **May still show in your app**

### Customers
- ❌ Customer updates in Zoho Books (address, GST, etc.) → **Does NOT sync back to your app**
- ❌ New customers added in Zoho → **Does NOT sync to your app**
- ❌ Customer deletions in Zoho → **Does NOT sync**

### Orders
- ❌ Order status changes in Zoho → **Only syncs once per hour**
- ❌ Order modifications in Zoho → **Does NOT update in your app**
- ❌ Order cancellations in Zoho → **Does NOT sync**

### Personalized Pricing
- ❌ Customer-specific prices in Zoho → **NOT synced automatically**
- ❌ Price lists in Zoho → **NOT synced**
- ❌ Your personalized pricing in the app → **NOT synced to Zoho**

---

## 🔧 Manual Sync Options

### For Products (Immediate)
You can trigger an immediate product sync via WhatsApp:

```
/sync-products
```

Or via API:
```bash
POST /api/zoho/sync-products
```

### For Orders (Immediate)
Trigger order sync via WhatsApp:

```
/sync-zoho
```

Or via API:
```bash
POST /api/zoho/sync-orders
```

---

## 📝 Current Sync Schedule Summary

| What | Direction | Frequency | Automatic? |
|------|-----------|-----------|------------|
| **Products** | Zoho → App | Daily 2 AM | ✅ Yes |
| **Orders from Zoho** | Zoho → App | Every hour | ✅ Yes |
| **Customer from WhatsApp** | App → Zoho | On GST verify | ✅ Yes |
| **Orders from WhatsApp** | App → Zoho | On checkout | ✅ Yes |
| **Invoices** | Zoho → App | On webhook | ⚠️ Not configured |
| **Customer updates** | Zoho → App | Never | ❌ No |
| **Product updates (real-time)** | Zoho → App | Daily only | ❌ No |
| **Personalized pricing** | Both ways | Never | ❌ No |

---

## 🚀 Improving Sync (Recommendations)

### Option 1: More Frequent Product Sync
Change product sync from daily to every 4 hours:

```javascript
// In scheduler.js, change from:
cron.schedule('0 2 * * *', ...)  // Once daily

// To:
cron.schedule('0 */4 * * *', ...)  // Every 4 hours
```

### Option 2: Set Up Zoho Webhooks (Real-Time)
Configure webhooks in Zoho Books for:
- Invoice updates
- Customer updates
- Product updates
- Order status changes

**Webhook URL**: `https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/api/zoho/webhook/[entity]`

See `ZOHO_INVOICE_SYNC_GUIDE.md` for setup instructions.

### Option 3: Two-Way Sync for Personalized Pricing
Currently, your personalized pricing is stored only in your database (`customer_product_prices` table). It does NOT sync to Zoho.

To enable:
1. Store pricing in Zoho Price Lists
2. Modify sync to fetch customer-specific price lists
3. Update pricing logic to use Zoho prices as source of truth

---

## 🔍 Checking Sync Status

### View Logs
```bash
gcloud app logs read --service default --limit 100 | grep "ZOHO_SYNC"
```

### Check Last Sync Times
Query your database:
```sql
-- Check last product sync
SELECT MAX(updated_at) FROM products;

-- Check orders synced from Zoho
SELECT COUNT(*) FROM orders WHERE zoho_salesorder_id IS NOT NULL;
```

### Test Manual Sync
Send in WhatsApp:
```
/sync-products
/sync-zoho
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `scheduler.js` | Main cron scheduler for automatic syncs |
| `services/zohoOrderSyncService.js` | Syncs orders from Zoho → App |
| `scripts/syncZohoProducts.js` | Syncs products from Zoho → App |
| `services/zohoSalesOrderService.js` | Creates orders in Zoho from WhatsApp |
| `services/zohoIntegrationService.js` | Syncs customers to Zoho |
| `services/zohoInvoiceSyncService.js` | Invoice webhook handler (not configured) |

---

## ⚠️ Important Notes

1. **Product updates in Zoho won't be instant** - They sync once daily at 2 AM IST
2. **Customer data is one-way** - Changes in Zoho won't update your WhatsApp AI
3. **Personalized pricing is independent** - Your custom prices won't sync to Zoho
4. **Order status updates lag** - Up to 1 hour delay for orders created in Zoho
5. **Manual sync available** - Use `/sync-products` or `/sync-zoho` for immediate updates

---

## 💡 Bottom Line

**Your current setup is:**
- ✅ Good for WhatsApp → Zoho (customers, orders)
- ✅ Adequate for Zoho → WhatsApp products (daily sync)
- ⚠️ Limited for real-time Zoho updates
- ❌ No sync for personalized pricing
- ❌ No sync for customer updates from Zoho

**For better real-time sync, consider setting up Zoho webhooks!**
