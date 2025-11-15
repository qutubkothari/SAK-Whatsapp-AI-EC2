# How to Register a New Tenant via WhatsApp

## Overview
Users can register their own AI Sales Assistant bot directly from WhatsApp by following a simple guided process that collects their bot number (Maytapi) and admin number.

## Registration Methods

### Method 1: Message Your Own Maytapi Number (Recommended)

If you have a Maytapi WhatsApp Business number that you want to use as your bot:

1. **Open WhatsApp** on your phone
2. **Message your own Maytapi number** (the number you want to use as your AI bot)
3. **Type:** `register`
4. **Follow the prompts** to complete setup

**Example:**
```
You (from your phone): register
Your Maytapi Number: 🚀 Welcome to WhatsApp AI Sales Assistant!
                     [Shows features and trial info]
                     Want to proceed? Reply YES or NO

You: yes

Your Maytapi Number: 📱 Step 1: Bot Phone Number
                     Please provide your Maytapi WhatsApp Business number...

You: 919876543210

Your Maytapi Number: 📱 Step 2: Admin Phone Number
                     Please provide your admin WhatsApp number...

You: 919123456789

Your Maytapi Number: 🎉 Registration Successful!
                     [Shows complete account details]
```

### Method 2: Message an Existing Bot (For Demo/Testing)

If you want to try the registration flow, you can message ANY existing bot:

1. **Find an existing bot** (any deployed WhatsApp AI Sales Assistant)
2. **Type:** `register`
3. **Follow the prompts**

**Note:** This creates a SEPARATE tenant account for you, not tied to the bot you messaged.

## Complete Registration Flow

### Step 1: Initiate Registration

**Supported Keywords (case-insensitive):**
- `register`
- `signup`
- `sign up`
- `create account`
- `new account`

**Bot Response:**
```
🚀 Welcome to WhatsApp AI Sales Assistant!

You're about to create your own AI-powered sales bot! Here's what you get:

✅ 7-Day FREE Trial
✅ AI-powered customer conversations
✅ Product catalog management
✅ Order processing & tracking
✅ Multi-language support (English, Hindi, Hinglish, Arabic)
✅ Discount negotiations
✅ Cart management

What happens next:
1. We'll create your account
2. You get admin access immediately
3. Start adding products & serving customers
4. No credit card needed for trial

Want to proceed with registration?
Reply YES to confirm or NO to cancel.
```

### Step 2: Confirm Registration

**Reply with YES:**
- `yes`, `yeah`, `yep`, `yup`, `sure`, `ok`, `okay`, `confirm`, `proceed`
- `ha`, `haan`, `हाँ` (Hindi)
- `👍` (thumbs up)

**Reply with NO to cancel:**
- `no`, `nope`, `nah`, `cancel`, `stop`
- `na`, `nahi`, `नहीं` (Hindi)
- `👎` (thumbs down)

### Step 3: Provide Bot Number

**Bot Asks:**
```
📱 Step 1: Bot Phone Number

Please provide your Maytapi WhatsApp Business number that will be used as your AI bot.

This is the number your customers will message to place orders and get assistance.

Example format:
• 919876543210
• +919876543210
• 91-9876543210

Please enter your bot number:
```

**You Reply:**
```
919876543210
```

**Accepted Formats:**
- `919876543210` ✓
- `+919876543210` ✓
- `91-9876-543210` ✓
- `91 9876 543210` ✓
- `(91) 9876543210` ✓

**If Invalid:**
```
❌ Invalid phone number format.

Please enter a valid phone number (10-15 digits).

*Example:*
• 919876543210
• +919876543210

Please try again:
```

### Step 4: Provide Admin Number

**Bot Asks:**
```
📱 Step 2: Admin Phone Number

Please provide your admin WhatsApp number where you'll receive notifications and run admin commands.

This number will have full control over:
• Adding/managing products
• Viewing orders and analytics
• Broadcasting messages
• Managing bot settings

Example format:
• 919123456789
• +919123456789
• 91-9123456789

Please enter your admin number:
```

**You Reply:**
```
919123456789
```

### Step 5: Registration Complete!

**Bot Sends Welcome Message:**
```
🎉 Registration Successful!

Your AI Sales Assistant is ready! 🤖

Your Account Details:
🤖 Bot Number: 919876543210
📱 Admin Number: 919123456789
🎟️ Referral Code: REF-ABC123
📅 Trial Ends: Nov 3, 2025
💎 Plan: Standard (Trial)

Quick Start Guide:

1️⃣ Set Your Business Name
   Send: /set_business YourBusinessName

2️⃣ Add Products (3 methods)
   • Manual: /add_product
   • Import: Upload product list
   • Sync from Zoho

3️⃣ Configure Bot
   • Language: /set_language Hinglish
   • Personality: /set_personality
   • Welcome message: /set_welcome

4️⃣ Access Admin Dashboard
   Visit: https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com

Admin Commands:
• /help - Show all commands
• /stats - View your statistics
• /add_product - Add new product
• /view_products - List all products
• /broadcast - Send message to all customers

Important:
Admin commands should be sent from the admin number (919123456789)
to the bot number (919876543210).

Need Help?
Reply "help" anytime for assistance!

Ready to serve your first customer! 🚀
```

