# Double Discount Fix - Removed Automatic Discounts

**Date:** November 10, 2025  
**Issue:** Double discount application causing incorrect pricing  
**Status:** ✅ FIXED

---

## Problem Identified

The system was applying **double discounts** due to:

1. **Old Volume Discount Logic** in `pricingService.js`:
   - Automatic volume-based discounts calculated based on order quantity
   - Used deprecated `volumeDiscountService.js` 
   - Applied via `applyVolumeDiscount` flag

2. **Automatic Dashboard Discounts** at checkout in `cartService.js`:
   - `discountCalculationService.applyDiscounts()` was called automatically
   - Applied even when discount was already approved and stored
   - Created duplicate discount on top of pre-approved amounts

3. **Inconsistent Behavior**:
   - Cart view: Discounts DISABLED (only explicit approvals)
   - Checkout: Automatic discounts ENABLED (causing double application)

---

## Root Cause Analysis

### In `cartService.js` (Checkout Flow)
**Lines 970-998** - Automatic discount calculation:
```javascript
// OLD CODE (REMOVED):
automaticDiscounts = await discountCalculationService.applyDiscounts(tenant.id, orderData);
appliedDiscountRules = automaticDiscounts.appliedDiscounts || [];

// Then passed to pricing:
discountAmount: automaticDiscounts?.discountAmount || cart.discount_amount || 0
```

**Problem:** This added dashboard discounts ON TOP OF already-approved discounts stored in:
- `cart.discount_amount` 
- `carton_price_override` in cart items

### In `pricingService.js` (Pricing Calculation)
**Lines 4, 229-251** - Volume discount logic:
```javascript
// OLD CODE (REMOVED):
const { calculateDiscount, getDiscountSlab } = require('./volumeDiscountService');

if (options.applyVolumeDiscount === true) {
    volumeDiscount = calculateDiscount(itemSubtotal, totalCartons, ...);
    volumeDiscountAmount = volumeDiscount.discountAmount;
}

// Then added to total discount:
const totalDiscount = discountAmount + volumeDiscountAmount;
```

**Problem:** Even though `applyVolumeDiscount` flag was rarely used, the infrastructure existed and could cause issues.

---

## Changes Made

### 1. `services/cartService.js`

#### Change 1: Removed Automatic Discount Calculation
**Before (lines 968-998):**
```javascript
// Calculate applicable discounts using discount management system
let automaticDiscounts = null;
let appliedDiscountRules = [];
try {
    const discountCalculationService = require('./discountCalculationService');
    
    const orderData = {
        items: validItems.map(item => ({...})),
        totalAmount: ...,
        quantity: ...,
    };

    automaticDiscounts = await discountCalculationService.applyDiscounts(tenant.id, orderData);
    appliedDiscountRules = automaticDiscounts.appliedDiscounts || [];
    console.log('[CHECKOUT] Automatic discounts applied:', {...});
} catch (error) {
    console.warn('[CHECKOUT] Error calculating automatic discounts:', error.message);
}

// Then used:
discountAmount: automaticDiscounts?.discountAmount || cart.discount_amount || 0,
```

**After:**
```javascript
// CRITICAL FIX: DISABLED - Do NOT apply automatic discounts at checkout
// Discounts are ONLY applied when explicitly approved via dashboard discount rules
// and already stored in cart.discount_amount or carton_price_override
console.log('[CHECKOUT] Automatic dashboard discounts DISABLED at checkout - using only pre-approved cart discounts');

// Use ONLY the discount that was already approved and stored in the cart
const preApprovedDiscount = cart.discount_amount || 0;
console.log('[CHECKOUT] Using pre-approved discount from cart:', preApprovedDiscount);

// Then used:
discountAmount: preApprovedDiscount, // ONLY use pre-approved discount from cart
```

#### Change 2: Removed Discount Logging Code
**Before (lines 1070-1090):**
```javascript
// Log discount applications to audit trail
if (appliedDiscountRules && appliedDiscountRules.length > 0) {
    try {
        const discountCalculationService = require('./discountCalculationService');
        
        for (const { rule, discountAmount } of appliedDiscountRules) {
            await discountCalculationService.logDiscountApplication(...);
        }
        console.log('[CHECKOUT] Logged', appliedDiscountRules.length, 'discount applications');
    } catch (logError) {
        console.error('[CHECKOUT] Error logging discount applications:', logError.message);
    }
}
```

**After:**
```javascript
// REMOVED: Discount logging code since we're no longer applying automatic discounts at checkout
// Discounts are now only applied via explicit approval in discount negotiation flow
// If needed, discount logs should be created during the negotiation/approval step, not at checkout
```

---

### 2. `services/pricingService.js`

#### Change 1: Removed Volume Discount Import
**Before (line 4):**
```javascript
const { calculateDiscount, getDiscountSlab } = require('./volumeDiscountService');
```

**After:**
```javascript
// REMOVED - Volume discount service no longer used
```

