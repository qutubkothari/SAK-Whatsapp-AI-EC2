# Customer Profile Cleanup Summary

## Issue
Customer profiles were being created with invalid phone numbers due to a bug where UUID conversation IDs were being used instead of actual phone numbers.

## Root Cause
In `routes/webhook.js` and `routes/handlers/businessInfoHandler.js`, the system was:
1. Getting a UUID from `ensureConversationByPhone()` (e.g., `"6bee409e-d087-4199-86d3-f3ee034b76af"`)
2. Passing this UUID as the "phone number" parameter
3. The handler was trying to extract phone digits from the UUID
4. Result: Gibberish phone numbers like `"64090874199863303476"`

## Fix Applied
✅ Updated `webhook.js` to pass the actual `phoneNumber` instead of `conversationId` UUID
✅ Updated `businessInfoHandler.js` to properly normalize phone numbers
✅ Deployed fix: `auto-deploy-20251021-115724`

## Cleanup Results

### Records Deleted
**Total Junk Records Removed: 3**

| Phone Number | Name | Company | GST Number | Orders | Created |
|--------------|------|---------|------------|--------|---------|
| 62560640329231861 | AATIF FAKHRUDDIN KOTHARI | 3.Constitution of BusinessPrivate Limited Company | 27ABECS6009F1ZF | 0 | 2025-10-20 |
| 31289941589743874 | AATIF FAKHRUDDIN KOTHARI | 3.Constitution of BusinessPrivate Limited Company | 27ABECS6009F1ZF | 0 | 2025-10-17 |
| 64090874199863303476 | AATIF FAKHRUDDIN KOTHARI | 3.Constitution of BusinessPrivate Limited Company | 27ABECS6009F1ZF | 0 | 2025-10-21 |

### Database Status After Cleanup

📊 **Current State:**
- Total Customer Profiles: **4**
- Valid Phone Numbers: **4/4 (100%)**
- Duplicate GST Numbers: **0**
- Suspicious Records: **0**

📱 **Phone Number Formats:**
- WhatsApp Format (@c.us): 3
- International Format (+): 1
- Suspicious (17+ digits): 0

✅ **Database is CLEAN!**

## Prevention
The bug has been fixed in production. Future GST certificate uploads will correctly save phone numbers in the format:
- `971507055253@c.us` (WhatsApp format)
- `+91 9106886259` (International format)
- `9106886259` (Digits only)

## Scripts Created

### 1. cleanup_junk_phone_numbers.js
**Location:** `scripts/cleanup_junk_phone_numbers.js`

**Usage:**
```bash
# Dry run (review only)
node scripts/cleanup_junk_phone_numbers.js

# Execute cleanup
node scripts/cleanup_junk_phone_numbers.js --execute
```

**Features:**
- Finds records with known junk phone numbers
- Detects suspiciously long phone numbers (17+ digits)
- Checks for duplicate GST numbers
- Dry-run mode for safety
- 5-second confirmation before deletion

### 2. verify_customer_profiles.js
**Location:** `scripts/verify_customer_profiles.js`

**Usage:**
```bash
node scripts/verify_customer_profiles.js
```

**Features:**
- Analyzes phone number formats
- Detects suspicious records
- Finds duplicate GST numbers
- Provides database health summary

## Notes
- All deleted records had 0 orders (safe to delete)
- All deleted records shared the same GST number (27ABECS6009F1ZF)
- No valid customer data was lost
- The fix ensures this issue won't happen again

## Date
October 21, 2025

## Deployed Version
`auto-deploy-20251021-115724`
