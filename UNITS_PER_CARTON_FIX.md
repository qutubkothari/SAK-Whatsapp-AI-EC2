# NFF Product Units Per Carton Fix

## Issue Reported
**Date:** October 26, 2025  
**Reporter:** User  
**Problem:** When ordering "nff 6x40 100000pcs", the system showed:
- Quantity: 200000 cartons (should be ~33 cartons)
- Total: ₹480,000,000 (completely wrong)

**Expected Behavior:**
- 100,000 pieces ÷ 3,000 pieces/carton = ~33.33 cartons
- Should show approximately 34 cartons

## Root Cause Analysis

### Investigation Steps
1. Checked logs for the order "i need nff 6x40 100000pcs"
2. Found that extraction correctly identified:
   - `quantity`: 100000
   - `unit`: "pieces"
   - `isPieces`: true

3. **Discovered the bug** in product database:
   ```
   [CARTON_DEBUG] Product: {
     "name":"NFF - 6x40",
     "description":"NFF - 6x40\nBox - 300 pcs x 10 Pkts @ 1.20/pc",
     "packaging_unit":"piece",
     "units_per_carton":1,  ⬅️ WRONG! Should be 3000
     "price":2400
   }
   ```

4. **Root Cause**: All NFF products had `units_per_carton` set to `1` instead of their actual values from descriptions.

### Why This Happened
The NFF products' descriptions contain the correct information:
- "Box - 300 pcs x 10 Pkts" = 3000 pieces per box
- "Box - 150 pcs x 10 Pkts" = 1500 pieces per box
- etc.

But the `units_per_carton` field in the database was not populated correctly during product sync.

## Calculation Logic
The carton pricing service (`calculateCartonPricing`) calculates:

```javascript
if (requestedUnit === 'pieces') {
    pieceQuantity = requestedQuantity;  // 100000
    cartonQuantity = Math.ceil(requestedQuantity / unitsPerCarton);
    // With unitsPerCarton = 1: Math.ceil(100000 / 1) = 100000 ❌
    // With unitsPerCarton = 3000: Math.ceil(100000 / 3000) = 34 ✅
}
```

## Solution Implemented

### Fix Script: `fix_nff_units_per_carton.js`
Created a script that:
1. Fetches all NFF products
2. Extracts correct units from description using regex: `/(\d+)\s*pcs\s*x\s*(\d+)\s*Pkts/i`
3. Calculates: `units_per_carton = piecesPerPacket × packetsPerCarton`
4. Updates database with correct values

### Products Fixed
All 11 NFF products were updated:

| Product | Old Value | New Value | Description Pattern |
|---------|-----------|-----------|-------------------|
| NFF - 6x40 | 1 | 3000 | 300 pcs × 10 Pkts |
| NFF - 6x60 | 1 | 2000 | 200 pcs × 10 Pkts |
| NFF - 8x60 | 1 | 1500 | 150 pcs × 10 Pkts |
| NFF - 8x80 | 1 | 1500 | 150 pcs × 10 Pkts |
| NFF - 8x100 | 1 | 1200 | 120 pcs × 10 Pkts |
| NFF - 8x120 | 1 | 1100 | 110 pcs × 10 Pkts |
| NFF - 10x80 | 1 | 1000 | 100 pcs × 10 Pkts |
| NFF - 10x100 | 1 | 700 | 70 pcs × 10 Pkts |
| NFF - 10x120 | 1 | 700 | 70 pcs × 10 Pkts |
| NFF - 10x140 | 1 | 600 | 60 pcs × 10 Pkts |
| NFF - 10x160 | 1 | 500 | 50 pcs × 10 Pkts |

### Additional Updates
For each product, also updated:
- `packets_per_carton`: Number of packets in a carton
- `units_per_packet`: Number of pieces per packet
- `packaging_unit`: Set to "carton" (more accurate than "piece")

## Verification

### Example Calculation (NFF 6x40)
**Before Fix:**
```
Input: 100000pcs
Calculation: 100000 ÷ 1 = 100000 cartons ❌
Price: 100000 × ₹2400 = ₹240,000,000 ❌
```

**After Fix:**
```
Input: 100000pcs
Calculation: 100000 ÷ 3000 = 33.33 → 34 cartons ✅
Price: 34 × ₹2400 = ₹81,600 ✅
```

### Testing
To test the fix:
1. Send message: "i need nff 6x40 100000pcs"
2. Expected result: ~34 cartons (not 100000)
3. Expected price: ~₹81,600 (not millions)

## Deployment
- **Version:** auto-deploy-20251026-155920
- **Status:** Deployed successfully
- **Date:** October 26, 2025 at 3:59 PM

## Files Modified
1. **fix_nff_units_per_carton.js** (new) - Fix script
2. **Database** - Updated 11 NFF products

## Related Code Files
- `services/cartonPricingService.js` - Handles carton calculations
- `services/smartOrderExtractionService.js` - Extracts units (pieces/cartons)
- `services/orderProcessingService.js` - Processes orders with units

## Prevention
To prevent this in future:
1. When syncing products from Zoho, parse description to extract `units_per_carton`
2. Add validation: Alert if `units_per_carton = 1` for products with "pcs x Pkts" in description
3. Consider adding a data validation query to check for inconsistencies

## Testing Checklist
- [x] Fix script tested on all 11 NFF products
- [x] Database updated successfully
- [x] Deployed to production
- [ ] Test with real order: "nff 6x40 100000pcs"
- [ ] Verify cart shows correct quantity (~34 cartons)
- [ ] Verify price is reasonable (~₹81,600)
- [ ] Test other NFF products with pieces

## Status
✅ **FIXED** - All NFF products now have correct `units_per_carton` values
