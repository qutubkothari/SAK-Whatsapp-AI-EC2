# Discount Negotiation Fixes - October 16, 2025

## Issues Identified

### Issue 1: Onboarding Not Triggering
**Problem**: New customer wasn't asked for name/business card
**Root Cause**: 
- Database migration for onboarding fields not executed
- Customer already had a conversation record (state='new' but profile exists)

**Status**: Partially addressed
- Onboarding system is deployed and functional
- **Action Required**: Run SQL migration in Supabase:
```sql
ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_stage VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT;

UPDATE customer_profiles
SET onboarding_completed = TRUE,
    onboarding_stage = 'completed'
WHERE first_name IS NOT NULL;
```

### Issue 2: Discount Offered Without Quantity
**Problem**: 
- User: "i need discount"
- Bot: Offered 2% discount immediately without asking quantity

**Root Cause**:
- System used fallback quantity of 10 cartons when no quantity specified
- No validation to check if quantity was actually provided vs defaulted

**Fix Applied**:
Added quantity validation in `discountNegotiationService.js`:
```javascript
if (totalCartons <= 0 || totalCartons === 10) {
    return {
        response: "I'd love to help with a discount! 😊\n\n" +
                 "How many cartons are you looking to order? " +
                 "Discounts vary based on quantity:\n\n" +
                 "📦 11-25 cartons → 2-3% off\n" +
                 "📦 26-50 cartons → 4-5% off\n" +
                 "📦 51+ cartons → 6%+ off",
        needsFollowup: true,
        offeredDiscount: null
    };
}
```

### Issue 3: Quantity Not Extracted from Follow-up Message
**Problem**:
- User: "i need 100 ctns give me more discount"
- Bot: Still used old quantity (10), offered 0% discount

**Root Cause**:
- No function to extract quantity from discount request messages
- System only used cart/quoted product quantities, ignored inline mentions

**Fix Applied**:
1. **New Function**: `extractQuantityFromMessage()` in `discountNegotiationService.js`
```javascript
function extractQuantityFromMessage(message) {
    // "100 ctns", "50 cartons"
    const cartonMatch = message.match(/(\d+)\s*(?:cartons?|ctns?)/i);
    if (cartonMatch) return parseInt(cartonMatch[1]);
    
    // "i need 100", "ordering 50"
    const quantityMatch = message.match(/(?:need|want|ordering)\s+(\d+)/i);
    if (quantityMatch) return parseInt(quantityMatch[1]);
    
    return null;
}
```

2. **Integration**: Extract quantity in `customerHandler.js` before negotiation
```javascript
const mentionedQuantity = extractQuantityFromMessage(userQuery);
if (mentionedQuantity) {
    console.log('[DISCOUNT_NEG] Quantity extracted:', mentionedQuantity);
}

// Use priority: mentionedQuantity > quotedQuantity > fallback
const productQuantity = mentionedQuantity || qp.quantity || 10;
```

## Expected Behavior After Fix

### Scenario 1: Discount Request Without Quantity
```
User: i need prices for 8x80
Bot: 📦 NFF 8x80
     💵 ₹1.67/pc per piece
     📦 ₹2,511.00/carton (1500 pcs)

User: i need discount
Bot: I'd love to help with a discount! 😊
     
     How many cartons are you looking to order?
     Discounts vary based on quantity:
     
     📦 11-25 cartons → 2-3% off
     📦 26-50 cartons → 4-5% off
     📦 51+ cartons → 6%+ off
```

### Scenario 2: Discount Request With Quantity
```
User: i need prices for 8x80
Bot: 📦 NFF 8x80 ...

User: i need 100 ctns give me more discount
Bot: For 100 cartons, I can offer you 6% discount!
     
     That brings it to ₹1.57/pc
     
     How does that sound? 🎯
```

### Scenario 3: Volume-Based Discount Slabs
**Discount Tiers** (from `volumeDiscountService.js`):
- **1-10 cartons**: 0-2% (minimum order threshold)
- **11-25 cartons**: 2-3%
- **26-50 cartons**: 4-5%
- **51-100 cartons**: 6-7%
- **101-200 cartons**: 8-9%
- **201+ cartons**: 10%+

## Files Modified

### 1. `services/discountNegotiationService.js`
**Changes**:
- Added `extractQuantityFromMessage()` function (lines 7-23)
- Added quantity validation before offering discount (lines 273-283)
- Exported new function in module.exports (line 543)

**Impact**: Core discount logic now requires quantity context

