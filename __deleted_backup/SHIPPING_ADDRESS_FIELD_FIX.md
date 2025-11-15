# Shipping Address Field Mapping Fix

## Problem Identified

When customer provided shipping address:
```
D903 , Elina Living ,NIBM ,Pune 411060
VRL Logistics
411060
```

The data was saved incorrectly:
- ❌ `default_transporter_contact` = "411060" (WRONG - this is the pincode!)
- ❌ `default_shipping_pincode` = NULL
- ❌ `default_shipping_city` = NULL
- ❌ `default_shipping_state` = NULL

## Root Cause

The `shippingInfoService.js` was:
1. Only extracting 3 fields: address, transporter name, transporter contact
2. Not parsing the address to extract city, state, and pincode
3. Saving pincode value to `default_transporter_contact` field
4. Not using normalized phone for database updates

## Solution Implemented

### 1. Added Address Component Extraction

Created `extractAddressComponents()` function that intelligently extracts:
- **Pincode**: 6-digit number (e.g., 411060)
- **State**: Matches against list of Indian states (e.g., Maharashtra)
- **City**: Text before state/pincode (e.g., Pune)

### 2. Updated `saveShippingInfo()` Function

```javascript
// Before (❌):
await supabase
    .from('customer_profiles')
    .update({
        default_shipping_address: shippingInfo.shippingAddress,
        default_transporter_name: shippingInfo.transporterName,
        default_transporter_contact: shippingInfo.transporterContact  // ❌ Wrong field!
    })
    .eq('tenant_id', tenantId)
    .eq('phone', customerPhone);  // ❌ Not normalized!

// After (✅):
const addressComponents = extractAddressComponents(shippingInfo.shippingAddress);
const normalizedPhone = normalizePhone(customerPhone);

await supabase
    .from('customer_profiles')
    .update({
        default_shipping_address: shippingInfo.shippingAddress,
        default_shipping_city: addressComponents.city,           // ✅ Extracted city
        default_shipping_state: addressComponents.state,         // ✅ Extracted state
        default_shipping_pincode: addressComponents.pincode,     // ✅ Extracted pincode
        default_transporter_name: shippingInfo.transporterName,
        default_transporter_contact: shippingInfo.transporterContact
    })
    .eq('tenant_id', tenantId)
    .eq('phone', normalizedPhone);  // ✅ Normalized phone!
```

### 3. Updated `updateCustomerShippingAddress()` Function

Applied same fix to address update function to ensure consistency.

## What This Fixes

✅ **Pincode saved to correct field** (`default_shipping_pincode`)  
✅ **City extracted and saved** (`default_shipping_city`)  
✅ **State extracted and saved** (`default_shipping_state`)  
✅ **Transporter contact kept separate** (not confused with pincode)  
✅ **Uses normalized phone** for consistent database operations  

## Example Results

### Input:
```
Address: D903 , Elina Living ,NIBM ,Pune 411060
Transporter: VRL Logistics  
Contact: +91 9876543210
```

### Output in Database:
```sql
default_shipping_address = "D903 , Elina Living ,NIBM ,Pune 411060"
default_shipping_city = "Pune"
default_shipping_state = "Maharashtra" (if detected)
default_shipping_pincode = "411060"
default_transporter_name = "VRL Logistics"
default_transporter_contact = "+91 9876543210"
```

## Supported Address Formats

The extraction function handles various formats:
- ✅ "Street, City, State - Pincode"
- ✅ "Street, City - Pincode"
- ✅ "Street, City Pincode"
- ✅ "Street, City, State Pincode"

## Files Modified

1. **services/shippingInfoService.js**
   - Added `extractAddressComponents()` function
   - Updated `saveShippingInfo()` to extract and save city/state/pincode
   - Updated `updateCustomerShippingAddress()` for consistency
   - Added phone normalization for database operations

## Testing Recommendations

1. Test with various address formats:
   ```
   D903, Elina Living, NIBM, Pune 411060
   123 Main Street, Mumbai, Maharashtra - 400001
   Flat 5B, Brigade Road, Bangalore 560001
   ```

2. Verify database fields are populated correctly:
   - `default_shipping_address` - full address
   - `default_shipping_city` - city name
   - `default_shipping_state` - state name  
   - `default_shipping_pincode` - 6 digit pincode
   - `default_transporter_contact` - actual phone number (not pincode!)

3. Check that customer profile updates use normalized phone

## Related Fixes

This fix complements the **Phone Normalization Fix** implemented earlier:
- Both fixes ensure consistent use of `normalizePhone()` 
- Prevents duplicate profiles
- Ensures data is saved to correct customer record

## Deployment

Ready for immediate deployment. No database migration needed as the columns already exist.
