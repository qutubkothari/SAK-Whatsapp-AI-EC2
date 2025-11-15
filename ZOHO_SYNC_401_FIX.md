# Zoho Sync 401 Authorization Fix

## Issue Detected
**Date:** November 10, 2025
**Deployment:** auto-deploy-20251110-152709

### Problem
After the user upgraded their Zoho Books subscription (trial expiration resolved), the scheduled Zoho order sync was still failing with:
```
[ZOHO_SYNC] Error fetching orders: Request failed with status code 401
```

This was happening every 15 minutes when the scheduled sync task ran.

### Root Cause
The `zohoOrderSyncService.js` was directly using `zoho_access_token` from the database:
```javascript
// OLD CODE - BROKEN
const { data: tenant } = await supabase
    .from('tenants')
    .select('zoho_access_token, zoho_organization_id')
    .eq('id', tenantId)
    .single();

const zohoOrders = await fetchZohoOrders(
    tenant.zoho_access_token,  // ❌ This token expires!
    tenant.zoho_organization_id,
    thirtyDaysAgo.toISOString().split('T')[0]
);
```

**Why This Failed:**
- Zoho OAuth tokens expire after 1 hour
- The database stores the last token, but doesn't handle refresh
- Direct checkout (via `processOrderToZoho`) was working because it uses `ZohoTenantAuth` service
- Scheduled sync was using expired token from database

### Solution
Modified `zohoOrderSyncService.js` to use `ZohoTenantAuth` service which handles token refresh:

```javascript
// NEW CODE - FIXED
const ZohoTenantAuth = require('./zohoTenantAuth');

// Get valid token (auto-refreshes if needed)
const authStatus = await ZohoTenantAuth.checkAuthorizationStatus(tenantId);

if (!authStatus.authorized) {
    console.log('[ZOHO_SYNC] Zoho not authorized for tenant');
    return { success: false, message: 'Zoho not authorized' };
}

const accessToken = await ZohoTenantAuth.getAccessToken(tenantId);
const organizationId = authStatus.organizationId;

const zohoOrders = await fetchZohoOrders(
    accessToken,  // ✅ Always valid, auto-refreshed
    organizationId,
    thirtyDaysAgo.toISOString().split('T')[0]
);
```

### Changes Made
**File:** `services/zohoOrderSyncService.js`

1. **Line 3:** Added `const ZohoTenantAuth = require('./zohoTenantAuth');`

2. **Lines 16-29:** Replaced direct database token fetch with ZohoTenantAuth:
   - `checkAuthorizationStatus()` - Verifies Zoho is authorized
   - `getAccessToken()` - Gets valid token (refreshes if expired)
   - Gets `organizationId` from auth status

3. **Lines 36-37:** Updated `fetchZohoOrders()` call to use refreshed credentials

### Impact
- ✅ Scheduled Zoho sync will now work continuously (every 15 minutes)
- ✅ Tokens auto-refresh without manual intervention
- ✅ Consistent token management across all Zoho operations
- ✅ No more 401 errors in scheduled tasks

### Testing
The next scheduled sync (runs every 15 minutes) should succeed:
```
[ZOHO_SYNC] Starting scheduled sync...
[ZOHO_SYNC] Starting order sync for tenant: a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6
[ZOHO_SYNC] Found X Zoho orders
[ZOHO_SYNC] Synced X new orders, updated X prices
```

### Related Files
- ✅ `services/zohoTenantAuth.js` - Handles token refresh (singleton)
- ✅ `services/zohoOrderSyncService.js` - Now uses ZohoTenantAuth (FIXED)
- ✅ `services/zohoService.js` - Already uses ZohoTenantAuth (working)
- ✅ `test_zoho_connection.js` - Uses ZohoTenantAuth (test passed)

### Previous Related Fixes
1. **Zoho Trial Expiration** - User upgraded subscription (resolved)
2. **Direct Checkout** - Always used ZohoTenantAuth (was working)
3. **Scheduled Sync** - Was broken, now fixed with this deployment

---
**Deployment:** auto-deploy-20251110-152709
**Status:** DEPLOYED ✅
**Next Verification:** Wait for next scheduled sync (every 15 minutes) and check logs
