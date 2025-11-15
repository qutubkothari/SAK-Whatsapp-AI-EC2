# Customer Type-Based Pricing Logic

## Overview
The system now implements different pricing strategies based on whether a customer is **RETURNING** or **NEW**.

---

## Business Rules

### 🔄 RETURNING CUSTOMERS
**Definition**: Customers who have at least 1 confirmed/completed order in the system.

#### Cart Display
- **Shows**: Last purchase prices (loyal customer pricing)
- **Example**: If they previously bought NFF 8x80 at ₹2,404.8, cart shows ₹2,404.8 (not catalog ₹2,505)
- **Benefit**: Returning customers always see their better negotiated prices

#### Discount Requests
- **Behavior**: Routed to human agent for personal negotiation
- **Message**: 
  > "Thank you for your continued business! 🙏 I've forwarded your discount request to our team. One of our representatives will get back to you shortly with a special offer. We truly value your loyalty! 💙"
- **Flag Set**: `needsHumanAgent: true`, `returningCustomerDiscountRequest: true` in conversation context
- **Reason**: Loyal customers deserve personalized attention and better deals

---

### 🆕 NEW CUSTOMERS
**Definition**: Customers with 0 confirmed/completed orders.

#### Cart Display
- **Shows**: Catalog prices only
- **Example**: NFF 8x80 shows ₹2,505 (catalog price)
- **Benefit**: Clear, consistent pricing for first-time buyers

#### Discount Requests
- **Behavior**: Dashboard discount rules applied automatically
- **Rules Applied** (from discount dashboard):
  - **NFF Category**: 2% discount (id: 06426d37-6b3b-4e17-a64a-b247321a9810)
  - **Category Discount**: 5% discount (id: d5b2bfd3-d5a4-4fde-a83b-c67e1f1ac35c)
  - **Volume Discount**: 10% for 5+ cartons (id: 01bcd588-dd28-49de-8f46-c4ca48497ac6)
- **Message**: AI negotiates using configured dashboard limits
- **Reason**: Instant gratification, automated service for new customers

---

## Technical Implementation

### 1. Customer Type Detection
**File**: `services/cartService.js` (lines 746-760)

```javascript
// Check if customer has previous orders
const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('customer_profile_id', customerProfileId)
    .in('status', ['confirmed', 'completed']);

isReturningCustomer = count > 0;
```

### 2. Pricing Strategy
**File**: `services/cartService.js` (lines 764-766)

```javascript
// RETURNING: Show last purchase prices (ignorePriceOverride = false)
// NEW: Show catalog prices (ignorePriceOverride = true when no discount approved)
const ignorePriceOverride = !isReturningCustomer && negotiatedDiscountPercent === 0;
```

### 3. Price Selection Logic
**File**: `services/pricingService.js` (lines 156-176)

```javascript
if (options.ignorePriceOverride) {
    // NEW customer - force catalog price
    unitPrice = catalogPrice;
    priceSource = 'catalog';
} else if (lastPurchasePrice && options.isReturningCustomer) {
    // RETURNING customer - show loyal customer pricing
    unitPrice = lastPurchasePrice;
    priceSource = 'last_purchase';
}
```

### 4. Discount Request Routing
**File**: `routes/handlers/modules/discountHandler.js` (lines 38-70)

```javascript
if (isReturningCustomer) {
    // Route to human agent
    await supabase.from('conversations').update({
        context_data: {
            needsHumanAgent: true,
            returningCustomerDiscountRequest: true
        }
    }).eq('id', conversation.id);
    
    return { response: 'Forwarded to team...' };
}

// NEW customers continue to automated discount negotiation
const discountResult = await handleDiscountNegotiation(...);
```

---

## Flow Diagrams

### RETURNING Customer Flow
```
Customer views cart
    ↓
System checks: Has orders? YES
    ↓
Cart shows: Last purchase prices (₹2,404.8)
    ↓
Customer says: "give me discount"
    ↓
System flags: needsHumanAgent = true
    ↓
Response: "Forwarded to our team..."
    ↓
Human agent handles negotiation
```

### NEW Customer Flow
```
Customer views cart
    ↓
System checks: Has orders? NO
    ↓
Cart shows: Catalog prices (₹2,505)
    ↓
Customer says: "give me discount"
    ↓
System checks: Dashboard discount rules
    ↓
Applies: NFF 2% + Category 5% = 7% discount
    ↓
Response: "I can offer you 7% discount..."
    ↓
Customer accepts → Order placed with discount
```

---

## Dashboard Configuration

### Current Active Discount Rules
From `discount_rules` table for tenant `a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6`:

| Name | Type | Discount | Conditions | Applied To |
|------|------|----------|------------|------------|
| NFF | category | 2% | None | Category: NFF (5714eefa...) |
| Category Discount | category | 5% | None | Category: NFF (5714eefa...) |
| Test Discount | volume | 10% | Min 5 cartons | All products |
| Welcome Coupon | coupon | 15% | Min ₹1000, Code: WELCOME15 | All products |

**Note**: These rules only apply to NEW customers. Returning customers bypass these rules and go to human agents.

---

## Debug Logging

Enhanced logs available in production:

```
[CART_VIEW] Customer type: RETURNING - Orders: 3
[CART_VIEW] - ignorePriceOverride flag: false
[PRICING] ✅ RETURNING customer, using last purchase price: ₹2404.8

[CART_VIEW] Customer type: NEW - Orders: 0
[CART_VIEW] - ignorePriceOverride flag: true
[PRICING] ⚠️ ignorePriceOverride=true (NEW customer), forcing catalog price: ₹2505

[DISCOUNT_HANDLER] 🚨 RETURNING customer discount request - needs human agent
[DISCOUNT_HANDLER] NEW customer - applying dashboard discount rules
```

---

## Testing Scenarios

### Test 1: Returning Customer (e.g., +918484830021)
1. Request: "i need price for 8x80 50ctns"
2. Expected: Cart shows ₹2,404.8 (last purchase price)
3. Request: "give me discount"
4. Expected: "Forwarded to our team..." message
5. Check: `needsHumanAgent: true` flag set in conversation

### Test 2: New Customer (new phone number)
1. Request: "i need price for 8x80 50ctns"
2. Expected: Cart shows ₹2,505 (catalog price)
3. Request: "give me discount"
4. Expected: AI offers 7% discount (2% NFF + 5% Category)
5. Accept: Discount applied, order total reduced

---

## Configuration Management

To modify discount rules for new customers:
1. Go to: https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/discounts.html
2. Edit existing rules (NFF, Category Discount, etc.)
3. Changes apply immediately to NEW customer discount requests
4. RETURNING customers still route to human agents (unaffected)

---

## Deployment
- **Deployed**: October 28, 2025
- **Version**: auto-deploy-20251028-175638
- **Commit**: 1c157e4
- **Status**: ✅ Live in production
