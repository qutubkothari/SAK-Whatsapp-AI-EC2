# Registration Test Guide

## Quick Testing Instructions

### Test Scenario 1: Successful Registration

1. **Start Registration**
   ```
   User: register
   ```

   **Expected Response:**
   ```
   🚀 Welcome to WhatsApp AI Sales Assistant!

   You're about to create your own AI-powered sales bot!

   ✅ 7-Day FREE Trial
   ✅ AI-powered customer conversations
   ... (features list)

   Want to proceed with registration?
   Reply YES to confirm or NO to cancel.
   ```

2. **Confirm Registration**
   ```
   User: yes
   ```

   **Expected Response:**
   ```
   📱 Step 1: Bot Phone Number

   Please provide your Maytapi WhatsApp Business number...

   Example format:
   • 919876543210
   • +919876543210
   • 91-9876543210

   Please enter your bot number:
   ```

3. **Provide Bot Number**
   ```
   User: 919876543210
   ```

   **Expected Response:**
   ```
   📱 Step 2: Admin Phone Number

   Please provide your admin WhatsApp number...

   This number will have full control over:
   • Adding/managing products
   • Viewing orders and analytics
   • Broadcasting messages
   • Managing bot settings

   Please enter your admin number:
   ```

4. **Provide Admin Number**
   ```
   User: 919123456789
   ```

   **Expected Response:**
   ```
   🎉 Registration Successful!

   Your AI Sales Assistant is ready! 🤖

   Your Account Details:
   🤖 Bot Number: 919876543210
   📱 Admin Number: 919123456789
   🎟️ Referral Code: REF-XXXX
   📅 Trial Ends: [Date]
   💎 Plan: Standard (Trial)

   Quick Start Guide:
   ... (setup instructions)

   Important:
   Admin commands should be sent from the admin number (919123456789)
   to the bot number (919876543210).
   ```

---

### Test Scenario 2: Invalid Phone Number

1. **Start Registration & Confirm**
   ```
   User: register
   Bot: [Shows features]
   User: yes
   Bot: [Asks for bot number]
   ```

2. **Provide Invalid Bot Number**
   ```
   User: abc123
   ```

   **Expected Response:**
   ```
   ❌ Invalid phone number format.

   Please enter a valid phone number (10-15 digits).

   *Example:*
   • 919876543210
   • +919876543210

   Please try again:
   ```

3. **Provide Valid Bot Number**
   ```
   User: 919876543210
   Bot: [Asks for admin number]
   ```

4. **Provide Invalid Admin Number**
   ```
   User: hello-world
   ```

   **Expected Response:**
   ```
   ❌ Invalid phone number format.

   Please enter a valid phone number (10-15 digits).

   *Example:*
   • 919123456789
   • +919123456789

   Please try again:
   ```

5. **Provide Valid Admin Number**
   ```
   User: 919123456789
   Bot: [Completes registration]
   ```

---

### Test Scenario 3: Cancel Registration

1. **Start Registration**
   ```
   User: register
   Bot: [Shows features and asks for confirmation]
   ```

2. **Cancel Registration**
   ```
   User: no
   ```

   **Expected Response:**
   ```
   Registration cancelled. ❌

   No worries! You can start registration anytime by sending "register".

   If you have questions, just ask! I'm here to help. 😊
   ```

---

### Test Scenario 4: Duplicate Registration

1. **Complete Registration (First Time)**
   ```
   User: register
   [Complete full flow]
   Bot: [Registration successful]
   ```

2. **Try to Register Again**
   ```
   User: register
   ```

   **Expected Response:**
   ```
   You're already registered! 🎉

   *Business:* [Business Name or 'Not set']
   *Plan:* standard (trial)

   Would you like to:
   • Update your business details
   • Upgrade your plan
   • Access admin dashboard
   ```

---

## Database Verification

### Check Created Tenant

```sql
SELECT
    id,
    business_name,
    owner_whatsapp_number,
    bot_phone_number,
    admin_phones,
    subscription_status,
    subscription_tier,
    trial_ends_at,
    referral_code,
    status,
    is_active,
    created_at
FROM tenants
WHERE owner_whatsapp_number = '[TEST_PHONE_NUMBER]@c.us'
ORDER BY created_at DESC
LIMIT 1;
```

### Expected Database Values

```
bot_phone_number     = '919876543210'        (cleaned, no @c.us)
admin_phones         = ['919123456789']      (array format)
owner_whatsapp_number = '919000000000@c.us'  (with @c.us)
subscription_status  = 'trial'
subscription_tier    = 'standard'
trial_ends_at        = [7 days from now]
referral_code        = 'REF-XXXXXXXX'
status               = 'active'
is_active            = true
```

---

## Admin Command Testing

After registration, test that admin commands work:

### Test Admin Commands from Admin Number

1. **From Admin Number to Bot Number**
   ```
   From: 919123456789
   To: 919876543210
   Message: /help
   ```

   **Expected:** Should show admin commands

2. **Test Non-Admin User**
   ```
   From: 919999999999 (random number)
   To: 919876543210
   Message: /help
   ```

   **Expected:** Should NOT show admin commands, treat as customer