## What Gets Created

When registration completes, a new tenant record is created with:

| Field | Value | Purpose |
|-------|-------|---------|
| `bot_phone_number` | Your Maytapi number (e.g., 919876543210) | Customer-facing bot number |
| `admin_phones[]` | Your admin number (e.g., 919123456789) | Controls admin access |
| `owner_whatsapp_number` | Number that initiated registration | Account recovery |
| `subscription_status` | `trial` | 7-day free trial |
| `subscription_tier` | `standard` | Standard plan features |
| `trial_ends_at` | Current date + 7 days | Trial expiration |
| `referral_code` | Auto-generated (e.g., REF-ABC123) | Referral tracking |

## How to Use After Registration

### Running Admin Commands

**From your admin number TO the bot number:**

```
From: 919123456789 (your admin number)
To: 919876543210 (your bot number)
Message: /add_product
```

The bot will respond with admin commands because it recognizes you as an admin.

### Customer Interactions

**Customers message the bot number:**

```
From: 918888888888 (customer)
To: 919876543210 (your bot number)
Message: I want to order some products
```

The AI bot responds and helps them place orders.

## Duplicate Registration Protection

If you try to register again with a number that's already registered:

```
You: register

Bot: You're already registered! 🎉

*Business:* ABC Company
*Plan:* standard (trial)

Would you like to:
• Update your business details
• Upgrade your plan
• Access admin dashboard

If you want to create a DIFFERENT tenant account with separate
bot/admin numbers, please contact support.
```

## Troubleshooting

### Issue: "Invalid phone number format"

**Solution:**
- Use only digits (10-15 characters)
- Country code is required (e.g., 91 for India)
- Accepted formats: `919876543210`, `+919876543210`, `91-9876-543210`

### Issue: Registration doesn't start

**Possible causes:**
1. You're messaging a number that's not set up as a bot
2. The bot service is down
3. You typed "register" with typos (it's case-insensitive but must be exact)

**Solution:**
- Ensure you're messaging the correct Maytapi number
- Try typing exactly: `register`

### Issue: Bot responds with AI chat instead of registration

**Possible causes:**
1. The webhook isn't routing to registration handler
2. You already have an account

**Solution:**
- Check if you're already registered (try `/help` to see if you get admin commands)
- Contact support if issue persists

### Issue: Can I use the same number for bot and admin?

**Yes!** You can provide the same number for both:
```
Bot Number: 919876543210
Admin Number: 919876543210
```

This means the same number acts as both customer-facing bot AND admin control.

### Issue: Can I change the numbers later?

**Currently:** No direct self-service option
**Workaround:** Contact support to update bot or admin numbers

**Future Enhancement:** Admin dashboard will allow updating these settings

## Next Steps After Registration

1. **Set Business Name**
   ```
   /set_business My Amazing Store
   ```

2. **Add Your First Product**
   ```
   /add_product
   ```
   Follow the guided flow to add product details

3. **Test Customer Flow**
   - Message your bot from a different number
   - Try placing an order
   - See how AI responds

4. **Configure Language**
   ```
   /set_language Hinglish
   ```
   Options: English, Hindi, Hinglish, Arabic

5. **Access Dashboard**
   - Visit: https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com
   - View analytics, orders, customers

## Support

If you encounter any issues during registration:

1. **Try Again:** Type `register` again to restart
2. **Cancel:** Reply `no` at any step to cancel
3. **Contact Support:** Reach out to the platform administrator

## Important Notes

- ✅ Registration is **completely free** - no credit card required
- ✅ You get a **7-day trial** of the Standard plan
- ✅ Trial automatically expires after 7 days (no auto-charge)
- ✅ Bot and admin numbers can be the same or different
- ✅ You can add more admin numbers later
- ✅ All data is stored securely in the database
- ⚠️ One account per phone number (duplicate protection)

## Example: Complete Registration Session

```
[User messages their Maytapi number]

User: register

Bot: 🚀 Welcome to WhatsApp AI Sales Assistant!
     [Shows features]
     Want to proceed? Reply YES or NO

User: yes

Bot: 📱 Step 1: Bot Phone Number
     Please provide your Maytapi WhatsApp Business number...

User: 919876543210

Bot: 📱 Step 2: Admin Phone Number
     Please provide your admin WhatsApp number...

User: 919123456789

Bot: 🎉 Registration Successful!
     Your Account Details:
     🤖 Bot Number: 919876543210
     📱 Admin Number: 919123456789
     🎟️ Referral Code: REF-A1B2C3D4
     📅 Trial Ends: Nov 3, 2025
     💎 Plan: Standard (Trial)

     Quick Start Guide:
     1️⃣ Set Your Business Name: /set_business YourBusinessName
     ...

     Ready to serve your first customer! 🚀

[User can now start using admin commands]

User: /add_product

Bot: [Admin product addition flow starts]
```

---

**Happy selling with your AI Sales Assistant! 🚀**
