# Phone Normalization Fix - Summary

## Problem
Customer profiles were being duplicated due to inconsistent phone number normalization across the codebase:
- Some code used `from.replace(/@.*$/,'').replace(/\D/g,'')`
- Database lookups sometimes used WhatsApp format (`919106886259@c.us`)
- Sometimes used digit-only format (`919106886259`)
- This caused duplicate profiles for the same customer

## Solution Implemented

### 1. Centralized Phone Utilities (`utils/phoneUtils.js`)
Created a single source of truth for phone normalization:
```javascript
- normalizePhone(phoneNumber)      // Returns: "919106886259"
- toWhatsAppFormat(phoneNumber)    // Returns: "919106886259@c.us"
- phonesMatch(phone1, phone2)      // Compares normalized versions
```

### 2. Updated Customer Profile Service (`services/customerProfileService.js`)
- **getCustomerProfile()** - Now uses `normalizePhone()` for all database lookups
- **upsertCustomerProfile()** - New function that ensures normalized phone is always used
- Removed fallback logic that caused confusion
- All operations now use `tenant_id,phone` unique constraint properly

### 3. Updated Customer Handler (`routes/handlers/customerHandler.js`)
Replaced all manual phone normalization with centralized functions:
- ✅ Line ~1223: Name capture update
- ✅ Line ~1278: GST info collection state check
- ✅ Line ~1308: Skip GST flow
- ✅ Line ~1416: GST details save

## Key Changes

### Before (❌ Causes Duplicates):
```javascript
const normalizedPhone = from.replace(/@.*$/,'').replace(/\D/g,'');
await supabase
    .from('customer_profiles')
    .upsert({
        tenant_id: tenant.id,
        phone: normalizedPhone,
        gst_number: gstData.gst,
        ...
    }, {
        onConflict: 'tenant_id,phone'
    });
```

### After (✅ Prevents Duplicates):
```javascript
await upsertCustomerProfile(tenant.id, from, {
    gst_number: gstData.gst,
    ...
});
```

## Benefits
1. **Single Source of Truth** - All phone normalization goes through one function
2. **Prevents Duplicates** - Consistent normalization = consistent database keys
3. **Easier Maintenance** - Change normalization logic in one place
4. **Better Logging** - upsertCustomerProfile logs all operations for debugging
5. **Type Safety** - Handles null/undefined gracefully

## Database Impact
- Customer profiles will now be correctly matched and updated
- No more duplicate profiles with same phone number
- GST and shipping address updates will persist correctly
- Onboarding status will be tracked accurately

## Testing Recommendations
1. Test with customer `919106886259`
2. Verify only ONE profile exists in database
3. Send GST message - confirm it updates existing profile
4. Check `customer_profiles` table - should have digit-only phone numbers
5. Verify onboarding_completed flag is set correctly

## Files Modified
- ✅ `utils/phoneUtils.js` - Created/updated centralized utilities
- ✅ `services/customerProfileService.js` - Added upsertCustomerProfile, updated getCustomerProfile
- ✅ `routes/handlers/customerHandler.js` - Replaced manual normalization (4 locations)
- ✅ `services/customerProfileUtils.js` - Can be removed (deprecated in favor of utils/phoneUtils.js)

## Next Steps
1. Deploy changes to production
2. Run `verify_customer_profiles.js` script to check for duplicates
3. If duplicates exist, run cleanup script to merge them
4. Monitor logs for "[CUSTOMER_PROFILE]" messages to verify correct behavior
