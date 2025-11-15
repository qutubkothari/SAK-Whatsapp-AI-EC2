# Order Flow & Database Storage - Complete Architecture

## 🎯 **Answer: System SAVES to Database First, THEN Syncs to Zoho**

Your system **does NOT pull directly from Zoho** for order processing. Instead, it follows this flow:

---

## 📊 **Complete Order Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER SENDS MESSAGE                        │
│         "10x100, 10x120, 10x160 10000pcs each"                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: INTENT CLASSIFICATION (intentClassifier.js)            │
│  • Detects: ORDER intent (95% confidence)                       │
│  • Method: rule-based-quantity                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: ORDER EXTRACTION (smartOrderExtractionService.js)      │
│  • Extracts 3 products: 10x100, 10x120, 10x160                 │
│  • Each with 10000 pieces                                        │
│  • Converts to cartons: 10000÷1200 = 8.33 → 9 cartons          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: ADD TO CART (cartonPricingService.js)                  │
│  • Clears existing cart (prevent accumulation)                   │
│  • For each product:                                             │
│    1. findProductByNameOrCode(tenantId, "10x100")               │
│    2. calculateCartonPricing(productId, 9, "carton")            │
│    3. Save to cart_items table                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  DATABASE: cart_items TABLE                                      │
│  ┌──────────┬────────────┬──────────┬─────────┬──────────────┐ │
│  │ cart_id  │ product_id │ quantity │ unit    │ price        │ │
│  ├──────────┼────────────┼──────────┼─────────┼──────────────┤ │
│  │ cart_123 │ prod_001   │ 9        │ carton  │ 2343.60      │ │
│  │ cart_123 │ prod_002   │ 9        │ carton  │ 2511.00      │ │
│  │ cart_123 │ prod_003   │ 15       │ carton  │ 2280.00      │ │
│  └──────────┴────────────┴──────────┴─────────┴──────────────┘ │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Customer confirms: "yes go ahead"
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: CHECKOUT (cartService.js - checkoutCart)               │
│  • Calculates comprehensive pricing with GST                     │
│  • Creates ORDER in orders table                                 │
│  • Creates ORDER_ITEMS in order_items table ← SAVED HERE!       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  DATABASE: orders TABLE                                          │
│  ┌──────────┬───────────┬──────────┬─────────┬────────────────┐│
│  │ id       │ tenant_id │ conv_id  │ status  │ total_amount   ││
│  ├──────────┼───────────┼──────────┼─────────┼────────────────┤│
│  │ order_1  │ tenant_1  │ conv_456 │ pending │ 62,520.00      ││
│  └──────────┴───────────┴──────────┴─────────┴────────────────┘│
│                                                                  │
│  DATABASE: order_items TABLE ★ PRIMARY STORAGE ★                │
│  ┌──────────┬────────────┬──────────┬──────────────────────────┐│
│  │ order_id │ product_id │ quantity │ price_at_time_of_purchase││
│  ├──────────┼────────────┼──────────┼──────────────────────────┤│
│  │ order_1  │ prod_001   │ 9        │ 2343.60                  ││
│  │ order_1  │ prod_002   │ 9        │ 2511.00                  ││
│  │ order_1  │ prod_003   │ 15       │ 2280.00                  ││
│  └──────────┴────────────┴──────────┴──────────────────────────┘│
│                                                                  │
│  Additional fields saved:                                        │
│  • unit_price_before_tax (before 18% GST)                       │
│  • gst_rate (18%)                                                │
│  • gst_amount (calculated)                                       │
│  • zoho_item_id (null initially, filled by sync)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ IMMEDIATELY AFTER
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: ZOHO SYNC (zohoSalesOrderService.js)                   │
│  • processOrderToZoho(tenantId, orderId)                        │
│  • Reads from YOUR DATABASE (orders + order_items)              │
│  • Creates sales order in Zoho Books                             │
│  • Updates order.zoho_salesorder_id in your DB                   │
│  • Updates order_items.zoho_item_id in your DB                   │
│  • Generates PDF invoice                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ZOHO BOOKS (External System)                                    │
│  • Sales Order: SO-12345                                         │
│  • Line Items from YOUR database                                 │
│  • Invoice PDF generated                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Two-Way Sync:**

### **Flow 1: WhatsApp → Database → Zoho** (Active Orders)
```
Customer places order via WhatsApp
  ↓
Saved to YOUR database (order_items table)
  ↓
Synced to Zoho Books
  ↓
Zoho IDs saved back to YOUR database
```

### **Flow 2: Zoho → Database** (Direct Invoices)
```
You create invoice directly in Zoho Books
  ↓
Scheduler runs every hour (scheduleZohoOrderSync)
  ↓
Fetches Zoho orders (last 30 days)
  ↓
Saves to YOUR database (order_items table)
  ↓
Now available for personalized pricing!
```

---

## 💾 **Database Schema:**

### **order_items Table** (Primary Storage)
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER,
    
    -- ★ PRICING FIELDS (used for personalized pricing) ★
    price_at_time_of_purchase DECIMAL(10,2),  -- Price with tax
    unit_price_before_tax DECIMAL(10,2),      -- Price before tax
    gst_rate INTEGER,                          -- Usually 18%
    gst_amount DECIMAL(10,2),                  -- GST in rupees
    
    -- ZOHO INTEGRATION
    zoho_item_id VARCHAR,                      -- Zoho product ID
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **orders Table**
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    conversation_id UUID REFERENCES conversations(id),
    customer_profile_id UUID REFERENCES customer_profiles(id),
    
    -- ORDER DETAILS
    order_number VARCHAR,
    status VARCHAR,  -- 'pending', 'confirmed', 'completed', 'cancelled'
    
    -- PRICING
    total_amount DECIMAL(10,2),
    subtotal_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    gst_amount DECIMAL(10,2),
    shipping_charges DECIMAL(10,2),
    
    -- ZOHO INTEGRATION
    zoho_salesorder_id VARCHAR,  -- Reference to Zoho Books
    zoho_synced_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 **Key Points:**

