# Discount & Quantity Update Fix Summary
**Date:** October 18, 2025  
**Deployed Version:** auto-20251018-181816 (100% traffic)

## Critical Issues Fixed

### Issue 1: Double Discount Application ❌ → ✅
**Problem:** When customer accepted discount offer, prices were discounted TWICE:
1. First: Updated `last_quoted_products` with discounted prices (₹1.67 → ₹1.62)
2. Second: Cart system applied discount again (₹1.62 → ₹1.57)
3. Result: Customer got 6% discount instead of 3%!

**Fix:** Removed price update logic from discount acceptance. Let cart system handle discount application once.

**Files Modified:**
- `routes/handlers/customerHandler.js` (lines 1986-2016)

---

### Issue 2: "I need 100 cartons" Creating Wrong Order ❌ → ✅
**Problem:** When customer said "i need 100 cartons" after "best price?" offer:
- Message treated as ORDER CONFIRMATION instead of quantity update
- Order created with old quantity (1 carton instead of 100)
- Wrong discount applied (0% instead of 6%+)

**Root Causes:**
1. `isOrderConfirmationEnhanced()` didn't check for quantity specifications
2. Intent recognition classified it as `ORDER_CONFIRMATION`
3. Quantity update logic never executed

**Fixes Applied:**

#### Fix 2a: Prevent Quantity Specs from Being Confirmations
**File:** `routes/handlers/customerHandler.js` (lines 68-72)
```javascript
const hasQuantitySpecification = /(?:i\s*)?(?:need|want|make\s*it|give\s*me)\s+\d+\s*(?:cartons?|ctns?|pcs?|pieces?)/i.test(cleanQuery);
if (hasQuantitySpecification) {
    console.log('[ORDER_CONFIRM] Rejected - message contains quantity specification');
    return false; // NOT an order confirmation!
}
```

#### Fix 2b: Override Intent for Quantity Updates
**File:** `routes/handlers/customerHandler.js` (lines 1421-1467)
```javascript
// Check BOTH discount_offered AND discount_approved states
const hasQuantityUpdate = /(?:i\s*)?(?:need|want|make\s*it|give\s*me)\s+(\d+)\s*(?:cartons?|ctns?)/i.test(userQuery);
if (hasQuantityUpdate && conversation && 
    (conversation.state === 'discount_offered' || conversation.state === 'discount_approved')) {
    
    // Parse new quantity
    const newQuantity = parseInt(userQuery.match(/(\d+)\s*(?:cartons?|ctns?)/i)[1]);
    
    // Update last_quoted_products with new quantity
    const updatedProducts = quotedProducts.map(p => ({...p, quantity: newQuantity}));
    
    // Reset state and force DISCOUNT_REQUEST intent
    await supabase.from('conversations').update({
        last_quoted_products: JSON.stringify(updatedProducts),
        state: null,
        context_data: null
    });
    
    intentResult.intent = 'DISCOUNT_REQUEST';
    intentResult.confidence = 0.9;
}
```

**Why Check Both States?**
- `discount_offered`: Set when negotiation offers discount needing confirmation
- `discount_approved`: Set when `handleBestPriceRequest()` returns `approved: true`

---

### Issue 3: "Last Price" Enhancement ✨
**Feature:** When customer says "give me last price", system looks up their previous order discount and offers it automatically.

**File:** `services/discountNegotiationService.js` (lines 202-290)

**Flow:**
1. Query customer's last order with discount
2. Calculate discount percentage: `(discount_amount / subtotal_amount) × 100`
3. Show breakdown: "Last time you got 3% discount. I can offer you the same deal!"
4. Display discounted prices for all quoted products
5. Save as `offeredDiscount` for confirmation

---

## Test Scenarios

### Scenario 1: Normal Discount Flow ✅
```
Customer: "price 8x80"
Bot: "₹1.67/pc... Ready to order?"

Customer: "give me discount"  
Bot: "I can offer you 3% discount: ₹1.62/pc. Does that work?"

Customer: "yes go ahead"
Bot: [Creates order with 3% discount - prices correctly discounted ONCE]
```

### Scenario 2: Quantity Update After Best Price ✅
```
Customer: "price 8x80"
Bot: "₹1.67/pc..."

Customer: "best price?"
Bot: "Okay, 1 cartons - I'll give you 0% off. Ready to order?"

Customer: "i need 100 cartons"
→ Quantity update detected!
→ State reset, intent overridden to DISCOUNT_REQUEST
→ Re-runs discount negotiation with 100 cartons

Bot: "Here's my best: 6% discount on 100 cartons... Ready to order?"
```

### Scenario 3: Last Price Request ✅
```
Customer: "price 8x80"
Bot: "₹1.67/pc..."

Customer: "give me last price"
→ Looks up last order (had 3% discount)

Bot: "Great! Last time you got 3% discount. I can offer you the same deal!
      With 3% discount: 8x80: ₹1.62/pc (was ₹1.67/pc)
      Shall I apply this 3% discount to your order?"
```

---

## Deployment Info

**Version:** auto-20251018-181816  
**Traffic:** 100% (forced with `gcloud app services set-traffic`)  
**Status:** ✅ Active

**Previous Versions (replaced):**
- auto-20251018-175421 (double discount bug)
- auto-20251018-175748 (last price feature, incomplete)
- auto-20251018-180641 (quantity update, wrong state check)
- auto-20251018-181327 (quantity update, wrong placement)

---

## Key Learnings

1. **Discount Application:** Never update `last_quoted_products` prices - let cart system handle it once
2. **State Management:** `handleBestPriceRequest()` sets `discount_approved` (not `discount_offered`)
3. **Intent Override Timing:** Must happen AFTER intent recognition but BEFORE routing logic
4. **Order Confirmation Guards:** Check for quantity specifications to prevent false positives
5. **Traffic Management:** Use `set-traffic --splits` to force 100% to specific version

---

## Monitoring

Watch for these log patterns to verify fixes:
```bash
# Quantity update detection
gcloud app logs read | grep "QUANTITY_UPDATE"

# Order confirmation rejections
gcloud app logs read | grep "ORDER_CONFIRM.*Rejected"

# Discount approval flow
gcloud app logs read | grep "DISCOUNT_NEG.*Approved discount saved"
```

---

## Known Limitations

1. **"best price?" without context:** Still asks for quantity if no cart/quoted products
2. **Multiple quantity formats:** Only handles "X cartons" format, not "X ctns" or "X boxes"
3. **Decimal quantities:** Regex only catches integers (e.g., "10.5 cartons" won't match)

## Future Enhancements

- [ ] Support more quantity formats (ctns, boxes, pcs)
- [ ] Handle decimal quantities
- [ ] Add quantity update for discount_approved state with cart items
- [ ] Improve "best price" to proactively ask for quantity if missing