---

## Customer Interaction Testing

### Test Customer Order Flow

1. **Customer Messages Bot**
   ```
   From: 918888888888 (customer)
   To: 919876543210 (bot)
   Message: Hi, I want to place an order
   ```

   **Expected:** AI responds with product inquiry or greeting

---

## Edge Cases to Test

### 1. Phone Number Formats

Test various formats are accepted:
- `919876543210` ✓
- `+919876543210` ✓
- `91-9876-543210` ✓
- `91 9876 543210` ✓
- `(91) 9876543210` ✓

### 2. Same Number for Both

```
User: 919876543210 (bot)
User: 919876543210 (admin)
```

**Expected:** Should work fine (same number can be both)

### 3. International Numbers

```
User: 447123456789 (UK number)
```

**Expected:** Should validate and accept

### 4. Registration State Persistence

1. Start registration
2. Restart server (simulate crash)
3. Try to continue registration

**Current Behavior:** State lost (in-memory)
**Future Enhancement:** Use Redis/database for persistence

---

## Logging Verification

Check logs for proper flow:

```
[SELF_REGISTRATION] Handling message: register from: 919000000000@c.us
[SELF_REGISTRATION] Starting registration for: 919000000000@c.us
[SELF_REGISTRATION] Current registration state: awaiting_bot_number
[SELF_REGISTRATION] Asking for admin number: 919000000000@c.us
[SELF_REGISTRATION] Completing registration for: 919000000000@c.us
[SELF_REGISTRATION] Bot number: 919876543210
[SELF_REGISTRATION] Admin number: 919123456789
[SELF_REGISTRATION] Tenant created: [UUID]
```

---

## Manual Testing Checklist

- [ ] Start registration with "register"
- [ ] Verify features list displayed
- [ ] Confirm with "YES" (test case-insensitive)
- [ ] Enter valid bot number
- [ ] Verify bot number accepted
- [ ] Enter valid admin number
- [ ] Verify admin number accepted
- [ ] Check tenant created in database
- [ ] Verify bot_phone_number stored correctly
- [ ] Verify admin_phones array populated
- [ ] Test invalid phone format (bot step)
- [ ] Test invalid phone format (admin step)
- [ ] Test cancellation with "NO"
- [ ] Verify state cleared after cancel
- [ ] Test duplicate registration attempt
- [ ] Test admin command from admin number
- [ ] Test customer message to bot number
- [ ] Test same number for bot and admin
- [ ] Test international phone numbers
- [ ] Verify welcome message formatting
- [ ] Check referral code generated
- [ ] Verify trial end date (7 days)

---

## Automated Test Script

```javascript
// test_registration.js
const { handleSelfRegistration } = require('./services/selfRegistrationService');

async function testRegistrationFlow() {
    const testPhone = '919000000000@c.us';
    const mockSendMessage = async (to, msg) => {
        console.log(`[MOCK] Sending to ${to}:`);
        console.log(msg);
    };

    console.log('\n=== Test 1: Complete Registration ===');
    await handleSelfRegistration(testPhone, 'register', mockSendMessage);
    await handleSelfRegistration(testPhone, 'yes', mockSendMessage);
    await handleSelfRegistration(testPhone, '919876543210', mockSendMessage);
    await handleSelfRegistration(testPhone, '919123456789', mockSendMessage);

    console.log('\n=== Test 2: Invalid Format ===');
    await handleSelfRegistration(testPhone, 'register', mockSendMessage);
    await handleSelfRegistration(testPhone, 'yes', mockSendMessage);
    await handleSelfRegistration(testPhone, 'abc123', mockSendMessage);
    await handleSelfRegistration(testPhone, '919876543210', mockSendMessage);

    console.log('\n=== Test 3: Cancellation ===');
    await handleSelfRegistration(testPhone, 'register', mockSendMessage);
    await handleSelfRegistration(testPhone, 'no', mockSendMessage);
}

testRegistrationFlow().catch(console.error);
```

Run with:
```bash
node test_registration.js
```

---

## Production Deployment Checklist

Before deploying:

- [ ] Review all error messages for clarity
- [ ] Test with real WhatsApp numbers
- [ ] Verify Maytapi integration works
- [ ] Check admin command authorization
- [ ] Test state management under load
- [ ] Consider adding rate limiting
- [ ] Set up monitoring/alerts
- [ ] Document admin onboarding process
- [ ] Prepare customer support docs
- [ ] Test rollback procedure

---

## Known Limitations

1. **In-Memory State:** Registration state lost on server restart
2. **No Timeout:** State persists indefinitely (should add 30min timeout)
3. **No Verification:** Phone numbers not verified (could add OTP)
4. **Single Admin:** Only one admin number during registration (can add more later)
5. **No Undo:** Cannot go back to previous step

## Future Improvements

1. Add Redis for persistent state
2. Implement timeout for abandoned registrations
3. Add OTP verification for phone numbers
4. Allow multiple admin numbers during setup
5. Add "back" command to go to previous step
6. Show progress indicator (Step 1 of 3, etc.)
7. Add email collection for account recovery
