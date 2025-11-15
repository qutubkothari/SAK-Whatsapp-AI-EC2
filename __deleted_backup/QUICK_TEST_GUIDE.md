# Quick Test Reference - Personalized Pricing Test

## 🚀 **Quick Start Guide:**

### **1. Clean Database** (Supabase Dashboard)
```sql
-- Find your customer ID first
SELECT id, phone, first_name 
FROM customer_profiles 
WHERE phone = '+91XXXXXXXXXX';  -- Your test number

-- Delete old orders (use customer ID from above)
DELETE FROM order_items 
WHERE order_id IN (
    SELECT id FROM orders 
    WHERE customer_profile_id = '<customer_id>'
);

DELETE FROM orders 
WHERE customer_profile_id = '<customer_id>';
```

---

### **2. Place WhatsApp Order**
Send from WhatsApp:
```
8x100 5 cartons
```

Expected response:
```
✅ Added 5 carton(s) of "NFF 8x100" to cart.
Each carton: 1200 pieces
Total for this item: ₹11,718

Ready to checkout? Reply "yes go ahead"
```

---

### **3. Confirm Order**
Send:
```
yes go ahead
```

Expected:
```
📋 Sales Order Created!
Zoho Order: SO-XXXXX
Reference: order-XXX

[PDF invoice should arrive]
```

---

### **4. Check First Price** (Should show catalog price)
Send:
```
price for 8x100
```

Expected:
```
📦 NFF 8x100

✨ Your Special Price
━━━━━━━━━━━━━━━━━
🔹 ₹1.95/pc per piece
📦 *₹2343.60/carton*

📊 Breakdown:
   ₹1.95/pc × 1200 pcs = ₹2343.60/carton

📅 Last ordered: [today]

🛒 Ready to order? Let me know the quantity!
```

---

### **5. Create Zoho Invoice** (Zoho Books Dashboard)

**Steps:**
1. Go to Zoho Books → Sales → Sales Orders
2. Click "+ New"
3. Fill in:
   - **Customer:** [Your test customer]
   - **Item:** NFF 8x100
   - **Quantity:** 3
   - **Rate:** 2200.00 (discounted)
4. Click "Save" then "Confirm"
5. **Note the Sales Order number:** SO-XXXXX

---

### **6. Sync from Zoho** (WhatsApp)
Send as admin:
```
/sync-zoho
```

Expected response:
```
✅ Zoho order sync completed!

Check server logs for details.
Then test: "price for 8x100"
```

**Check server logs for:**
```
[ZOHO_SYNC] Starting order sync for tenant: xxx
[ZOHO_SYNC] Found 1 Zoho orders
[ZOHO_SYNC] Created order SO-XXXXX from Zoho
[ZOHO_SYNC] Synced 1 new orders, updated 0 prices
```

---

### **7. Verify Database** (Supabase)
```sql
SELECT 
    o.order_number,
    o.zoho_salesorder_id,
    o.created_at,
    oi.quantity,
    oi.price_at_time_of_purchase,
    p.name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.customer_profile_id = '<customer_id>'
ORDER BY o.created_at DESC;
```

**Expected Result:**
```
Row 1 (Zoho):
- order_number: SO-XXXXX
- zoho_salesorder_id: SO-XXXXX
- quantity: 3
- price_at_time_of_purchase: 2200.00  ← Zoho discounted price
- created_at: [newer timestamp]

Row 2 (WhatsApp):
- order_number: [generated]
- zoho_salesorder_id: SO-YYYYY
- quantity: 5
- price_at_time_of_purchase: 2343.60  ← Original catalog price
- created_at: [older timestamp]
```

---

### **8. Check Updated Price** (Should show Zoho price)
Send from WhatsApp:
```
price for 8x100
```

**Expected (UPDATED!):**
```
📦 NFF 8x100

✨ Your Special Price
━━━━━━━━━━━━━━━━━
🔹 ₹1.83/pc per piece
📦 *₹2200.00/carton*  ← Changed from ₹2343.60!

📊 Breakdown:
   ₹1.83/pc × 1200 pcs = ₹2200.00/carton

📅 Last ordered: [today - newer timestamp]
💰 You save ₹143.60 from current catalog price!

🛒 Ready to order? Let me know the quantity!
```

---

## ✅ **Success Checklist:**

- [ ] Database cleaned (0 orders for test customer)
- [ ] WhatsApp order placed (5 cartons @ ₹2343.60)
- [ ] Order confirmed and synced to Zoho
- [ ] First price check shows ₹2343.60
- [ ] Zoho invoice created (3 cartons @ ₹2200.00)
- [ ] `/sync-zoho` command executed successfully
- [ ] Database shows 2 orders (WhatsApp + Zoho)
- [ ] Second price check shows ₹2200.00 ✅

---

## 🐛 **Troubleshooting:**

### **Zoho Sync Fails:**
```sql
-- Check Zoho credentials
SELECT 
    zoho_access_token IS NOT NULL as has_token,
    zoho_organization_id
FROM tenants
WHERE id = '<tenant_id>';
```

### **Product Not Found:**
```sql
-- Check product mapping
SELECT id, name, zoho_item_id 
FROM products 
WHERE name LIKE '%8x100%';
```

If `zoho_item_id` is NULL, send:
```
/sync-zoho-products
```

### **Customer Not Matched:**
```sql
-- Check customer in Zoho
SELECT 
    phone,
    zoho_contact_id,
    first_name
FROM customer_profiles
WHERE phone = '+91XXXXXXXXXX';
```

Ensure Zoho contact has same phone number!

---

## 📊 **What You're Testing:**

### **Flow 1: WhatsApp → Database**
```
Customer orders → Saves to order_items → price_at_time_of_purchase = catalog
```

### **Flow 2: Zoho → Database**
```
Zoho invoice → Sync pulls → Saves to order_items → price_at_time_of_purchase = Zoho rate
```

### **Flow 3: Personalized Pricing**
```
Price query → Queries order_items → Sorts by date DESC → Returns most recent price
```

---

## 💡 **Key Points:**

1. **Two separate orders** will exist in database (WhatsApp + Zoho)
2. **Nothing is overwritten** - each order is a separate row
3. **Most recent wins** - Price query returns newest order's price
4. **Complete audit trail** - All historical prices preserved

---

## 🎯 **Expected Behavior:**

| Action | Database State | Price Query Result |
|--------|---------------|-------------------|
| Initial | 0 orders | Shows catalog: ₹2343.60 |
| After WhatsApp | 1 order @ ₹2343.60 | Shows: ₹2343.60 |
| After Zoho sync | 2 orders (2343.60 + 2200.00) | Shows: ₹2200.00 ✅ |

---

## 📝 **Server Must Be Running:**

Check terminal shows:
```
Server listening on port 8080
[SCHEDULER] All schedulers initialized successfully
[ZOHO_SYNC] Starting order sync...
```

If not running:
```bash
node index.js
```

---

## ⏱️ **Timing:**

- Clean database: 1 min
- WhatsApp order: 2 min
- Zoho invoice: 3 min
- Manual sync: 1 min
- Total: ~7 minutes

**Auto sync:** Would take up to 1 hour (scheduled)

---

## 🎉 **Success = Price Changes from ₹2343.60 → ₹2200.00**
