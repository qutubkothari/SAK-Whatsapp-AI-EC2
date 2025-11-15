# Post-Zoho Upgrade Testing Plan

**Date:** November 10, 2025  
**Purpose:** Verify system functionality after Zoho Books subscription upgrade  
**Related Fixes:** Double discount removal + Zoho trial expiration

---

## Pre-Test Checklist

- [ ] Zoho Books subscription upgraded and active
- [ ] Zoho API credentials still valid
- [ ] Test WhatsApp number ready: ________________
- [ ] App Engine deployment confirmed: `auto-deploy-20251110-130955`

---

## Test 1: Basic Sales Order Creation

**Objective:** Verify Zoho integration works after upgrade

### Steps:
1. Send WhatsApp message: `"5 cartons 8x80"`
2. Bot shows cart with catalog price
3. Reply: `"yes checkout"`
4. Provide GST details if prompted
5. Confirm order

### Expected Results:
- ✅ Order created in local database
- ✅ Sales order created in Zoho Books
- ✅ `zoho_sales_order_id` populated in database
- ✅ `zoho_sync_status = 'synced'`
- ✅ PDF invoice generated and sent via WhatsApp
- ✅ Customer receives confirmation message

### Check Logs For:
```
[ZOHO_INTEGRATION] Success: <zoho_order_id>
[PDF_SEND] PDF delivered successfully
[CHECKOUT] Order created, starting Zoho integration
```

### Check Database:
```sql
SELECT 
  id,
  zoho_sales_order_id,
  zoho_sync_status,
  zoho_sync_error,
  total_amount
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

---

## Test 2: Discount Application (Single, Not Double)

**Objective:** Verify double discount fix works correctly

### Prerequisites:
- Dashboard discount rule configured (e.g., 2% on category)
- NEW customer (no previous orders)

### Steps:
1. Send: `"10 cartons 8x80"`
2. Bot shows cart (should be ₹25,050 for 10 @ ₹2505)
3. Send: `"give me discount"`
4. Bot applies 2% discount (₹501)
5. Cart should show ₹24,549 subtotal
6. Send: `"yes checkout"`
7. Complete order

### Expected Results:
- ✅ Cart shows: Discount ₹501 (2%)
- ✅ Checkout uses: SAME ₹501 (NOT ₹1,002)
- ✅ Order total: ₹24,549 + shipping + GST
- ✅ Zoho sales order reflects ₹24,549 subtotal

### Check Logs For:
```
[CHECKOUT] Automatic dashboard discounts DISABLED at checkout
[CHECKOUT] Using pre-approved discount from cart: 501
[PRICING] Subtotal calculated: { totalDiscount: 501 }
```

### Should NOT See:
```
❌ [CHECKOUT] Automatic discounts applied
❌ [PRICING] Volume discount applied
❌ totalDiscount: 1002
```

### Verify in Database:
```sql
SELECT 
  id,
  original_amount,
  discount_amount,
  subtotal_amount,
  total_amount
FROM orders
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- original_amount: 25050
-- discount_amount: 501
-- subtotal_amount: 24549
-- NOT: discount_amount: 1002
```

---

## Test 3: Returning Customer (No Auto-Discount)

**Objective:** Verify returning customers don't get automatic discounts

### Prerequisites:
- Customer with previous orders
- Previous order had different price

### Steps:
1. Send: `"10 cartons 8x80"`
2. Bot shows last purchase prices
3. Send: `"give me discount"`
4. Bot should escalate to human (no auto-approval)

### Expected Results:
- ✅ Cart shows last purchase price
- ✅ Discount request escalated (not auto-applied)
- ✅ No automatic dashboard discount applied
- ✅ If human approves → stored in cart → used at checkout

---

## Test 4: Full Order Flow with Shipping Info

**Objective:** Complete end-to-end order with all details

### Steps:
1. Create order: `"20 cartons 8x80"`
2. Request discount: `"give me discount"`
3. Checkout: `"yes checkout"`
4. Provide GST if needed
5. Provide shipping address when prompted
6. Provide transporter details

### Expected Results:
- ✅ Order created
- ✅ Zoho sales order created
- ✅ Shipping details attached to Zoho order
- ✅ Invoice PDF includes shipping info
- ✅ All sync successful

---

## Test 5: Retry Failed Orders

**Objective:** Process orders that failed during trial period

### Find Failed Orders:
```sql
SELECT 
  id,
  created_at,
  total_amount,
  customer_name,
  zoho_sync_error
FROM orders
WHERE zoho_sync_status = 'failed'
AND zoho_sync_error LIKE '%trial%over%'
ORDER BY created_at DESC
LIMIT 10;
```

### Manual Retry (If Needed):
For each failed order, you can:
1. Manually create sales order in Zoho Books
2. Copy order details from database
3. Update order record:
```sql
UPDATE orders 
SET 
  zoho_sales_order_id = '<zoho_order_id>',
  zoho_sync_status = 'synced',
  zoho_synced_at = NOW()
WHERE id = '<order_id>';
```

---

## Monitoring Commands

### Tail Live Logs:
```powershell
gcloud app logs tail --project=sak-whatsapp-ai-sales-assist --service=default
```

### Filter for Specific Patterns:
```powershell
# Zoho integration
gcloud app logs tail --project=sak-whatsapp-ai-sales-assist | Select-String "ZOHO"

# Discount application
gcloud app logs tail --project=sak-whatsapp-ai-sales-assist | Select-String "DISCOUNT|preApproved"

# Checkout flow
gcloud app logs tail --project=sak-whatsapp-ai-sales-assist | Select-String "CHECKOUT"
```

### Read Recent Logs:
```powershell
gcloud app logs read --project=sak-whatsapp-ai-sales-assist --limit=100 | Select-String "ZOHO_INTEGRATION"
```

---

## Success Criteria

### ✅ All Tests Pass If:
1. Orders create sales orders in Zoho (no "trial expired" error)
2. PDF invoices generated and sent
3. Discounts applied ONCE (not doubled)
4. Cart amount = Checkout amount = Order amount
5. Returning customers see last purchase prices
6. New customers see catalog prices with dashboard discounts

### 🚨 Issues to Watch For:
- Double discount still appearing (₹1,002 instead of ₹501)
- Zoho sync still failing
- PDF not generating
- Wrong prices shown to customers

---

## Rollback Plan (If Issues Found)

If critical issues discovered:

1. **Quick Fix Available:**
   - Deploy hotfix
   - Test again

2. **Need Investigation:**
   - Roll back to previous version:
   ```bash
   gcloud app versions list --project=sak-whatsapp-ai-sales-assist
   gcloud app services set-traffic default --splits <previous-version>=1
   ```

3. **Notify:**
   - Document issue
   - Create fix plan
   - Test in dev environment

---

## Post-Testing Actions

After successful tests:

- [ ] Document any issues found
- [ ] Update customer-facing documentation if needed
- [ ] Monitor for 24 hours for edge cases
- [ ] Archive failed orders documentation
- [ ] Update team on changes

---

## Contact Information

**Zoho Support:**
- https://help.zoho.com/portal/en/home
- Check billing status: Zoho Books → Settings → Subscription

**App Engine:**
- Project: sak-whatsapp-ai-sales-assist
- Current version: auto-deploy-20251110-130955
- Dashboard: https://console.cloud.google.com/appengine

---

**Ready to test after Zoho upgrade is complete! ✅**
