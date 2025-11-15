# Sales Order Creation Fix - October 18, 2025, 19:15

## Problem
Sales orders were not being created in Zoho Books. Error in logs:
```
[ZOHO_ORDER] Order not found: 194c641d-183b-4013-a516-d4fb2ba1ca2b
[ZOHO_ORDER] Error: Order 194c641d-183b-4013-a516-d4fb2ba1ca2b not found
[ZOHO_INTEGRATION] Failed: Order 194c641d-183b-4013-a516-d4fb2ba1ca2b not found
```

## Root Cause
In `services/zohoSalesOrderService.js`, the Supabase query was trying to join `customer_profiles` without specifying the foreign key relationship:

```javascript
// ❌ WRONG - Ambiguous join
customer_profiles(
    default_shipping_address,
    ...
)
```

Supabase couldn't determine how to join the tables, causing the query to fail silently and return `null`.

## Solution
Specified the foreign key explicitly using PostgREST syntax:

```javascript
// ✅ CORRECT - Explicit foreign key
customer_profiles!customer_profile_id(
    default_shipping_address,
    default_shipping_city,
    default_shipping_state,
    default_shipping_pincode,
    default_transporter_name,
    default_transporter_contact
)
```

Also added error logging to catch query failures:
```javascript
const { data: order, error: orderError } = await supabase...

if (orderError) {
    console.error('[ZOHO_ORDER] Query error:', orderError);
    throw new Error(`Failed to fetch order: ${orderError.message}`);
}
```

## Files Modified
- `services/zohoSalesOrderService.js` (Lines 243-270)

## Impact
- ✅ Sales orders will now be created in Zoho Books successfully
- ✅ Shipping address and transporter details will be included in notes
- ✅ Better error logging for debugging

## Deployment
- **Version**: `auto-20251018-191500`
- **Status**: Deployed

## Testing Steps
1. Customer places an order
2. System should create order in database
3. System should create sales order in Zoho Books
4. Sales order should include shipping/transport details in notes
5. Check logs for `[ZOHO_ORDER] Sales order created: SO-XXXXX`

## Related Issues
This fix works together with:
- Asterisk (*) product code support (auto-20251018-190500)
- Shipping details in notes (auto-20251018-185100)
- AI context analysis (auto-20251018-184500)