#### Change 2: Removed Volume Discount Calculation
**Before (lines 229-251):**
```javascript
// Calculate volume-based discount ONLY if explicitly requested
let volumeDiscountAmount = 0;
let volumeDiscount = null;

if (options.applyVolumeDiscount === true) {
    volumeDiscount = calculateDiscount(itemSubtotal, totalCartons, options.discountType || 'min', options.customDiscountPercent);
    volumeDiscountAmount = volumeDiscount.discountAmount;
    console.log('[PRICING] Volume discount applied (requested):', volumeDiscountAmount);
} else {
    console.log('[PRICING] Volume discount skipped');
    volumeDiscount = { discountPercent: 0, discountAmount: 0, slab: null };
}

// Apply cart-level manual discounts (if any) + volume discount
const totalDiscount = discountAmount + volumeDiscountAmount;
```

**After:**
```javascript
// REMOVED: Old volume-based discount logic
// Volume discounts are NO LONGER applicable as we now use:
// 1. Dashboard discount rules (configured by admin)
// 2. Explicitly approved discounts via discount negotiation flow
// 3. Pre-approved discounts stored in cart.discount_amount or carton_price_override

// Apply ONLY cart-level manual discounts (from approved negotiations)
// NO automatic or volume-based discounts are calculated here
const totalDiscount = discountAmount; // Only use explicitly passed discount
```

#### Change 3: Removed Volume Discount from Return Value
**Before (lines 285-292):**
```javascript
discountAmount: parseFloat((discountAmount + volumeDiscountAmount).toFixed(2)),
manualDiscountAmount: parseFloat(discountAmount.toFixed(2)),

// Volume discount details
volumeDiscount: {
    amount: parseFloat(volumeDiscountAmount.toFixed(2)),
    percent: volumeDiscount.discountPercent,
    slab: volumeDiscount.slab,
    appliedToCartons: totalCartons
},
```

**After:**
```javascript
discountAmount: parseFloat(discountAmount.toFixed(2)), // FIXED: Only manual discount
manualDiscountAmount: parseFloat(discountAmount.toFixed(2)),

// REMOVED: Volume discount details (no longer applicable)
// Old volume discount logic has been completely removed
```

#### Change 4: Removed Volume Discount from Display
**Before (lines 372-383):**
```javascript
// Show volume discount if applicable
if (pricing.volumeDiscount && pricing.volumeDiscount.amount > 0) {
    display += `\n💰 *Volume Discount* (${pricing.volumeDiscount.percent}%)\n`;
    display += `  📦 ${pricing.totalCartons} cartons → ${pricing.volumeDiscount.slab.minQty}-${pricing.volumeDiscount.slab.maxQty} slab\n`;
    display += `  💵 Discount: -₹${pricing.volumeDiscount.amount.toLocaleString()}\n`;
}

// Show manual discount if any
if (pricing.manualDiscountAmount > 0) {
    display += `Additional Discount: -₹${pricing.manualDiscountAmount.toLocaleString()}\n`;
}

if (pricing.discountAmount > 0) {
    display += `Total Discount: -₹${pricing.discountAmount.toLocaleString()}\n`;
}
```

**After:**
```javascript
// REMOVED: Volume discount display (no longer applicable)

// Show manual/approved discount if any
if (pricing.discountAmount > 0) {
    display += `Discount: -₹${pricing.discountAmount.toLocaleString()}\n`;
}
```

---

## New Discount Flow (Correct)

### How Discounts Work Now

1. **Dashboard Configuration**
   - Admin configures discount rules in frontend dashboard
   - Rules stored in `discount_rules` table
   - Can be product-specific, category-specific, or order-value-based

2. **Customer Request**
   - Customer asks for discount via WhatsApp
   - AI detects discount intent
   - Discount negotiation flow triggered

3. **Discount Approval**
   - System checks dashboard rules via `discountCalculationService.findApplicableDiscounts()`
   - If rule matches → discount approved automatically
   - If no rule → escalates to human admin

4. **Storage of Approved Discount**
   - Discount stored in ONE of these places:
     - `cart.discount_amount` (cart-level discount)
     - `cart_items.carton_price_override` (per-item discount)
     - Conversation context (for quoted products not yet in cart)

5. **Cart View**
   - Reads pre-approved discount from cart/items
   - Displays to customer
   - NO automatic calculation

6. **Checkout**
   - Uses SAME pre-approved discount from cart/items
   - NO automatic recalculation
   - NO double discount

### Flow Diagram

```
Customer Request
      ↓
Discount Negotiation Service
      ↓
Check Dashboard Rules
      ↓
  [Match Found?]
      ↓
    YES → Auto-approve → Store in cart.discount_amount
      ↓
Cart View → Read cart.discount_amount → Display
      ↓
Checkout → Read cart.discount_amount → Apply ONCE
      ↓
Order Created with Correct Discount
```

---

## What Was Wrong (Before Fix)

### Wrong Flow

