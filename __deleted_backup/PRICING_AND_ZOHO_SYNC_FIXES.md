# Pricing and Zoho Sync Fixes - October 16, 2025

## Issues Identified and Fixed

### 1. ✅ Wrong Last Purchase Price Display
**Problem:** Bot showing ₹251.10/carton instead of ₹2,325/carton for NFF 8x80
**Root Cause:** Corrupted order in database from October 15, 2025
**Solution:** Deleted corrupted order (Order ID: 7f727e91-6618-45f6-b865-ffdcbcad3192)

### 2. ✅ Sales Order Using Wrong Price
**Problem:** Bot quoted correct personalized price, but Zoho sales order created with different price
**Root Cause:** Code was sending total price as the rate instead of per-unit price
**Solution:** Fixed `services/zohoSalesOrderService.js` line 293:
```javascript
// OLD: rate: item.price_at_time_of_purchase
// NEW: rate: item.price_at_time_of_purchase / item.quantity
```

### 3. ✅ Missing zoho_item_id in order_items
**Problem:** `zoho_item_id` was NULL in order_items table after Zoho sync
**Root Cause:** Not saving the line_item_id from Zoho's response
**Solution:** Added logic in `zohoSalesOrderService.js` to update order_items with zoho_item_id from Zoho's response after sales order creation

### 4. ✅ GST Calculation Error
**Problem:** Database storing wrong prices - treating prices as if they include GST when they should be before GST
**Example:**
- Zoho rate: ₹2,310 (BEFORE GST)
- Correct final price: ₹2,310 × 1.18 = ₹2,725.80
- Database was storing: ₹2,310 as if it included GST, then backward calculating to ₹1,957.63

**Root Cause:** All pricing calculation functions assumed input prices included GST and divided by 1.18
**Solution:** Fixed pricing logic in:
- `services/orderProcessingService.js` - calculatePricingBreakdown()
- `services/enhancedOrderProcessingWithZoho.js` - calculatePricingBreakdown()
- `services/zohoOrderSyncService.js` - updateOrderItemPricesFromZoho() and createOrderFromZoho()

### 5. ✅ No Automatic Zoho Sync
**Problem:** Zoho order sync was not running automatically
**Solution:** Added hourly cron job in `scheduler.js`:
```javascript
// Runs every hour at minute 0
cron.schedule('0 * * * *', async () => {
    await scheduleZohoOrderSync();
});
```

## Technical Details

### Database Schema Understanding
- **`products.price`**: Price BEFORE GST (per carton)
- **`order_items.unit_price_before_tax`**: Price per carton BEFORE GST
- **`order_items.price_at_time_of_purchase`**: TOTAL price for all units INCLUDING GST
- **`order_items.gst_amount`**: Total GST amount for all units
- **`order_items.zoho_item_id`**: Zoho's line_item_id for tracking

### Correct Pricing Calculation Formula
```javascript
// Input: priceBeforeTax (per unit), quantity
const unitPriceBeforeTax = parseFloat(priceBeforeTax);
const priceWithTax = unitPriceBeforeTax * 1.18; // Add 18% GST
const totalPriceWithTax = priceWithTax * quantity;
const gstAmount = unitPriceBeforeTax * 0.18 * quantity;

// Store in database:
{
  unit_price_before_tax: unitPriceBeforeTax.toFixed(2),
  price_at_time_of_purchase: totalPriceWithTax.toFixed(2),
  gst_rate: 18,
  gst_amount: gstAmount.toFixed(2)
}
```

### Example Calculation (NFF 8x80, 100 cartons @ ₹2,310/ctn before GST)
```
unit_price_before_tax: ₹2,310.00
Price with GST per carton: ₹2,310 × 1.18 = ₹2,725.80
Total for 100 cartons: ₹2,725.80 × 100 = ₹272,580.00
GST amount: ₹2,310 × 0.18 × 100 = ₹41,580.00

Database storage:
- unit_price_before_tax: 2310.00
- price_at_time_of_purchase: 272580.00
- gst_rate: 18
- gst_amount: 41580.00
```

## Files Modified

1. **services/pricingDisplayService.js** (previous deployment)
   - Fixed personalized pricing query

2. **services/zohoSalesOrderService.js**
   - Fixed rate calculation (divide by quantity)
   - Added zoho_item_id saving logic
   - Added product_id to query

3. **services/orderProcessingService.js**
   - Fixed calculatePricingBreakdown() to treat input as BEFORE GST
   - Now multiplies by 1.18 instead of dividing

4. **services/enhancedOrderProcessingWithZoho.js**
   - Fixed calculatePricingBreakdown() function

5. **services/zohoOrderSyncService.js**
   - Fixed updateOrderItemPricesFromZoho() to correctly calculate total price
   - Fixed createOrderFromZoho() pricing logic

6. **scheduler.js**
   - Added hourly cron job for Zoho order sync

## Deployment History

- **auto-deploy-20251016-140040**: Fixed pricing display service
- **auto-deploy-20251016-141911**: Fixed Zoho sales order rate calculation
- **auto-deploy-20251016-143652**: Fixed GST calculations, zoho_item_id saving, and hourly sync

## Testing Recommendations

1. **Create a new test order** and verify:
   - Database stores correct unit_price_before_tax
   - Database stores correct price_at_time_of_purchase (total with GST)
   - GST amount is calculated correctly
   - Zoho sales order shows correct rate (before GST)
   - Zoho sales order total matches database

2. **Check existing orders** after sync runs:
   - Verify zoho_item_id is populated
   - Verify prices are correctly synced from Zoho

3. **Monitor hourly sync**:
   - Check logs at the top of each hour
   - Verify orders are being synced from Zoho

## Notes

- All prices in the `products` table should be stored as BEFORE GST
- Zoho Books API sends/receives rates as BEFORE GST
- Final customer-facing prices should always include 18% GST
- The bot's personalized pricing will now correctly show last purchase prices
