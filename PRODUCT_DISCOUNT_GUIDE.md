# How to Create Product-Specific Discounts

## Overview
Product-specific discounts allow you to apply discounts to individual products or groups of products. This is perfect for:
- Promotional discounts on specific items
- Clearance sales
- New product launch offers
- Seasonal product discounts

---

## Step-by-Step Guide

### 1. Access Discount Dashboard
- Go to: https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/discounts.html
- Or click **"Discounts"** tab in main dashboard

### 2. Create Product Discount
Click **"+ Create Discount"** button

### 3. Fill in Basic Information
- **Name**: e.g., "8x80 Soap Special Offer"
- **Description**: e.g., "20% off on 8x80 Soap"
- **Discount Type**: Select **"Specific Products"** from dropdown

### 4. Set Discount Value
- **Value Type**: Choose "Percentage (%)" or "Fixed Amount (₹)"
- **Discount Value**: Enter amount (e.g., 20 for 20% off or 500 for ₹500 off)
- **Max Discount Amount**: (Optional) Cap for percentage discounts

### 5. Select Products (New!)
When you select "Specific Products" type, a **product selector** appears:
- Shows all your products in a multi-select dropdown
- **Hold Ctrl** (Windows) or **Cmd** (Mac) to select multiple products
- Each product shows: `Product Name (Product Code)`
- Example: `8x80 Nirmal Soap (8X80)`

### 6. Set Conditions (Optional)
- **Min Order Value**: Minimum cart value required (e.g., ₹5000)
- **Min Quantity**: Minimum units needed (e.g., 10 units)
- **Valid From/To**: Date range for the discount
- **Priority**: Higher priority discounts apply first (0-100)
- **Can Stack**: Allow combining with other discounts

### 7. Save
Click **"Save Discount"** button

---

## Example: 20% Off on 8x80 Soap

```
Name: 8x80 Soap - 20% Off
Description: Special promotional discount on 8x80 Soap
Type: Specific Products
Value Type: Percentage
Discount Value: 20
Selected Products: [8x80 Nirmal Soap]
Min Quantity: 5 (discount only if customer orders 5+ units)
Priority: 10
Active: Yes
```

---

## How It Works

### Automatic Application
When a customer adds the selected product to their cart:

1. **Customer adds product**: "I want 10 units of 8x80"
2. **System checks**: Is there a product-specific discount for 8x80?
3. **Validates conditions**: Does order meet min quantity/value?
4. **Applies discount**: 20% off automatically applied
5. **Shows in cart**: Customer sees discounted price

### WhatsApp Example
```
Customer: "I want 15 units of 8x80 soap"

Bot Response:
📦 8x80 Nirmal Soap × 15 cartons
   ₹2,008/carton (was ₹2,511/carton) ✨ 20% OFF!

Pricing Breakdown:
Subtotal: ₹30,120
Discount: -₹7,530 (Product Discount: 8x80 Soap - 20% Off)
Shipping: ₹225
GST (18%): ₹4,082
Final Total: ₹26,897
```

---

## Category-Based Discounts

You can also create **category-wide discounts**:

### Steps:
1. **Discount Type**: Select **"Product Category"**
2. **Applicable Categories**: Enter category names (comma-separated)
   - Example: `Soap, Detergent, Shampoo`
3. **Discount**: Set percentage or fixed amount

### Example: 10% Off All Soaps
```
Name: All Soaps - 10% Off
Type: Product Category
Categories: Soap, Bar Soap, Liquid Soap
Discount Value: 10%
```

This applies 10% discount to ANY product in those categories.

---

## Combining Multiple Discounts

### Stackable Discounts
If **"Can stack with other discounts"** is checked:
- Product discount (20% off)
- + Volume discount (5% off on 50+ units)
- = **Total 25% savings**

### Non-Stackable (Default)
System picks the **best discount** for the customer:
- If 20% product discount is better than 5% volume discount
- → Customer gets 20% off

---

## Tips & Best Practices

### 1. Use Clear Names
✅ Good: "8x80 Soap - Festive Sale 20%"
❌ Bad: "Discount1"

### 2. Set Reasonable Minimums
- Min Quantity: Prevents abuse on single-unit orders
- Min Order Value: Ensures profitability

### 3. Test Before Activating
- Create discount with **Active: No**
- Test the calculation
- Then activate when ready

### 4. Monitor Performance
- Check **"Usage"** column in dashboard
- See how many times discount was applied
- Track total savings given

### 5. Use Priority Wisely
- **High priority (50-100)**: VIP/Special promotions
- **Medium priority (10-49)**: Regular product discounts
- **Low priority (0-9)**: Generic/fallback discounts

---

## Troubleshooting

### "Discount not applying"
**Check:**
- ✅ Discount is **Active**
- ✅ Product is correctly selected
- ✅ Customer meets minimum quantity/value
- ✅ Current date is within valid date range
- ✅ No conflicting higher-priority discounts

### "Can't see products in selector"
**Solutions:**
- Refresh the page
- Check products exist in `/api/products/:tenantId`
- Verify tenant ID is correct

### "Wrong discount applied"
**Reason:** Higher priority discount took precedence
**Solution:** Adjust priority values or check stacking settings

---

## Advanced: Multiple Products Discount

### Scenario: Buy Any 2 Premium Products, Get 15% Off

**Setup:**
```
Name: Premium Bundle - 15% Off
Type: Specific Products
Products: [Select all premium products]
Min Quantity: 2
Discount: 15%
```

Customer can mix and match any 2+ premium products to get discount!

---

## API Details (For Developers)

### Product IDs Storage
- Database field: `applicable_product_ids` (TEXT[] array)
- Stores UUIDs: `['a1b2c3d4-...', 'e5f6g7h8-...']`

### Matching Logic
When calculating discounts, system checks:
```javascript
if (rule.applicable_product_ids && rule.applicable_product_ids.length > 0) {
    const hasApplicableProduct = items.some(item => 
        rule.applicable_product_ids.includes(item.product_id)
    );
    if (!hasApplicableProduct) return false; // Discount not applicable
}
```

---

## Examples Library

### 1. Single Product Flash Sale
```
Name: 8x80 Flash Sale
Type: Product
Products: [8x80]
Discount: 30%
Valid: Today only
```

### 2. Buy More, Save More (Per Product)
```
Name: 8x80 Bulk Discount
Type: Product
Products: [8x80]
Discount: 15%
Min Quantity: 20
```

### 3. New Product Launch Offer
```
Name: New Shampoo Launch
Type: Product
Products: [New Shampoo ABC]
Discount: ₹100 off per unit
Valid: Next 7 days
```

### 4. Clearance Sale (Multiple Products)
```
Name: Old Stock Clearance
Type: Product
Products: [Select 10 old products]
Discount: 40%
```

---

## Support

Need help? Check:
1. **Dashboard Analytics**: See which discounts are working
2. **Audit Log**: `/api/discounts/:tenantId/applications/history`
3. **Discount Statistics**: Dashboard stats card

---

**Last Updated**: October 27, 2025
**Feature Status**: ✅ Deployed & Ready
