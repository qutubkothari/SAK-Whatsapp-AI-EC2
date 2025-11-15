# Automatic Follow-Up System Documentation

## Overview
Your WhatsApp bot has **THREE types** of automatic messaging systems:

### 1. **Manual Follow-Ups** (Customer-Initiated)
Customer explicitly requests: "remind me in 2 hours", "call me tomorrow"

### 2. **Automatic Follow-Ups** (AI-Driven)
System automatically schedules follow-ups when customer doesn't complete an action

### 3. **🆕 Smart Reorder Reminders** (Purchase Pattern Based)
System predicts when customer will need to reorder based on buying history

---

## 🆕 Smart Reorder Reminders (Purchase Pattern Based)

### How It Works:

Your bot analyzes customer purchase patterns and automatically sends reminders when they're due for a reorder!

#### **Algorithm:**

1. **Analyzes Order History:**
   ```javascript
   // Tracks all previous orders
   Order 1: Jan 1, 2025
   Order 2: Jan 31, 2025 (30 days later)
   Order 3: Mar 2, 2025 (30 days later)
   
   Average Interval: 30 days
   ```

2. **Predicts Next Order:**
   ```javascript
   Last Order: Mar 2, 2025
   Today: Mar 29, 2025
   Days Since Last Order: 27 days
   Average Interval: 30 days
   
   Status: Customer is 90% through their typical cycle (27/30 days)
   Action: Send reorder reminder!
   ```

3. **Sends Personalized Message:**
   ```
   Hi Aatif! It's been 27 days since your last order. 
   Need 10x100, 8x100, 12x80? Let me know! 😊
   ```

### **Key Features:**

✅ **Smart Timing:** Only sends when customer is 90%+ through their typical reorder cycle
✅ **Personalized:** Mentions their regular products by name
✅ **Respectful:** Won't spam - checks daily message limits
✅ **Opt-Out Ready:** Customers can disable reminders
✅ **Multi-Product:** Suggests their top 2-3 regular products

### **Configuration:**

#### Minimum Orders Required:
- **2+ orders** needed for frequency analysis
- More orders = better prediction accuracy

#### When Reminders Are Sent:
```javascript
// Example calculation:
averageInterval = 30 days
daysSinceLastOrder = 27 days
reminderThreshold = 90% of interval (27 days)

if (daysSinceLastOrder >= reminderThreshold) {
  sendReorderReminder(); // ✅ Send
}
```

#### Database Tables:

**`customer_profiles`:**
- Links customers to their order history via `zoho_customer_id`
- Tracks last_order_date

**`orders`:**
- Contains all purchase history
- Links to customers via `zoho_customer_id`

**`proactive_messages`:**
- Queues reorder reminders
- Tracks scheduled_for, status, message_type

**`customer_messaging_preferences`:**
- Controls reorder reminder opt-in/out
- Tracks weekly message limits
- Prevents spam

### **Message Templates:**

The system uses natural, friendly variations:

```javascript
const messages = [
  `Hi ${firstName}! It's been ${days} days since your last order. Need ${products}? Let me know! 😊`,
  `Hey ${firstName}! Time for a reorder? You usually get ${products}. Want to place an order?`,
  `${firstName}, just checking in! Need your usual ${products}? It's been ${days} days. 📦`,
];
```

### **Daily Processing:**

**Scheduler runs in TWO stages:**

#### Stage 1: Daily Analysis (9 AM - High Priority)
Task: "Smart Reorder Reminders"
1. Analyzes all customers with order history
2. Calculates purchase frequency for each
3. Identifies customers due for reorder (90%+ of cycle)
4. Generates personalized messages
5. **Schedules messages** in `proactive_messages` table with `status='pending'`

#### Stage 2: Hourly Delivery (Every Hour - High Priority)
Task: "Send Scheduled Reorder Messages"
1. Checks `proactive_messages` table for `status='pending'`
2. Finds messages where `scheduled_for <= NOW()`
3. Sends messages via WhatsApp
4. Updates status to `'sent'`
5. Logs delivery time

**Why Two Stages?**
- Analysis is expensive (once daily)
- Delivery is cheap (hourly)
- Messages scheduled for 9 AM next day
- Ensures reliable delivery even if analysis runs late

**Delivery:**
- Messages sent at 9 AM next day
- Batch processed (50 at a time)
- Respects customer preferences
- Logs all activity

### **Anti-Spam Protection:**

✅ Maximum messages per week (configurable per customer)
✅ Minimum 24 hours between messages
✅ Skips if already scheduled
✅ Checks opt-out preferences
✅ Only sends when truly due for reorder

---

## Overview
Your WhatsApp bot has **TWO types** of follow-up systems:

### 1. **Manual Follow-Ups** (Customer-Initiated)
Customer explicitly requests: "remind me in 2 hours", "call me tomorrow"

### 2. **Automatic Follow-Ups** (AI-Driven)
System automatically schedules follow-ups when customer doesn't complete an action

---

## Automatic Follow-Up Flow for Price Inquiries

### When Does It Trigger?

**Scenario:** Customer asks for a price but doesn't order

```
Customer: "how much for 10x100 10000 pieces"
Bot: "₹3.37/pc for 15 cartons"
[Customer goes silent for 5 minutes...]
```

### What Happens Automatically:

#### **Step 1: Conversation Timeout Detection** (5 minutes)
- System tracks active conversations in `realtimeTestingService.js`
- When customer messages arrive, a 5-minute timer starts
- If no response within 5 minutes, conversation is considered "ended"

**Code Location:** `services/realtimeTestingService.js` (lines 100-150)

#### **Step 2: AI Analysis**
When conversation timeout occurs:
```javascript
// System analyzes the conversation
const context = await analyzeConversationContext(tenantId, endUserPhone, conversationText);

