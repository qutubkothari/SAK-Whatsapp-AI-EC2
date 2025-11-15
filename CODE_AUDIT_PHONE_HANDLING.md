# Code Audit Results - Phone Number Handling

## Summary
Searching for phone-related column usage across active codebase (excluding __deleted_backup)

## Commands Run
```bash
grep -r "customer_phone" --include="*.js" --exclude-dir="__deleted_backup" --exclude-dir="node_modules"
grep -r "end_user_phone" --include="*.js" --exclude-dir="__deleted_backup" --exclude-dir="node_modules"
grep -r "\.phone" --include="*.js" --exclude-dir="__deleted_backup" --exclude-dir="node_modules" | grep -E "(\.eq|\.select|\.insert|\.update)"
```

## Findings

### 1. `customer_phone` Usage in Active Code

**File**: `routes/api/dashboard.js` (Line 1466)
```javascript
let customer_phone = order.customer_phone;
if (order.conversation_id && !customer_phone) {
    const { data: conv } = await supabase
        .from('conversations')
        .select('end_user_phone')
        .eq('id', order.conversation_id)
        .single();
    if (conv) customer_phone = conv.end_user_phone;
}
```
**Status**: ✅ This is CORRECT - `orders` table likely has `customer_phone` column  
**Action**: Need to verify orders table schema

**File**: `services/zohoOrderSyncService.js` (Line 247)
```javascript
zohoOrder.customer_phone
```
**Status**: ⚠️ Need to check context  
**Action**: Review this file

**File**: `public/dashboard.html` (Line 853)
```javascript
let customerPhone = order.conversation?.end_user_phone || order.customer_phone || 'N/A';
```
**Status**: ✅ Fallback logic is correct

### 2. `end_user_phone` Usage

Need comprehensive audit of all usages to ensure consistency

### 3. Phone Format Audit Needed

- Check if ALL queries use `@c.us` format
- Verify normalization is consistent
- Check for any `normalizePhone()` usage that might remove `@c.us` 

## Action Items

1. [ ] Verify `orders` table schema - does it have `customer_phone`?
2. [ ] Audit ALL phone queries in:
   - services/cartService.js
   - services/customerProfileService.js
   - services/gstValidationService.js
   - handlers/customerHandler.js
   - routes/webhook.js
3. [ ] Create list of ALL tables with phone columns
4. [ ] Document expected format for each table
5. [ ] Add validation to ensure format consistency

## Next Steps

Start creating core services to centralize this mess.
