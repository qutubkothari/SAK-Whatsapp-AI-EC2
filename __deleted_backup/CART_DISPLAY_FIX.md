# Cart Display Fix - Per-Piece Price Missing

## Date: October 18, 2025, 20:50

### Problem Reported
User noticed the cart display layout changed and per-piece price was missing:

**Before (Correct):**
```
NFF 8x80
- 7 cartons (10,500 pieces)
- ₹2511/carton (₹1.67/pc)
- Total: ₹17,577
```

**After (Missing per-piece price):**
```
NFF 8x80
- 7 carton(s) (10,500 pieces)
- 7 cartons @ ₹2511/carton
- Total: ₹17,577
```

### Root Cause
In `services/cartService.js` line 522-540, the cart display logic was changed and the per-piece price calculation was removed:

```javascript
// ❌ OLD - Missing per-piece price
if (originalItem?.product.packaging_unit === 'carton' && originalItem?.product.units_per_carton) {
    const totalPieces = item.quantity * originalItem.product.units_per_carton;
    cartMessage += `  - ${item.quantity} carton(s) (${totalPieces.toLocaleString()} pieces)\n`;
}
cartMessage += `  - ${item.quantity} cartons @ ₹${item.unitPrice}/carton\n`;
```

### Solution
Added back the per-piece price calculation and improved the display format:

```javascript
// ✅ NEW - With per-piece price
if (originalItem?.product.packaging_unit === 'carton' && originalItem?.product.units_per_carton) {
    const totalPieces = item.quantity * originalItem.product.units_per_carton;
    const pricePerPiece = (item.unitPrice / originalItem.product.units_per_carton).toFixed(2);
    cartMessage += `  - ${item.quantity} carton(s) (${totalPieces.toLocaleString()} pieces)\n`;
    cartMessage += `  - ${item.quantity} cartons @ ₹${item.unitPrice}/carton (₹${pricePerPiece}/pc)\n`;
} else {
    cartMessage += `  - Qty: ${item.quantity}\n`;
    cartMessage += `  - ${item.quantity} @ ₹${item.unitPrice} each\n`;
}
```

### New Display Format
```
🛒 **Your Shopping Cart**

**NFF 8x80**
  - 7 carton(s) (10,500 pieces)
  - 7 cartons @ ₹2511/carton (₹1.67/pc)
  - Total: ₹17,577

**Pricing Breakdown:**
Subtotal: ₹15,312.08
Discount: -₹2,264.92
Shipping: ₹140 (7 cartons × ₹20)
GST (18%): ₹2,781.37
**Final Total: ₹18,234** (rounded from ₹18,233.45)

To complete purchase: say "yes go ahead" or type /checkout

Ready to place order? Reply "yes go ahead" to checkout.
```

### Files Modified
- `services/cartService.js` (Lines 522-541)

### Note on Quantity Calculation
The system correctly handles `10000pcs`:
- 10000 ÷ 1500 = 6.67 cartons
- Rounds UP to 7 cartons (correct behavior)
- Displays as "7 cartons (10,500 pieces)"

This is intentional - customers can't buy partial cartons, so we round up to ensure they get at least the requested quantity.

### Deployment
- **Version**: `auto-20251018-205000`
- **Status**: Deployed
- **Impact**: All cart displays will now show per-piece price again

## Related Issues
- Sales order creation fix (auto-20251018-191500)
- Asterisk product code support (auto-20251018-190500)
- Shipping details in notes (auto-20251018-185100)