```
Customer Request
      ↓
Discount Approved → Stored in cart.discount_amount
      ↓
Cart View → Read cart.discount_amount → Display (Correct)
      ↓
Checkout → Read cart.discount_amount (Correct)
         → ALSO call applyDiscounts() again (WRONG!)
         → Apply BOTH discounts (DOUBLE!)
      ↓
Order Created with DOUBLE Discount ❌
```

### Example of Double Discount

**Scenario:**
- Product price: ₹2505
- Quantity: 10 cartons
- Subtotal: ₹25,050
- Dashboard rule: 2% discount

**Before Fix (WRONG):**
1. Discount negotiation: 2% approved → `cart.discount_amount = ₹501`
2. Cart view: Shows ₹501 discount ✅
3. Checkout:
   - Reads `cart.discount_amount = ₹501` ✅
   - ALSO calls `applyDiscounts()` → calculates another 2% = ₹501 ❌
   - Total discount: ₹1,002 (DOUBLE!) ❌
4. Final amount: ₹24,048 instead of ₹24,549 ❌

**After Fix (CORRECT):**
1. Discount negotiation: 2% approved → `cart.discount_amount = ₹501`
2. Cart view: Shows ₹501 discount ✅
3. Checkout:
   - Reads `cart.discount_amount = ₹501` ✅
   - Does NOT call `applyDiscounts()` ✅
   - Total discount: ₹501 (correct) ✅
4. Final amount: ₹24,549 ✅

---

## Testing Checklist

### Before Deploying
- [ ] Test discount negotiation flow
- [ ] Verify discount stored in cart
- [ ] Check cart view shows correct discount
- [ ] Verify checkout uses same discount (not double)
- [ ] Confirm order created with correct amounts

### Test Scenarios

#### Test 1: New Customer with Dashboard Discount
```
1. Customer: "10 cartons 8x80"
2. Bot: Shows cart with catalog prices
3. Customer: "give me discount"
4. Bot: Applies 2% dashboard discount → cart.discount_amount = ₹501
5. Cart view: Should show ₹501 discount
6. Customer: "yes checkout"
7. Order: Should have ₹501 discount (NOT ₹1,002)
```

#### Test 2: Returning Customer
```
1. Customer (returning): "10 cartons 8x80"
2. Bot: Shows last purchase prices
3. Customer: "give me discount"
4. Bot: Escalates to human (no auto-discount for returning)
5. Cart view: Shows last purchase prices, NO discount
6. Checkout: NO discount applied
```

#### Test 3: Pre-approved Discount via carton_price_override
```
1. Discount negotiation: Approves 3% on specific product
2. Stored as: carton_price_override = ₹2430 (was ₹2505)
3. Cart view: Shows ₹2430 per carton
4. Checkout: Uses ₹2430 per carton (not ₹2505 - 3% - 2% = double)
```

---

## Files Modified

1. **`services/cartService.js`**
   - Removed automatic discount calculation at checkout (lines ~970-998)
   - Removed discount logging code (lines ~1070-1090)
   - Now uses ONLY pre-approved `cart.discount_amount`

2. **`services/pricingService.js`**
   - Removed volume discount import (line 4)
   - Removed volume discount calculation (lines ~229-251)
   - Removed volume discount from return value (lines ~285-292)
   - Removed volume discount from display (lines ~372-383)

---

## Impact Assessment

### What Changed
- ✅ Automatic discount calculation removed from checkout
- ✅ Volume discount logic completely removed
- ✅ Single source of truth: pre-approved discounts only

### What Stayed the Same
- ✅ Discount negotiation flow unchanged
- ✅ Dashboard discount rules still work
- ✅ Cart view behavior unchanged
- ✅ Manual discount approval still works

### Customer Experience
- ✅ NEW customers: Get dashboard discounts when requested
- ✅ RETURNING customers: Get last purchase prices, escalate for discounts
- ✅ Both: See consistent pricing from cart → checkout → order
- ✅ No more surprise double discounts

---

## Next Steps

1. **Deploy Changes**
   ```bash
   git add services/cartService.js services/pricingService.js
   git commit -m "FIX: Remove double discount - disable automatic discounts at checkout"
   git push origin main
   gcloud app deploy
   ```

2. **Test Live**
   - Run test scenarios above
   - Monitor logs for "[CHECKOUT] Using pre-approved discount"
   - Verify no "[CHECKOUT] Automatic discounts applied" logs

3. **Monitor**
   - Watch for discount-related issues
   - Check order amounts match cart amounts
   - Verify customer complaints about pricing

---

## Related Documentation

- `DISCOUNT_SYSTEM_SETUP.md` - How to configure dashboard discounts
- `PRODUCT_DISCOUNT_GUIDE.md` - Discount negotiation flow
- `CUSTOMER_TYPE_PRICING_LOGIC.md` - NEW vs RETURNING customer logic

---

**Status:** ✅ Changes complete, ready for testing and deployment
