# Quick Test Guide - Critical Fixes

**Deployment Version:** auto-deploy-20251021-212845  
**Test Customer:** 919106886259  
**Bot Number:** 918484830021

---

## Test 1: Discount with Product Code
**Test Message:** `give me discount for 8x80 100 ctns`

**Expected Behavior:**
1. ✅ System adds 100 cartons of 8x80 to cart
2. ✅ System detects discount request and triggers negotiation flow
3. ✅ Bot offers volume-based discount (6%+ for 100 cartons)
4. ✅ Response includes discount offer, not just cart confirmation

**What to Check:**
- Bot should say something like: "I can offer you X% discount on 100 cartons"
- Cart should show discounted price
- Currency symbols should display as ₹ (not â‚¹)

**Previous Issue:** Only added to cart, no discount offered

---

## Test 2: Currency Symbol Display
**Test Message:** `cart` or `8x80 100 ctns`

**Expected Behavior:**
1. ✅ All prices show ₹ symbol correctly
2. ✅ No junk characters (â‚¹, â‚º, etc.)
3. ✅ Format: `₹2,511` or `₹2.90/pc`

**What to Check:**
- Price per carton: `₹X.XX/carton`
- Price per piece: `₹X.XX per piece`
- Subtotal: `₹X,XXX`
- Discount: `-₹XXX`

**Previous Issue:** Showed â‚¹ instead of ₹

---

## Test 3: Phone Normalization (New Customer)
**Test Message:** Use a NEW test number to order

**Expected Behavior:**
1. ✅ Only ONE customer profile created in database
2. ✅ Phone saved in normalized format (digits only, no @c.us)
3. ✅ All subsequent messages link to same profile

**Database Check:**
```sql
SELECT id, phone, first_name FROM customer_profiles 
WHERE phone LIKE '%TESTNUMBER%' OR phone LIKE '%TESTNUMBER@c.us%';
```

**Expected Result:** Only 1 row returned, phone without @c.us

**Previous Issue:** Created 2 profiles - one with @c.us, one without

---

## Test 4: Shipping Address Field Mapping
**Test Message:** 
1. First: `8x80 100 ctns`
2. When asked for shipping: `Pune, Maharashtra 411060`

**Expected Behavior:**
1. ✅ Pincode "411060" saves to `default_shipping_pincode` field
2. ✅ City "Pune" saves to `default_shipping_city` field
3. ✅ State "Maharashtra" saves to `default_shipping_state` field

**Database Check:**
```sql
SELECT 
    default_shipping_pincode,
    default_shipping_city,
    default_shipping_state,
    default_transporter_contact
FROM customer_profiles 
WHERE phone = '919106886259';
```

**Expected Result:**
- `default_shipping_pincode`: `411060`
- `default_shipping_city`: `Pune`
- `default_shipping_state`: `Maharashtra`
- `default_transporter_contact`: Should NOT contain pincode

**Previous Issue:** Pincode was saved to `default_transporter_contact` instead

---

## Test 5: Normal Price Inquiry (Should NOT Trigger Discount)
**Test Message:** `8x80 price` or `what is 8x80 price`

**Expected Behavior:**
1. ✅ Shows product price information
2. ✅ Does NOT trigger discount negotiation
3. ✅ No "I can offer discount" message

**What to Check:**
- Response should be price display only
- Should NOT say "How many cartons?" or offer discount
- Currency should show ₹ correctly

**Previous Behavior:** Should remain unchanged (this already worked)

---

## Test 6: Generic Discount Request
**Test Message:** `discount` or `give me discount`

**Expected Behavior:**
1. ✅ Triggers discount negotiation
2. ✅ Asks for quantity or product
3. ✅ Offers volume-based discount tiers

**What to Check:**
- Bot should ask "How many cartons?" or show discount tiers
- Should handle gracefully even without product in context

**Previous Behavior:** Should remain unchanged (this already worked)

---

## Quick SQL Checks

### Check for Duplicate Profiles
```sql
SELECT phone, COUNT(*) as count
FROM customer_profiles
GROUP BY phone
HAVING COUNT(*) > 1;
```
**Expected:** 0 rows (no duplicates)

### Check Shipping Address Fields
```sql
SELECT 
    phone,
    default_shipping_pincode,
    default_shipping_city,
    default_shipping_state,
    LENGTH(default_transporter_contact) as contact_length
FROM customer_profiles 
WHERE default_shipping_pincode IS NOT NULL
LIMIT 5;
```
**Expected:** Pincode in correct field, not in transporter_contact

---

## Issue Reporting

If any test fails, report:
1. **Test number** that failed
2. **Message sent** to bot
3. **Actual response** received
4. **Expected behavior** (from above)
5. **Screenshots** if available

---

## Success Criteria Summary

✅ All 6 tests pass  
✅ No duplicate customer profiles  
✅ Currency symbols display correctly  
✅ Discount triggers with product codes  
✅ Shipping addresses in correct fields  
✅ Price inquiries don't trigger discount  

---

**Deployment URL:** https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com  
**Version:** auto-deploy-20251021-212845  
**Status:** ✅ LIVE