// AI determines:
// - Lead temperature (Hot/Warm/Cold)
// - Customer intent (browsing/interested/ready_to_buy/price_shopping)
// - Key topics discussed
// - Sentiment (positive/neutral/negative)
// - Next best action
```

**Lead Temperature Criteria:**
- **Hot**: Asked prices, specific products, showed buying intent
- **Warm**: Asked questions, engaged but no clear buying signals
- **Cold**: Minimal engagement, basic questions only

#### **Step 3: Auto-Schedule Follow-Up**
Based on lead temperature, system sets `follow_up_at`:

| Lead Score | Follow-Up Time | Example |
|------------|---------------|---------|
| **Hot** 🔥 | 24 hours | "Hi! Following up on the 10x100 fasteners..." |
| **Warm** 🌡️ | 48 hours | "Just checking in about the pricing info..." |
| **Cold** ❄️ | 72 hours | "Did you have any questions about our products?" |

**Code:**
```javascript
const followUpIntervals = {
  'Hot': 24,   // 24 hours
  'Warm': 48,  // 48 hours
  'Cold': 72   // 72 hours
};

const hoursToAdd = followUpIntervals[leadScore] || 72;
const followUpTime = new Date();
followUpTime.setHours(followUpTime.getHours() + hoursToAdd);

await supabase
  .from('conversations')
  .update({
    follow_up_at: followUpTime.toISOString(),
    follow_up_count: 0,
    context_analysis: JSON.stringify(context)
  })
  .eq('id', convData.id);
```

#### **Step 4: Cron Job Sends Follow-Up**
- Cron job runs every hour via `scheduler.js`
- Function: `sendDueFollowUpReminders()` in `enhancedFollowUpService.js`
- Checks for conversations where `follow_up_at <= NOW`

**Follow-Up Message Includes Context:**
```
👋 Hi! Following up on the products you were interested in:

• 10x100 - 15 cartons @ ₹3.34/pc

Reminder: You have 3% discount approved! ✅

Ready to proceed with your order?

Would you like to proceed? Let me know how I can help! 😊
```

---

## Complete Example Timeline

```
10:00 AM - Customer: "how much for 10x100 10000 pieces"
10:00 AM - Bot: "₹3.37/pc for 15 cartons"
10:01 AM - Customer: "final discount"
10:01 AM - Bot: "2% discount - ₹3.30/pc"
10:02 AM - Customer: "give me more"
10:02 AM - Bot: "3% discount - ₹3.34/pc"
[Customer goes silent]
10:07 AM - System: Conversation timeout (5 min)
10:07 AM - AI Analysis: Lead Score = "Hot" (price negotiation)
10:07 AM - System: Schedule follow_up_at = Tomorrow 10:07 AM

--- Next Day ---
10:07 AM - Cron: Sends follow-up message with context
```

---

## Configuration & Customization

### 1. **Change Follow-Up Intervals**
Edit `services/realtimeTestingService.js` or `services/enhancedFollowUpService.js`:

```javascript
const followUpIntervals = {
  'Hot': 12,   // Change to 12 hours for hot leads
  'Warm': 24,  // Change to 24 hours for warm leads
  'Cold': 48   // Change to 48 hours for cold leads
};
```

### 2. **Change Conversation Timeout**
Edit `services/realtimeTestingService.js`:

```javascript
// Current: 5 minutes (5 * 60 * 1000)
const CONVERSATION_TIMEOUT = 5 * 60 * 1000;

