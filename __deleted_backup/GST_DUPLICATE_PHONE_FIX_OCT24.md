# GST Certificate Upload - Duplicate Customer Profile Fix

## Issue Summary
**Date:** October 24, 2025
**Severity:** Critical - Data Integrity Issue

When customers uploaded GST certificates, the system was creating **duplicate customer profile records** with phone numbers missing the `@c.us` suffix, instead of updating the existing customer profile.

## Example of Duplicate Records
```
✅ CORRECT: 96567709452@c.us (original profile)
❌ WRONG:   917737835253 (new duplicate created by GST upload)
✅ CORRECT: 917737835253@c.us (original profile)
```

## Root Cause Analysis

### Problem 1: documentHandler.js (Line 533)
```javascript
// BEFORE (WRONG):
await supabase
  .from('customer_profiles')
  .update({ gst_number: ... })
  .eq('tenant_id', req.tenant.id)
  .eq('phone', message.from);  // ❌ message.from already has @c.us but query expects exact match
```

The code was using `message.from` directly without ensuring it matches the database format.

### Problem 2: businessInfoHandler.js (Line 113)
```javascript
// BEFORE (WRONG):
const normalizedPhone = phoneNumber.replace('@c.us', '').replace(/\D/g, '');
// ❌ Strips @c.us, creating phone like "917737835253" instead of "917737835253@c.us"
```

The handler was removing `@c.us` suffix, causing phone number to not match existing database records.

### Problem 3: businessInfoCaptureService.js (Line 850)
```javascript
// BEFORE (WRONG):
const { normalizePhone } = require('../utils/phoneUtils');
const normalizedPhone = normalizePhone(phoneNumber);
// ❌ normalizePhone removes @c.us suffix
```

The service was using `normalizePhone()` which strips `@c.us`, but database stores phone numbers WITH `@c.us`.

## Solution Implemented

### Fix 1: documentHandler.js
```javascript
// Import toWhatsAppFormat utility
const { toWhatsAppFormat } = require('../../utils/phoneUtils');

// Use formatted phone to match database
const formattedPhone = toWhatsAppFormat(message.from);
console.log('[DOCUMENT_HANDLER] Using phone format:', formattedPhone);

await supabase
  .from('customer_profiles')
  .update({ gst_number: ... })
  .eq('tenant_id', req.tenant.id)
  .eq('phone', formattedPhone);  // ✅ Ensures @c.us suffix present
```

### Fix 2: businessInfoHandler.js
```javascript
// Import toWhatsAppFormat utility
const { toWhatsAppFormat } = require('../../utils/phoneUtils');

// Use formatted phone throughout
const formattedPhone = toWhatsAppFormat(phoneNumber);
console.log('[BusinessInfo] Formatted phone number:', formattedPhone);

// Pass formatted phone to all functions
const existingCheck = await checkExistingGST(tenantId, extractedData.gst_number, formattedPhone);
```

### Fix 3: businessInfoCaptureService.js
```javascript
// Change from normalizePhone to toWhatsAppFormat
const { toWhatsAppFormat } = require('../utils/phoneUtils');
const formattedPhone = toWhatsAppFormat(phoneNumber);

// Use formattedPhone for all queries and inserts
const findByPhone = await supabase
  .from('customer_profiles')
  .select('id, phone, gst_number')
  .eq('tenant_id', tenantId)
  .eq('phone', formattedPhone);  // ✅ Matches database format
```

## Phone Format Utilities

### toWhatsAppFormat()
- **Purpose:** Ensures phone has `@c.us` suffix
- **Input:** `96567709452` or `96567709452@c.us`
- **Output:** `96567709452@c.us`
- **Use Case:** When querying/updating customer_profiles table

### normalizePhone()
- **Purpose:** Removes `@c.us` suffix and non-digits
- **Input:** `96567709452@c.us`
- **Output:** `96567709452`
- **Use Case:** When displaying phone to users or external APIs (NOT for database queries)

## Files Modified
1. ✅ `routes/handlers/documentHandler.js` - GST certificate upload handler
2. ✅ `routes/handlers/businessInfoHandler.js` - Business info processing
3. ✅ `services/businessInfoCaptureService.js` - Customer lookup/creation

## Testing Checklist

### Test 1: GST Upload Updates Existing Profile
1. Customer with phone `96567709452@c.us` exists in database
2. Customer uploads GST certificate via WhatsApp
3. ✅ Expected: Existing profile updated with GST info
4. ❌ Before Fix: New profile created with phone `96567709452`

### Test 2: New Customer GST Upload
1. New customer with phone `919999888777@c.us` (not in database)
2. Customer uploads GST certificate
3. ✅ Expected: New profile created with phone `919999888777@c.us`
4. ❌ Before Fix: Profile created with phone `919999888777` (no suffix)

### Test 3: Duplicate Phone Prevention
1. Check customer_profiles table after GST uploads
2. ✅ Expected: No duplicate records for same phone number
3. Query to check:
```sql
SELECT phone, count(*) 
FROM customer_profiles 
WHERE tenant_id = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6'
GROUP BY phone 
HAVING count(*) > 1;
```

## Database Cleanup (Manual)

After deploying fix, clean up existing duplicates:

```sql
-- Find duplicates (one with @c.us, one without)
SELECT * FROM customer_profiles 
WHERE phone LIKE '917737835253%' 
ORDER BY created_at;

-- Merge data from duplicate to original, then delete duplicate
-- Keep the record WITH @c.us suffix
```

## Impact Assessment
- **Affected Records:** ~2-3 customer profiles with duplicates
- **Data Loss Risk:** Low - duplicates have minimal data
- **Critical Fields:** GST number, company name, business address

## Deployment
```powershell
# Deploy fix
.\deploy.ps1
```

## Verification Commands
```powershell
# Check logs for GST uploads
Get-Content app_logs.txt -Tail 50 | Select-String "DOCUMENT_HANDLER.*GST|BusinessInfo.*phone"

# Verify phone format in logs
# Should see: "[BusinessInfo] Formatted phone number: 96567709452@c.us"
# Should NOT see: "[BusinessInfo] Normalized phone number: 96567709452"
```

## Prevention
- ✅ All customer profile queries/updates now use `toWhatsAppFormat()`
- ✅ Added logging to show formatted phone before database operations
- ✅ Consistent phone format throughout GST upload flow

## Related Issues
- GST preference not being recognized (also caused by phone format mismatch)
- Shipping address updates creating duplicates (similar root cause)
