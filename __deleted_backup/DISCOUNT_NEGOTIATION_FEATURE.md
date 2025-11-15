# Discount Negotiation Feature - Complete Guide

**Deployed:** Version auto-deploy-20251015-203645  
**Status:** ✅ LIVE and OPERATIONAL

---

## 🎯 Overview

The bot now intelligently handles discount negotiations with customers. It evaluates requests based on:
- **Order quantity** (volume discount slabs)
- **Customer type** (new vs. returning)
- **Requested discount type** (percentage, specific price, or amount off)

---

## 📝 Supported Customer Messages

### 1. **Generic Discount Requests**

**Customer says:**
- "give me discount"
- "can you give some discount"
- "discount chahiye"
- "reduce the price"
- "lower the price"
- "kam karo"

**Bot response:**
```
💰 *Let's discuss pricing!*

📦 Based on your quantity (20 cartons):
• Standard discount: 2% - 3%

What are you looking for?
• Tell me your expected price per piece/carton
• Or what discount % you need
• Or say 'give me your best price' 😊
```

**Behavior:** Bot asks what the customer is expecting (smart qualification)

---

### 2. **"Give Me Your Best Price" Requests**

**Customer says:**
- "give me your best price"
- "final price kya hai"
- "last price"
- "best rate"
- "bottom price"

**Bot response for NEW customers:**
```
💎 *Here's my absolute best offer:*

📦 For 25 cartons:
• 3% discount (max for this quantity)
• Best available pricing

This is my final offer! 💪

Ready to proceed? 🚀
```

**Bot response for RETURNING customers:**
```
💎 *Here's my absolute best offer:*

✨ You're already getting personalized pricing!

📊 As my final offer, I'll add:
• An extra 1.5% discount on this order
• Priority processing
• Free shipping (if applicable)

This is the absolute best I can do! 🤝
```

**Behavior:** Bot offers maximum discount for their quantity tier (smart final offer)

---

### 3. **Specific Percentage Discount Requests**

**Customer says:**
- "give me 5% discount"
- "can you do 10 percent off"
- "3% kam karo"

**If ACCEPTABLE (within limits):**
```
✅ *Deal!*

I can offer you 5% discount on this order.

Ready to place the order with this pricing? 🎉
```

**If TOO HIGH (exceeds limits):**
```
😅 *I understand you're looking for the best price!*

For 15 cartons, our pricing policy allows up to 3% discount.

💡 *Want a better discount?*
Order more quantity to unlock higher discount tiers:
• 26+ cartons → 3-5% off

Shall I apply 3% discount for you?
```

**Behavior:** Evaluates against volume discount slabs, counter-offers if too high

---

### 4. **Specific Price Requests**

**Customer says:**
- "make it ₹1.45 per piece"
- "1.50 rupees me karo"
- "₹2300 per carton"

**If ACCEPTABLE:**
```
✅ *Deal!*

I can do ₹1.45 per piece for you.

Ready to place the order with this pricing? 🎉
```

**If NOT ACCEPTABLE:**
```
😅 *I understand you're looking for the best price!*

For 15 cartons, our pricing policy allows up to 3% discount.

💡 *Want a better discount?*
Order more quantity to unlock higher discount tiers:
• 26+ cartons → 3-5% off

Shall I apply 3% discount for you?
```

**Behavior:** Calculates equivalent discount percentage and evaluates

---

## 📊 Discount Evaluation Rules

### **Volume Discount Slabs (New Customers)**

| Cartons | Min Discount | Max Discount |
|---------|--------------|--------------|
| 1-10    | 0%           | 0%           |
| 11-25   | 2%           | 3%           |
| 26-50   | 3%           | 5%           |
| 51-100  | 5%           | 7%           |
| 100+    | 7%           | 10%          |

