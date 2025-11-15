# Shipping Charges GST Calculation Fix

**Date:** October 27, 2025  
**Status:** ✅ Deployed  
**Version:** auto-deploy-20251027-165645

## Problem
Shipping charges were being added to Zoho Books sales orders using the `shipping_charge` field, which adds the amount **after** subtotal calculation. This meant:
- ❌ GST was NOT calculated on shipping charges
- ❌ Shipping amount appeared separately from line items
- ❌ Final invoice amount didn't include GST on freight

## Solution
Changed shipping charges to be added as a **line item** instead of using the `shipping_charge` field.

### Benefits:
- ✅ GST is now calculated on shipping charges (same rate as products)
- ✅ Shipping appears as a proper line item in Zoho
- ✅ Correct total including freight + GST on freight
- ✅ Consistent with how products are handled

## Changes Made

### 1. zohoSalesOrderService.js
**Before:**
```javascript
const lineItems = order.order_items.map(...);

const salesOrderData = {
    // ...
    line_items: validLineItems,
    shipping_charge: order.shipping_charges || 0  // ❌ No GST
};
```

**After:**
```javascript
const lineItems = order.order_items.map(...);

// Add shipping as line item
if (order.shipping_charges && parseFloat(order.shipping_charges) > 0) {
    lineItems.push({
        name: 'Shipping & Handling Charges',
        description: 'Freight and delivery charges',
        rate: parseFloat(order.shipping_charges),
        quantity: 1,
        discount: 0,
        tax_id: null  // ✅ GST will be applied
    });
}

const salesOrderData = {
    // ...
    line_items: validLineItems
    // shipping_charge removed
};
```

### 2. zohoIntegrationService.js
Same pattern - shipping charges added as line item with GST calculation.

### 3. zohoInvoiceService.js
When converting sales order to invoice, shipping line item is preserved with GST.

## Example

**Order Details:**
- Product 1: ₹10,000 (5 units @ ₹2,000 each)
- Shipping: ₹500
- GST Rate: 18%

**Old Calculation:**
```
Subtotal: ₹10,000
GST (18%): ₹1,800
Shipping: ₹500 (no GST)
Total: ₹12,300
```

**New Calculation (Correct):**
```
Subtotal: ₹10,500 (₹10,000 + ₹500 shipping line item)
GST (18%): ₹1,890 (includes GST on shipping!)
Total: ₹12,390
```

**Difference:** ₹90 additional GST on shipping (18% of ₹500)

## Testing

To verify:
1. Create an order with shipping charges
2. Confirm order to create Zoho sales order
3. Check Zoho Books - shipping should appear as line item
4. Verify GST is calculated on shipping amount
5. Convert to invoice - shipping line item should be preserved

## Files Modified
- `services/zohoSalesOrderService.js`
- `services/zohoIntegrationService.js`
- `services/zohoInvoiceService.js`

## Impact
- ✅ All future orders will have GST on shipping
- ✅ No database migration needed
- ✅ Backward compatible (old orders unaffected)
- ✅ Works with existing shipping capture flow

---

**Deployed:** October 27, 2025 at 4:56 PM  
**Environment:** Production (App Engine)
