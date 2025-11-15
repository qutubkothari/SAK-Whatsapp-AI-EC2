# End-to-End Testing: WhatsApp → Database → Zoho → Sync Back

## 🎯 **Test Objective:**
Verify complete flow of personalized pricing with Zoho integration

---

## 📋 **Test Plan:**

### **Phase 1: Clean Slate** ✅ (You'll do this)
```sql
-- Delete all existing orders for test customer
DELETE FROM order_items WHERE order_id IN (
    SELECT id FROM orders WHERE customer_profile_id = '<your_test_customer_id>'
);

DELETE FROM orders WHERE customer_profile_id = '<your_test_customer_id>';

-- Verify clean state
SELECT COUNT(*) FROM order_items;  -- Should show 0 for test customer
```

### **Phase 2: WhatsApp Order** 📱
**Action:** Send message from WhatsApp
```
8x100 5 cartons
```

**Expected Database State:**
```sql
-- Should create:
1. orders table: 1 new row
   - status: 'pending'
   - total_amount: calculated
   - zoho_salesorder_id: NULL (not synced yet)

2. order_items table: 1 new row
   - product_id: (8x100 product ID)
   - quantity: 5
   - price_at_time_of_purchase: ₹2343.60 (catalog price)
   - zoho_item_id: NULL
```

**Verify:** Check database
```sql
SELECT 
    o.id as order_id,
    o.order_number,
    o.status,
    o.total_amount,
    o.zoho_salesorder_id,
    oi.product_id,
    oi.quantity,
    oi.price_at_time_of_purchase,
    oi.zoho_item_id,
    p.name as product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.customer_profile_id = '<test_customer_id>'
ORDER BY o.created_at DESC
LIMIT 5;
```

### **Phase 3: Confirm Order** ✅
**Action:** Send from WhatsApp
```
yes go ahead
```

**Expected:**
1. Order syncs to Zoho Books
2. Database updated:
   - `orders.zoho_salesorder_id` = "SO-12345"
   - `order_items.zoho_item_id` = Zoho product ID
3. PDF invoice sent via WhatsApp

**Verify Logs:**
```
[CHECKOUT] Order created, starting Zoho integration
[ZOHO_INTEGRATION] Success: SO-XXXXX
```

### **Phase 4: Test Personalized Pricing** 💰
**Action:** Send from WhatsApp
```
price for 8x100
```

**Expected Response:**
```
📦 NFF 8x100

✨ Your Special Price
━━━━━━━━━━━━━━━━━
🔹 ₹1.95/pc per piece
📦 *₹2343.60/carton*

📊 Breakdown:
   ₹1.95/pc × 1200 pcs = ₹2343.60/carton

📅 Last ordered: 14/10/2025

🛒 Ready to order? Let me know the quantity!
```

### **Phase 5: Create Direct Zoho Invoice** 📋
**Action:** In Zoho Books, create a NEW invoice:
- **Customer:** Same test customer
- **Product:** NFF 8x100
- **Quantity:** 3 cartons
- **Rate:** ₹2200.00 (discounted rate)
- **Status:** Confirmed

**Note the:**
- Sales Order ID (e.g., SO-12346)
- Invoice date

### **Phase 6: Manual Sync Trigger** 🔄
**Action:** Trigger sync manually or wait for scheduler

**Option A - Manual Trigger (Recommended for testing):**
```javascript
// Add to commands/admin.js temporarily
if (query === '/sync-zoho-now') {
    const { scheduleZohoOrderSync } = require('../services/zohoOrderSyncService');
    await scheduleZohoOrderSync();
    return { response: '✅ Zoho sync completed! Check logs for details.' };
}
```

Then send from admin WhatsApp:
```
/sync-zoho-now
```

**Option B - Wait for Scheduler:**
Wait up to 1 hour for automatic sync

**Expected Logs:**
```
[ZOHO_SYNC] Starting order sync for tenant: xxx
[ZOHO_SYNC] Found 1 Zoho orders
[ZOHO_SYNC] Created order SO-12346 from Zoho
[ZOHO_SYNC] Synced 1 new orders, updated 0 prices
```

### **Phase 7: Verify Database After Sync** 🔍
**Action:** Check database
```sql
SELECT 
    o.id as order_id,
    o.order_number,
    o.zoho_salesorder_id,
    o.status,
    o.created_at,
    oi.quantity,
    oi.price_at_time_of_purchase,
    p.name as product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.customer_profile_id = '<test_customer_id>'
ORDER BY o.created_at DESC;
```

**Expected Result:**
```
Row 1: (Most recent - from Zoho)
- order_id: <new_uuid>
- order_number: SO-12346
- zoho_salesorder_id: SO-12346
- status: confirmed
- quantity: 3
- price_at_time_of_purchase: 2200.00  ← Discounted Zoho price
- product_name: NFF 8x100

Row 2: (Original WhatsApp order)
- order_id: <original_uuid>
- order_number: <generated>
- zoho_salesorder_id: SO-12345
- status: confirmed
- quantity: 5
- price_at_time_of_purchase: 2343.60  ← Original catalog price
- product_name: NFF 8x100
```

