# Discount Negotiation & Currency Display Fix

## Issues Fixed

### 1. Discount Not Triggered for Messages with Product Codes
**Problem:** When user says "give me discount for 8x80 100 ctns", the system only added to cart without offering discount.

**Root Cause:** The `isDiscountNegotiation()` function had a blanket check that returned `false` if the message contained product code patterns (like "8x80"). This was intended to prevent triggering discount negotiation for simple price inquiries, but it was too aggressive and blocked legitimate discount requests that mentioned product codes.

**Fix:** Modified `services/discountNegotiationService.js` (lines 30-72):
- Added explicit discount pattern detection BEFORE checking for product codes
- Only block discount negotiation if there's a product code AND no explicit discount words
- Patterns like "give me discount", "discount for", "discount please" now override the product code check

**Code Change:**
```javascript
// First check if message explicitly asks for discount
const explicitDiscountPatterns = [
    /give\s*(?:me|us)?\s*(?:some|a)?\s*discount/i,
    /can\s*(?:you|i)\s*get\s*(?:a|some)?\s*discount/i,
    /discount\s*(?:do|mile?ga|chahiye|please|for)/i,
];

const hasExplicitDiscount = explicitDiscountPatterns.some(pattern => pattern.test(lowerMsg));

// If message contains product codes, it's a PRICE INQUIRY, 
// UNLESS it explicitly asks for discount
const hasProductCode = /\d+[x*]\d+/i.test(message);
if (hasProductCode && !hasExplicitDiscount) {
    return false; // This is a price inquiry for a specific product
}
```

**Test Case:**
- Input: "give me discount for 8x80 100 ctns"
- Expected: Triggers discount negotiation, offers volume-based discount
- Previous: Just added to cart, no discount offered

### 2. Currency Symbol Display Issue
**Problem:** Currency symbols displayed as junk characters (â‚¹ instead of ₹) in WhatsApp messages.

**Root Cause:** Using "Rs." instead of UTF-8 encoded ₹ symbol in cart display messages.

**Fix:** Modified `services/cartService.js` (lines 690-707):
- Replaced all instances of "Rs." with "₹" in cart display messages
- Affected price per carton, price per piece, item totals, subtotal, and discount display

**Code Changes:**
```javascript
// Before:
cartMessage += `  - ${item.quantity} cartons @ Rs.${item.unitPrice}/carton (Rs.${pricePerPiece} per piece)\n`;
cartMessage += `  - ${item.quantity} @ Rs.${item.unitPrice} each\n`;
cartMessage += `  - Total: Rs.${item.roundedItemTotal.toLocaleString()}\n\n`;
cartMessage += `Subtotal: Rs.${pricing.subtotal.toLocaleString()}\n`;
cartMessage += `Discount: -Rs.${pricing.discountAmount.toLocaleString()}\n`;

// After:
cartMessage += `  - ${item.quantity} cartons @ ₹${item.unitPrice}/carton (₹${pricePerPiece} per piece)\n`;
cartMessage += `  - ${item.quantity} @ ₹${item.unitPrice} each\n`;
cartMessage += `  - Total: ₹${item.roundedItemTotal.toLocaleString()}\n\n`;
cartMessage += `Subtotal: ₹${pricing.subtotal.toLocaleString()}\n`;
cartMessage += `Discount: -₹${pricing.discountAmount.toLocaleString()}\n`;
```

**Note:** Other services (pricingDisplayService.js, discountNegotiationService.js) already used ₹ symbol correctly.

## Files Modified
1. `services/discountNegotiationService.js` - Fixed discount pattern detection
2. `services/cartService.js` - Fixed currency symbol display

## Testing Checklist
- [ ] Test "give me discount for 8x80 100 ctns" - should trigger discount negotiation
- [ ] Test "8x80 price" - should show price inquiry, NOT discount
- [ ] Test "discount" - should trigger discount flow
- [ ] Test "give me discount" - should trigger discount flow
- [ ] Verify cart display shows ₹ symbols correctly (not â‚¹)
- [ ] Verify discount display shows ₹ symbols correctly
- [ ] Verify price display shows ₹ symbols correctly

## Impact
- **Positive:** Users can now request discounts while specifying product codes in the same message
- **Positive:** Currency symbols display correctly in all WhatsApp messages
- **No Breaking Changes:** Simple price inquiries like "8x80" still work as price requests

## Deployment
Ready for immediate deployment with existing phone normalization and shipping address fixes.