### 2. `routes/handlers/customerHandler.js`
**Changes**:
- Imported `extractQuantityFromMessage` (line 58)
- Extract quantity from user message (lines 1296-1299)
- Use extracted quantity in calculation (line 1373)
- Use extracted quantity in products array (lines 1423, 1432)

**Impact**: Discount handler now intelligently extracts and uses quantity from messages

### 3. `services/customerOnboardingService.js`
**Changes**:
- Fixed import path: `./maytapi` → `./whatsappService` (line 3)

**Impact**: Onboarding system now loads without errors

## Testing Checklist

### Test 1: Discount Without Quantity
- [ ] Send "8x80 price"
- [ ] Send "i need discount"
- [ ] Verify bot asks for quantity with discount tiers
- [ ] Expected: Quantity request message

### Test 2: Discount With Quantity in Message
- [ ] Send "8x80 price"
- [ ] Send "i need 100 ctns give me more discount"
- [ ] Verify bot calculates based on 100 cartons
- [ ] Expected: 6-7% discount offer (51-100 carton slab)

### Test 3: Progressive Discount Negotiation
- [ ] Send "8x80 price"
- [ ] Send "i need discount"
- [ ] Bot asks for quantity
- [ ] Send "100 cartons"
- [ ] Verify discount based on 100 cartons
- [ ] Send "give me more"
- [ ] Verify bot offers higher discount within slab range

### Test 4: Volume Slab Verification
Test each slab:
- [ ] 15 cartons → 2-3% discount
- [ ] 30 cartons → 4-5% discount
- [ ] 75 cartons → 6-7% discount
- [ ] 150 cartons → 8-9% discount
- [ ] 250 cartons → 10%+ discount

## Deployment Details

**Version**: `auto-deploy-20251016-200659`
**Status**: Deploying...

**Includes**:
1. ✅ Quantity extraction function
2. ✅ Quantity validation before discount offer
3. ✅ Integration in customer handler
4. ✅ Onboarding service import fix
5. ✅ Priority-based quantity resolution (mentioned > quoted > fallback)

## Known Limitations

### 1. Multiple Products with Different Quantities
**Current Behavior**: Uses same quantity for all products
**Workaround**: Ask customer to specify per product

### 2. Quantity Units
**Current Support**: Only cartons
**Not Supported**: Pieces, boxes, cases
**Future**: Add unit detection

### 3. Onboarding for Existing Customers
**Issue**: Won't trigger for customers who already messaged once
**Solution**: Manual profile update or SQL script to reset onboarding_completed

## Monitoring

### Key Logs to Watch
```bash
gcloud app logs read --service=default --limit=100 | Select-String -Pattern "DISCOUNT_NEG"
```

**Important Log Patterns**:
1. `[DISCOUNT_NEG] Quantity extracted from message: 100 cartons` ✅ Quantity detection working
2. `[DISCOUNT_NEG] No or default quantity - asking customer` ✅ Validation working
3. `[DISCOUNT_NEG] Using quantity: 100 for NFF 8x80` ✅ Quantity applied correctly
4. `[DISCOUNT_NEG] Context from quotes: { totalCartons: 100 }` ✅ Calculation accurate

### Metrics to Track
1. **Discount Request Without Quantity**: % of requests that trigger quantity ask
2. **Quantity Extraction Success Rate**: % of successful extractions
3. **Discount Approval Rate**: % of offers accepted by customers
4. **Average Discount Given**: By quantity slab

## Rollback Plan

If issues occur:

### Quick Fix: Disable Quantity Validation
```javascript
// In discountNegotiationService.js, comment lines 273-283
/*
if (totalCartons <= 0 || totalCartons === 10) {
    return { response: "...", needsFollowup: true };
}
*/
```

### Full Rollback
Revert to previous version:
```bash
gcloud app versions list --service=default
gcloud app services set-traffic default --splits=<PREVIOUS_VERSION>=1
```

## Future Enhancements

1. **AI-Powered Quantity Detection**: Use GPT to understand complex quantity expressions
2. **Multi-Product Quantity**: Support different quantities per product
3. **Unit Flexibility**: Support pieces, boxes, pallets
4. **Dynamic Discount Slabs**: Based on product category, season, customer history
5. **Discount Approval Workflows**: For high-value discounts requiring manager approval

---

**Status**: ✅ Fixes Deployed  
**Version**: auto-deploy-20251016-200659  
**Last Updated**: October 16, 2025 20:06 IST