### **Phase 8: Test Updated Personalized Pricing** 💰
**Action:** Send from WhatsApp
```
price for 8x100
```

**Expected Response (NOW SHOWS ZOHO PRICE!):**
```
📦 NFF 8x100

✨ Your Special Price
━━━━━━━━━━━━━━━━━
🔹 ₹1.83/pc per piece
📦 *₹2200.00/carton*  ← Updated from Zoho!

📊 Breakdown:
   ₹1.83/pc × 1200 pcs = ₹2200.00/carton

📅 Last ordered: 14/10/2025  ← Shows Zoho invoice date
💰 You save ₹143.60 from current catalog price!

🛒 Ready to order? Let me know the quantity!
```

---

## 🎯 **Success Criteria:**

✅ **Phase 1-2:** WhatsApp order creates order_items with catalog price (₹2343.60)  
✅ **Phase 3-4:** First price query shows catalog price (₹2343.60)  
✅ **Phase 5-6:** Zoho invoice syncs and creates new order_items with discounted price (₹2200.00)  
✅ **Phase 7:** Database shows 2 separate orders (WhatsApp + Zoho)  
✅ **Phase 8:** Price query now shows Zoho discounted price (₹2200.00) as most recent  

---

## 🔧 **Troubleshooting:**

### **If Zoho Sync Doesn't Work:**

1. **Check Zoho Credentials:**
```sql
SELECT 
    id,
    name,
    zoho_access_token IS NOT NULL as has_token,
    zoho_organization_id
FROM tenants
WHERE id = '<your_tenant_id>';
```

2. **Check Zoho Product Mapping:**
```sql
SELECT 
    id,
    name,
    zoho_item_id
FROM products
WHERE name LIKE '%8x100%';
```
If `zoho_item_id` is NULL, run:
```
/sync-zoho-products
```

3. **Check Customer Mapping:**
```sql
SELECT 
    id,
    phone,
    zoho_contact_id
FROM customer_profiles
WHERE phone = '<test_customer_phone>';
```

4. **Check Sync Logs:**
Look for errors in terminal:
```
[ZOHO_SYNC] Error: ...
```

### **If Price Doesn't Update:**

1. **Verify order_items has new row:**
```sql
SELECT COUNT(*) 
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.zoho_salesorder_id = 'SO-12346';
```
Should return 1 (or more if multiple line items)

2. **Check created_at dates:**
```sql
SELECT 
    o.created_at,
    oi.price_at_time_of_purchase
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.product_id = '<8x100_product_id>'
ORDER BY o.created_at DESC;
```
Zoho order should be newest

3. **Test query directly:**
```sql
SELECT 
    oi.price_at_time_of_purchase,
    o.created_at,
    o.order_number
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.product_id = '<8x100_product_id>'
  AND o.customer_profile_id = '<customer_id>'
  AND o.status IN ('pending', 'confirmed', 'completed')
ORDER BY o.created_at DESC
LIMIT 1;
```

---

## 📊 **Expected Timeline:**

| Time | Action | System State |
|------|--------|--------------|
| T+0min | Delete old orders | Database clean |
| T+1min | WhatsApp order | 1 order_items @ ₹2343.60 |
| T+2min | Confirm order | Synced to Zoho, got SO-12345 |
| T+3min | Check price | Shows ₹2343.60 |
| T+5min | Create Zoho invoice | Zoho has SO-12346 @ ₹2200.00 |
| T+10min | Trigger sync | 2 order_items now (WhatsApp + Zoho) |
| T+11min | Check price | Shows ₹2200.00 (most recent) ✅ |

---

## 📝 **Test Results Log:**

### **Test Run: [Date/Time]**

**Phase 1 - Clean Slate:**
- [ ] Orders deleted: ___
- [ ] Verified empty: ___

**Phase 2 - WhatsApp Order:**
- [ ] Message sent: ___
- [ ] Order created: order_id = ___
- [ ] Price saved: ₹___

**Phase 3 - Confirm Order:**
- [ ] Confirmed: yes/no
- [ ] Zoho SO ID: ___
- [ ] PDF received: yes/no

**Phase 4 - First Price Check:**
- [ ] Price shown: ₹___
- [ ] Expected: ₹2343.60
- [ ] Match: yes/no

**Phase 5 - Zoho Invoice:**
- [ ] Invoice created: SO-___
- [ ] Rate: ₹___
- [ ] Status: confirmed

**Phase 6 - Sync:**
- [ ] Sync triggered: manual/auto
- [ ] Sync completed: yes/no
- [ ] Logs show success: yes/no

**Phase 7 - Verify Database:**
- [ ] Total orders: ___
- [ ] Zoho order found: yes/no
- [ ] Zoho price: ₹___

**Phase 8 - Updated Price Check:**
- [ ] Price shown: ₹___
- [ ] Expected: ₹2200.00
- [ ] Match: yes/no
- [ ] Shows savings: yes/no

---

## ✅ **Test Completion:**

**Overall Result:** PASS / FAIL

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