// Change to 10 minutes:
const CONVERSATION_TIMEOUT = 10 * 60 * 1000;
```

### 3. **Disable Automatic Follow-Ups**
Comment out in `scheduler.js`:

```javascript
// { 
//     name: 'Enhanced Follow-ups (AI-Driven)', 
//     func: sendDueFollowUpReminders,
//     priority: 'high',
// },
```

---

## Database Schema

### `conversations` Table
```sql
- follow_up_at: TIMESTAMPTZ (when to send follow-up)
- follow_up_count: INTEGER (number of follow-ups sent)
- last_follow_up_at: TIMESTAMPTZ (when last follow-up was sent)
- context_analysis: JSONB (AI analysis of conversation)
- lead_score: TEXT (Hot/Warm/Cold)
- state: TEXT (pricing_inquiry, discount_approved, etc.)
- last_quoted_products: JSONB (products customer asked about)
```

---

## Manual vs Automatic Follow-Ups

### Manual (Customer Requests)
✅ **Use Case:** Customer explicitly asks
- "remind me in 2 hours"
- "call me tomorrow"
- "follow up next week"

✅ **Table:** `scheduled_followups`

✅ **Trigger:** Immediate scheduling

✅ **Processor:** `followUpSchedulerService.js` + `followUpCron.js` (every 5 mins)

### Automatic (AI-Driven)
✅ **Use Case:** Customer goes silent after engagement
- Asked for prices but didn't order
- Negotiated discount but didn't confirm
- Added items to cart but didn't checkout

✅ **Table:** `conversations.follow_up_at`

✅ **Trigger:** 5-minute conversation timeout

✅ **Processor:** `enhancedFollowUpService.js` (runs hourly)

---

## Abandoned Cart Follow-Ups

**Separate system** for cart abandonment:

### Trigger:
- Customer added items to cart
- Cart not converted to order
- Time threshold: Configurable per tenant (default: 24 hours)

### Configuration:
In `tenants` table:
- `abandoned_cart_delay_hours`: How long to wait (default: 24)
- `abandoned_cart_message`: Custom message to send

### Processor:
- Function: `processAbandonedCarts()` in `abandonedCartService.js`
- Runs: Every hour via scheduler
- Sends: Tenant-configured reminder message

---

## Testing the System

### Test Automatic Follow-Up:

```bash
# 1. Send price inquiry
Message: "how much for 10x100 10000 pieces"

# 2. Wait 5 minutes (or trigger manually)
node -e "require('./services/realtimeTestingService').triggerAnalysis('tenant-id', 'phone')"

# 3. Check database
SELECT follow_up_at, lead_score, context_analysis 
FROM conversations 
WHERE end_user_phone = '919106886259@c.us';

# 4. Manually trigger follow-up cron (don't wait)
node -e "require('./services/enhancedFollowUpService').sendDueFollowUpReminders()"
```

### Test Manual Follow-Up:

```bash
# 1. Send follow-up request
Message: "remind me in 2 minutes"

# 2. Check database
SELECT * FROM scheduled_followups 
WHERE end_user_phone = '919106886259@c.us' 
ORDER BY created_at DESC LIMIT 1;

# 3. Wait 2 minutes or manually trigger
node -e "require('./services/followUpSchedulerService').processScheduledFollowUps()"
```

---

## Current Settings

Based on your codebase:

✅ **Conversation Timeout:** 5 minutes
✅ **Hot Lead Follow-Up:** 24 hours
✅ **Warm Lead Follow-Up:** 48 hours
✅ **Cold Lead Follow-Up:** 72 hours
✅ **Follow-Up Cron:** Runs hourly
✅ **Manual Follow-Up Cron:** Runs every 5 minutes
✅ **Context Capture:** ✅ Enabled (products, prices, discounts)
✅ **AI Analysis:** ✅ Enabled (GPT-powered)

---

## Summary

**For your question:** *"If a customer asks for price and doesn't confirm the order, when will a follow-up be sent?"*

**Answer:**
1. **After 5 minutes of silence:** AI analyzes the conversation
2. **Lead score assigned:** Hot/Warm/Cold based on engagement
3. **Follow-up scheduled:**
   - Hot leads (showed buying intent): **24 hours**
   - Warm leads (engaged but unclear): **48 hours**
   - Cold leads (minimal engagement): **72 hours**
4. **Follow-up includes context:** Products discussed, prices quoted, discounts offered
5. **Sent automatically:** By hourly cron job

**Example:** If customer asks "how much for 10x100" at 10:00 AM and goes silent, they'll get a follow-up with full context at 10:00 AM next day (assuming Hot lead).