### **Returning Customers**
- Already have **personalized pricing** (their last purchase price)
- Can get **up to 1.5-2% additional discount**
- More conservative limits (they're already getting special rates)

---

## 🔄 Negotiation Flow Examples

### **Example 1: New Customer - 15 Cartons**

**Customer:** "give me discount"

**Bot:** 
```
💰 Let's discuss pricing!
📦 Based on your quantity (15 cartons):
• Standard discount: 2% - 3%

What are you looking for?
• Tell me your expected price
• Or what discount % you need
• Or say 'give me your best price'
```

**Customer:** "can you do 5%"

**Bot:**
```
😅 I understand you're looking for the best price!

For 15 cartons, our policy allows up to 3% discount.

💡 Want a better discount?
Order more quantity to unlock higher discount tiers:
• 26+ cartons → 3-5% off

Shall I apply 3% discount for you?
```

**Customer:** "okay give me 3%"

**Bot:**
```
✅ Deal!

I can offer you 3% discount on this order.

Ready to place the order with this pricing? 🎉
```

---

### **Example 2: Returning Customer**

**Customer:** "give me your best price"

**Bot:**
```
💎 Here's my absolute best offer:

✨ You're already getting personalized pricing!

📊 As my final offer, I'll add:
• An extra 1.5% discount on this order
• Priority processing
• Free shipping (if applicable)

This is the absolute best I can do! 🤝
```

**Customer:** "okay done"

**Bot:** (Proceeds with checkout using personalized price + 1.5% discount)

---

### **Example 3: Large Order - 150 Cartons**

**Customer:** "I need 150 ctns, best price?"

**Bot:**
```
💎 Here's my absolute best offer:

📦 For 150 cartons:
• 10% discount (max for this quantity)
• Best available pricing

This is my final offer! 💪

Ready to proceed? 🚀
```

**Customer:** "done"

**Bot:** (Applies 10% discount and processes order)

---

## 💾 Technical Implementation

### **How Discounts are Saved**

When a discount is approved, it's saved to the conversation:

```javascript
{
    state: 'discount_approved',
    metadata: {
        approvedDiscount: 5.0,
        discountTimestamp: '2025-10-15T20:36:45.000Z'
    }
}
```

### **Order Processing Integration**

When the order is placed:
1. Bot checks if `state === 'discount_approved'`
2. Reads `approvedDiscount` from metadata
3. Applies discount to final order total
4. Saves to `volume_discount_percent` and `volume_discount_amount` columns

---

## 🎭 Smart Behaviors

### **1. Context-Aware**
- Knows if customer has items in cart
- Calculates total quantity for discount eligibility
- Checks customer history for personalized treatment

### **2. Intelligent Counter-Offers**
- Doesn't just say "no" to high requests
- Suggests ordering more for better discounts
- Shows next tier requirements

### **3. Natural Language**
- Understands Hindi/Hinglish: "kam karo", "discount chahiye"
- Recognizes variations: "best price", "final price", "lowest rate"
- Detects specific requests: percentages, prices, amounts

### **4. Professional Yet Friendly**
- Uses emojis appropriately
- Clear, concise responses
- Builds trust with transparency

---

## ✅ Testing Results

All scenarios tested and working:

✅ Generic discount request → Asks for expectations  
✅ "Best price" request → Offers max discount  
✅ Specific % within limit → Accepts immediately  
✅ Specific % too high → Counter-offers  
✅ Specific price request → Calculates and evaluates  
✅ Returning customer → Lower additional discount  
✅ Large order → Higher discount tier  

---

## 🚀 Next Steps (Optional Enhancements)

1. **Admin Dashboard**: Configure discount slabs per tenant
2. **A/B Testing**: Test different counter-offer strategies
3. **Analytics**: Track conversion rates by discount level
4. **Seasonal Campaigns**: Override slabs for special promotions

---

**Deployment Status:** ✅ LIVE  
**Version:** auto-deploy-20251015-203645  
**Test Script:** `node test_discount_negotiation.js`
