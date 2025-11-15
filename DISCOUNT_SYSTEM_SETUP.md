# Discount Management System - Setup Guide

## Step 1: Run Database Migration ✅

**File Created:** `migrations/create_discount_management_system.sql`

### How to Run:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run the Migration**
   - Click "New Query"
   - Copy the entire contents of `migrations/create_discount_management_system.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Creation**
   - Run this query to confirm:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('discount_rules', 'discount_applications');
   ```
   - Should return 2 rows

## Database Schema Overview

### Table 1: `discount_rules`
Stores all discount configuration rules.

**Key Columns:**
- `name` - Discount rule name (e.g., "Bulk Order Discount")
- `discount_type` - Type: volume, customer, product, category, coupon, etc.
- `discount_value_type` - 'percentage' or 'fixed_amount'
- `discount_value` - The discount amount (5 for 5%, or 500 for ₹500)
- `min_order_value` - Minimum order value to qualify
- `min_quantity` / `max_quantity` - Quantity-based rules
- `applicable_customer_tiers` - Array: ['vip', 'wholesale', 'retail']
- `coupon_code` - Unique coupon code if type='coupon'
- `valid_from` / `valid_to` - Time-based validity
- `priority` - Higher priority rules applied first
- `is_active` - Enable/disable rule

### Table 2: `discount_applications`
Audit log of every discount applied to orders.

**Key Columns:**
- `discount_rule_id` - Reference to the rule used
- `order_id` - Order that received discount
- `discount_amount` - Actual discount given
- `order_value_before_discount` / `order_value_after_discount`
- `applied_at` - Timestamp

## Discount Types Supported

1. **Volume Discounts** - Based on quantity (bulk orders)
2. **Customer-Specific** - VIP, wholesale, retail customer tiers
3. **Product-Specific** - Discount on specific products
4. **Category-Specific** - Discount on product categories
5. **Coupon Codes** - Apply code for discount
6. **Time-Based** - Flash sales, festive offers
7. **First Order** - New customer discount
8. **Loyalty** - Based on total historical spend

## Example Discount Rules

### Example 1: Volume Discount
```sql
INSERT INTO discount_rules (
    tenant_id, name, description, 
    discount_type, discount_value_type, discount_value,
    min_quantity, is_active, priority
) VALUES (
    'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6',
    'Bulk Order 5% Off',
    'Get 5% discount on orders of 50+ units',
    'volume', 'percentage', 5.00,
    50, true, 10
);
```

### Example 2: VIP Customer Discount
```sql
INSERT INTO discount_rules (
    tenant_id, name, description,
    discount_type, discount_value_type, discount_value,
    applicable_customer_tiers, is_active, priority
) VALUES (
    'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6',
    'VIP 10% Discount',
    'Exclusive discount for VIP customers',
    'customer', 'percentage', 10.00,
    ARRAY['vip'], true, 20
);
```

### Example 3: Coupon Code
```sql
INSERT INTO discount_rules (
    tenant_id, name, description,
    discount_type, discount_value_type, discount_value,
    max_discount_amount, min_order_value,
    coupon_code, coupon_usage_limit,
    valid_from, valid_to, is_active, priority
) VALUES (
    'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6',
    'FESTIVE2025',
    'Festive Season Special - 15% off',
    'coupon', 'percentage', 15.00,
    2000.00, 10000.00,
    'FESTIVE2025', 500,
    NOW(), NOW() + INTERVAL '30 days', true, 15
);
```

## Next Steps

Once migration is complete:
1. ✅ Database schema created
2. ⏳ Create backend API endpoints
3. ⏳ Create discount calculation service
4. ⏳ Build dashboard UI
5. ⏳ Integrate with order flow
6. ⏳ Test and deploy

---

**Ready to proceed?** Run the SQL migration in Supabase, then I'll create the backend APIs!