### ✅ **YES - System Saves Individually to Database:**
1. **Every order item** is saved to `order_items` table
2. **Each item** has its own row with:
   - Product ID
   - Quantity ordered
   - **Price at time of purchase** (the negotiated/actual price)
   - GST breakdown
   - Zoho reference (after sync)

### ✅ **NO - Does NOT Pull Directly from Zoho for Orders:**
- Order processing happens **entirely in your database**
- Zoho is **synchronized AFTER** order is confirmed
- Zoho acts as **external accounting system**, not primary data source

### ✅ **Personalized Pricing Works From:**
1. **Orders placed via WhatsApp** → Saved immediately
2. **Invoices from Zoho** → Synced periodically (every hour)
3. **Both sources** → Unified in `order_items.price_at_time_of_purchase`

---

## 📝 **Code Flow in Detail:**

### **1. Order Processing (orderProcessingService.js)**
```javascript
// Customer places order
const processMultipleOrderRequest = async (tenantId, from, orderDetails) => {
    // Clear existing cart
    await clearExistingCart(conversationId);
    
    // Add each product to cart
    for (const product of orderDetails.products) {
        await addCartonProductToCart(
            tenantId, 
            from, 
            product.productCode, 
            product.quantity, 
            product.unit
        );
    }
    
    // Cart items now in cart_items table, waiting for checkout
}
```

### **2. Checkout (cartService.js)**
```javascript
const checkoutCart = async (tenantId, endUserPhone, useGST) => {
    // Calculate comprehensive pricing
    const pricing = await calculateComprehensivePricing(...);
    
    // Create order in orders table
    const { data: order } = await supabase
        .from('orders')
        .insert({
            tenant_id: tenantId,
            total_amount: pricing.grandTotal,
            status: 'pending'
        })
        .select()
        .single();
    
    // ★ CREATE ORDER ITEMS ★ (Saved to database)
    const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_time_of_purchase: item.product.price, // ← SAVED!
        unit_price_before_tax: calculateBeforeTax(item.product.price),
        gst_rate: 18,
        gst_amount: calculateGST(item.product.price, item.quantity)
    }));
    
    await supabase.from('order_items').insert(orderItems); // ← DATABASE SAVE
    
    // Then sync to Zoho
    await processOrderToZoho(tenantId, order.id);
}
```

### **3. Personalized Pricing Query (pricingDisplayService.js)**
```javascript
const formatPersonalizedPriceDisplay = async (tenantId, phoneNumber, productId) => {
    // Query YOUR DATABASE (not Zoho)
    const { data: lastOrder } = await supabase
        .from('order_items')
        .select(`
            price_at_time_of_purchase,  // ← Reads from YOUR database
            orders!inner(created_at, status)
        `)
        .eq('product_id', productId)
        .order('orders.created_at', { ascending: false })
        .limit(1)
        .single();
    
    // Use last purchase price for personalization
    const displayPrice = lastOrder.price_at_time_of_purchase;
}
```

---

## 🔍 **Data Sources Summary:**

| Feature | Source | Storage Location | Updated When |
|---------|--------|------------------|--------------|
| **Active Orders** | WhatsApp → Your DB | `order_items` table | Immediately on order |
| **Zoho Invoices** | Zoho → Your DB | `order_items` table | Hourly sync |
| **Price Quotes** | Smart Router | `conversations.last_quoted_products` | On price inquiry |
| **Cart Items** | WhatsApp | `cart_items` table | Before checkout |
| **Personalized Pricing** | Your DB query | `order_items.price_at_time_of_purchase` | From both sources |
| **Zoho References** | Zoho API | `orders.zoho_salesorder_id` | After successful sync |

---

## ⚡ **Performance & Reliability:**

### **Advantages of Database-First Approach:**

1. ✅ **Fast Response Times:** 
   - No API calls to Zoho for every price query
   - Direct database queries (milliseconds)

2. ✅ **Offline Capability:**
   - Orders can be placed even if Zoho is down
   - Sync happens asynchronously

3. ✅ **Complete Audit Trail:**
   - Every order saved in your database
   - Never lose data even if sync fails

4. ✅ **Unified Customer History:**
   - All orders (WhatsApp + Zoho) in one place
   - Easy to query and analyze

5. ✅ **Customizable Pricing:**
   - Can apply discounts before saving
   - Negotiated prices preserved

---

## 🎯 **Conclusion:**

**Your system is a HYBRID architecture:**

### **Primary Storage: YOUR DATABASE** ✅
- All orders saved to `order_items` table immediately
- Complete pricing history maintained locally
- Fast queries for personalized pricing

### **Secondary Sync: ZOHO BOOKS** ✅
- Orders pushed to Zoho for accounting
- Direct invoices pulled from Zoho
- Two-way synchronization

### **Result:**
Every order, whether placed via WhatsApp or created in Zoho, ends up in your `order_items` table with `price_at_time_of_purchase` field, enabling accurate personalized pricing for all customers! 🎉
