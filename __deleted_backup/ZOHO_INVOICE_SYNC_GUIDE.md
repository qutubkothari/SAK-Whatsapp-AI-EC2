# 🔄 Zoho Invoice Sync Guide

## Overview
After creating or updating an invoice in Zoho Books, you can sync it back to your database to keep prices and data in sync.

---

## 📱 Methods to Sync Invoices

### Method 1: WhatsApp Commands (EASIEST)

#### Sync a Single Invoice
Send this message from your admin WhatsApp number:
```
/sync-invoice 1234567890
```
Replace `1234567890` with your actual Zoho invoice ID.

**What happens:**
- ✅ Fetches the latest invoice data from Zoho
- ✅ Updates order total, taxes, discounts
- ✅ Updates individual product prices if changed
- ✅ Updates invoice status and payment status

---

#### Sync All Recent Invoices
Send this message from your admin WhatsApp number:
```
/sync-all-invoices
```

**What happens:**
- ✅ Syncs all invoices from the last 30 days
- ✅ Updates prices for all products
- ✅ Shows summary of synced vs errors

---

### Method 2: API Endpoints

#### Sync Single Invoice
```bash
POST https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/api/zoho/sync/invoice

Body:
{
  "tenantId": "your-tenant-id",
  "invoiceId": "zoho-invoice-id"
}
```

#### Sync All Invoices
```bash
POST https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/api/zoho/sync/invoices/all

Body:
{
  "tenantId": "your-tenant-id",
  "days": 30  // optional, default 30
}
```

---

### Method 3: Zoho Webhooks (AUTOMATIC - RECOMMENDED)

Set up automatic syncing whenever you update an invoice in Zoho:

#### 1. Configure Zoho Webhook

In Zoho Books:
1. Go to **Settings** → **Automation** → **Webhooks**
2. Click **+ New Webhook**
3. Configure:
   - **Name**: Invoice Update Sync
   - **Module**: Invoices
   - **Events**: Update, Create
   - **Webhook URL**: `https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/api/zoho/webhook/invoice`
   - **Method**: POST
4. Save

**Now whenever you update an invoice in Zoho, it automatically syncs to your database!** 🎉

---

## 📋 Use Cases

### Scenario 1: Price Changed in Zoho
You updated the price of NFF 8x80 from ₹2511 to ₹2600 in a Zoho invoice.

**Solution:**
```
/sync-invoice 1234567890
```

**Result:**
```
✅ Invoice Synced Successfully

📄 Invoice: INV-00123
💰 Total: ₹7943.6
📊 Status: sent
🔢 Items Updated: 3

All changes from Zoho have been saved to your database.
```

---

### Scenario 2: Multiple Invoices Updated
You edited several invoices in Zoho this week.

**Solution:**
```
/sync-all-invoices
```

**Result:**
```
✅ Invoice Sync Complete

📊 Total Invoices: 15
✅ Successfully Synced: 14
❌ Errors: 1

All invoice data has been updated in your database.
```

---

### Scenario 3: Automatic Sync (Best!)
Set up Zoho webhook (Method 3 above).

**No manual action needed!**
- Edit invoice in Zoho → Automatically syncs ✅
- Create new invoice → Automatically syncs ✅
- Update prices → Automatically syncs ✅

---

## 🔍 What Gets Synced?

When you sync an invoice, the following data is updated:

**Order Level:**
- ✅ Total price
- ✅ Tax total
- ✅ Discount total
- ✅ Shipping charges
- ✅ Adjustments
- ✅ Invoice status
- ✅ Payment status
- ✅ Invoice number

**Product/Item Level:**
- ✅ Product price (rate)
- ✅ Quantity
- ✅ Item total
- ✅ Tax details

---

## ⚙️ Current Status

**Deployment**: Version `auto-deploy-20251015-075654` (In Progress)

Once deployment completes (~5 minutes), you can immediately start using the sync commands!

---

## 💡 Pro Tips

1. **Use webhooks** for automatic sync - set it up once, forget about it!
2. **Sync regularly** if not using webhooks - run `/sync-all-invoices` weekly
3. **Check invoice ID** in Zoho before syncing - it's in the URL when viewing an invoice
4. **Admin only** - these commands only work from your admin WhatsApp number

---

## 🆘 Troubleshooting

### Error: "No matching order found"
**Cause**: The invoice wasn't created from a WhatsApp order.
**Solution**: This is expected - only syncs invoices that originated from your WhatsApp bot.

### Error: "Zoho authorization error"
**Cause**: Zoho token expired or insufficient permissions.
**Solution**: Re-authorize Zoho access:
```
/login
```

### Error: "Tenant not found"
**Cause**: Invalid tenant ID in API request.
**Solution**: Use WhatsApp commands instead, they auto-detect your tenant.

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `/sync-invoice 123` | Sync one invoice |
| `/sync-all-invoices` | Sync all recent invoices |
| `/help` | Show all commands |

---

**Questions?** Send `/help` from your admin WhatsApp number to see all available commands!
