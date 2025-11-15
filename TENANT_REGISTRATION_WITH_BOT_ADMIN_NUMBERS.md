# Tenant Registration with Bot & Admin Numbers

## Overview
Enhanced the self-registration flow to collect **bot phone number** (Maytapi number) and **admin phone number** separately during tenant registration from WhatsApp.

## Implementation Details

### Registration Flow

The new registration flow follows this sequence:

1. **User sends "register"** → System shows feature list and asks for confirmation
2. **User confirms "YES"** → System asks for Bot Number
3. **User provides Bot Number** → System validates and asks for Admin Number
4. **User provides Admin Number** → System creates tenant account with both numbers
5. **Registration Complete** → Welcome message with all details

### State Machine

The registration uses an in-memory state machine with the following states:

- `pending_registration_confirmation` - Waiting for YES/NO confirmation
- `awaiting_bot_number` - Collecting Maytapi bot number
- `awaiting_admin_number` - Collecting admin control number

### Phone Number Validation

- Accepts formats: `919876543210`, `+919876543210`, `91-9876543210`
- Validates 10-15 digits
- Automatically cleans and formats numbers
- Shows error message if invalid format

### Database Storage

**Bot Number** → Stored in `tenants.bot_phone_number`
- This is the Maytapi WhatsApp Business number
- Customers message this number to interact with the AI bot

**Admin Number** → Stored in `tenants.admin_phones[]`
- This number has full admin control
- Can run all admin commands
- Receives notifications and alerts

**Owner Number** → Stored in `tenants.owner_whatsapp_number`
- The number that initiated registration
- Used for account recovery

## Code Changes

### Modified Files

#### `services/selfRegistrationService.js`

**New Functions Added:**
- `isValidPhoneNumber(phoneNumber)` - Validates phone number format
- `formatPhoneNumber(phoneNumber)` - Cleans and formats phone numbers
- `askForBotNumber(phoneNumber, sendMessageFn)` - Prompts for bot number
- `askForAdminNumber(phoneNumber, botNumber, sendMessageFn)` - Prompts for admin number
- `getRegistrationData(phoneNumber)` - Retrieves registration state
- `setRegistrationData(phoneNumber, data)` - Stores registration state
- `clearRegistrationData(phoneNumber)` - Clears registration state

**Updated Functions:**
- `completeRegistration()` - Now accepts botNumber and adminNumber parameters
- `handleSelfRegistration()` - Implements full state machine logic
- `cancelRegistration()` - Clears registration data on cancel

**State Management:**
Uses in-memory Map to track registration progress:
```javascript
const registrationData = new Map();
```

## Usage Example

### User Flow

```
User: register

Bot: 🚀 Welcome to WhatsApp AI Sales Assistant!
     [Shows features and asks for confirmation]

User: yes

Bot: 📱 Step 1: Bot Phone Number
     Please provide your Maytapi WhatsApp Business number...

User: 919876543210

Bot: 📱 Step 2: Admin Phone Number
     Please provide your admin WhatsApp number...

User: 919123456789

Bot: 🎉 Registration Successful!
     🤖 Bot Number: 919876543210
     📱 Admin Number: 919123456789
     [Shows complete setup guide]
```

## Key Features

### Validation
- Real-time phone number validation
- Clear error messages with examples
- Retry on invalid input

### Security
- Separate bot and admin numbers
- Admin commands only work from admin number
- Owner number tracked for account recovery

### User Experience
- Step-by-step guided process
- Clear instructions with examples
- Visual formatting with emojis
- Confirmation of entered details

### Flexibility
- Supports multiple phone number formats
- Automatic number cleaning
- Works with international formats

## Database Schema

### Tenants Table Fields Used

```sql
bot_phone_number TEXT           -- Maytapi bot number (customer-facing)
admin_phones TEXT[]             -- Array of admin numbers
owner_whatsapp_number TEXT      -- Registration initiator number
phone_number TEXT               -- Cleaned owner number
```

## Admin Commands

Admin commands can now be run from:
1. Numbers in `admin_phones[]` array
2. The `owner_whatsapp_number`

The admin detection middleware checks both sources to authorize admin commands.

## Error Handling

- Invalid phone format → Shows helpful error with examples
- Registration interruption → State preserved until completion or cancellation
- Database errors → Clears state and shows user-friendly error
- Duplicate registration → Shows existing account details

## Testing Checklist

- [ ] Start registration with "register"
- [ ] Confirm with "yes"
- [ ] Enter valid bot number
- [ ] Enter valid admin number
- [ ] Verify tenant created with correct numbers
- [ ] Test invalid phone number format
- [ ] Test cancellation with "no"
- [ ] Test admin commands from admin number
- [ ] Test customer messages to bot number
- [ ] Verify duplicate registration prevention

## Future Enhancements

1. **Persistent State Storage**
   - Move from in-memory Map to Redis or database
   - Handle server restarts gracefully

2. **Multiple Admin Numbers**
   - Allow adding multiple admins during registration
   - Support "add another admin" option

3. **Phone Number Verification**
   - Send OTP to verify ownership
   - Confirm both bot and admin numbers are active

4. **Guided Setup Wizard**
   - Continue setup after registration
   - Walk through business name, products, etc.

5. **Account Recovery**
   - Use owner_whatsapp_number for password resets
   - Allow changing admin numbers

## Notes

- Registration data is stored in-memory and cleared after completion
- State expires after 30 minutes of inactivity (could be implemented)
- Bot number must be a valid Maytapi WhatsApp Business number
- Admin number can be any WhatsApp number (including personal accounts)

## Support

If users face issues during registration:
1. Type "cancel" to restart
2. Type "register" to begin again
3. Contact support if technical issues persist
