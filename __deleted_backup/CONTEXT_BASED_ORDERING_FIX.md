# Context-Based Ordering Fix - "2ctns each" Issue

## Problem
When customers requested prices for multiple products:
```
Customer: give me prices for 8x80, 8x100, 10x160
Bot: [Shows prices with per-piece breakdown]
Customer: 2ctns each
Bot: Could you clarify what items you're referring to?
```

The system was failing to:
1. Remember the previously quoted products
2. Apply "2ctns each" to those products
3. Process the order using conversation context

## Root Causes

### Primary Issue: EACH Handler Disabled
The **"EACH N" Order Handler** was completely disabled (commented out) at line 1125, with this note:
```
// DISABLED - NOW HANDLED BY extractOrderDetails
```

However, `extractOrderDetails` does NOT handle context-based ordering - it only extracts from the current message. When a customer says "2ctns each" without mentioning product names, there's nothing to extract from the current message.

### Secondary Issue: Stale Conversation Data ⚠️ CRITICAL
The `conversation` variable is fetched **once** at the beginning of message processing (line ~891), **BEFORE** the Smart Router runs. This means:

1. **Message 1**: "give me prices for 8x80, 8x100, 10x160"
   - Conversation fetched (OLD data)
   - Smart Router runs → saves `last_quoted_products` to database ✅
   - Response sent

2. **Message 2**: "2ctns each"
   - Conversation fetched (still has OLD data from BEFORE Message 1's save!)
   - EACH handler checks `conversation.last_quoted_products` → **EMPTY!** ❌
   - Fails to find context

**Timeline Problem**:
```
891:  conversation = fetch()           // Message 2 fetch
990:  smartRouter() → saves to DB      // Message 1's save (not visible to Message 2)
1127: EACH handler checks conversation // Uses stale data!
```

## Solutions Implemented

### 1. Re-enabled "EACH N" Order Handler
**File**: `routes/handlers/customerHandler.js`
**Lines**: 1127-1243

Uncommented and enhanced the handler to:
- ✅ Match "2ctns each" patterns (added new regex pattern)
- ✅ Retrieve `last_quoted_products` from conversation context
- ✅ Apply the quantity to all previously quoted products
- ✅ Process multi-product orders with context

### 2. Added Conversation Refresh ⭐ CRITICAL FIX
**File**: `routes/handlers/customerHandler.js`
**Lines**: 1130-1140

Added fresh database query right before EACH handler:
```javascript
// CRITICAL: Refresh conversation to get latest quoted products
const { data: freshConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('end_user_phone', from)
    .single();

const conversationContext = freshConversation || conversation;
```

This ensures the EACH handler sees the `last_quoted_products` that were saved by the previous price query message.

### 2. Enhanced Pattern Matching
Added new regex pattern to handle "2ctns each" (no space between number and unit):
```javascript
userQuery.match(/(\d{1,6})\s*(?:ctns?|cartons?)\s*(?:each|per)(?!\s+ki\s+prices?)/i)
```

**Supported patterns now**:
- ✅ "each 2 ctns"
- ✅ "2 ctns each"
- ✅ "2ctns each" (NEW)
- ✅ "2 cartons each"
- ✅ "har product 2 ctns" (Hindi)
- ✅ "mujhe each 2 ctns chahiye" (Hindi)

### 3. Added Context Tracking Logs
Added comprehensive logging to debug conversation context:
```javascript
console.log('[CONTEXT_CHECK] Conversation state:', {
    hasConversation: !!conversation,
    conversationId: conversation?.id,
    hasQuotedProducts: !!conversation?.last_quoted_products,
    quotedProductsPreview: ...
});
```

### 4. Context Retrieval Flow
The handler now follows this priority:

1. **Primary**: Check `conversation.last_quoted_products` (JSON array)
   - Saved automatically after price queries by Smart Router
   - Contains full product details: productCode, productName, quantity, unit

2. **Fallback 1**: Check `conversation.last_product_discussed` (string)
   - Comma-separated product codes
   - Parse and convert to order format

3. **Fallback 2**: Extract from current query
   - If customer says "2ctns each 8x80 8x100"
   - Uses regex to find product codes in same message

## How It Works Now

### Example Flow:
```
1. Customer: "give me prices for 8x80, 8x100, 10x160"
   → Smart Router handles price query
   → Saves to conversation.last_quoted_products:
     [
       {productCode: "8x80", productName: "NFF 8x80", ...},
       {productCode: "8x100", productName: "NFF 8x100", ...},
       {productCode: "10x160", productName: "NFF 10x160", ...}
     ]
   → Bot responds with prices

2. Customer: "2ctns each"
   → EACH handler matches pattern: /(\d{1,6})\s*(?:ctns?|cartons?)\s*(?:each|per)/i
   → Extracts quantity: 2
   → Retrieves last_quoted_products from conversation
   → Builds orders array:
     [
       {productCode: "8x80", quantity: 2, unit: "cartons"},
       {productCode: "8x100", quantity: 2, unit: "cartons"},
       {productCode: "10x160", quantity: 2, unit: "cartons"}
     ]
   → Calls processMultipleOrderRequest
   → Bot processes order: "Added 2 cartons of NFF 8x80, 2 cartons of NFF 8x100..."
```

## Code Changes Summary

### Modified Files
1. **routes/handlers/customerHandler.js**
   - Line 1125-1232: Uncommented and enhanced EACH handler
   - Line 1133: Added new regex pattern for "2ctns each"
   - Line 1127-1141: Added context tracking logs

### Key Functions Affected
- `handleCustomerTextMessage()` - Main message handler
- EACH pattern matching logic
- `conversation.last_quoted_products` retrieval
- Order processing pipeline

## Testing Checklist

### Manual Test Cases
- [ ] Price query → "2ctns each" → Should process order
- [ ] Price query → "each 3 cartons" → Should process order  
- [ ] Price query → "5 ctns per" → Should process order
- [ ] Price query → "har ek 2 ctns" (Hindi) → Should process order
- [ ] "2ctns each" without prior context → Should ask for clarification

### Verify Logs Show:
```
[CONTEXT_CHECK] Conversation state: {hasQuotedProducts: true, ...}
[DEBUG_FLOW] Each pattern test result: FOUND
[DEBUG_FLOW] Using last_quoted_products: 3 products
[EACH_ORDER] Built orders from each pattern: 8x80:2, 8x100:2, 10x160:2
```

## Related Files
- `services/smartResponseRouter.js` - Saves `quotedProducts` after price queries
- `services/orderProcessingService.js` - Processes multi-product orders
- `routes/handlers/customer/priorityChecks.js` - Other early handlers

## Future Enhancements
1. Add "same as before" or "repeat last order" patterns
2. Support "add 1 more carton to each" for incremental updates
3. Handle "change 8x100 to 3 ctns" for selective quantity updates
4. Add conversation context timeout (e.g., expire after 30 minutes)

## Notes
- The EACH handler runs at **STEP 1.5** (before order extraction)
- It has higher priority than generic order processing
- Context is preserved across messages in the same conversation
- If no context found, falls back to extracting from current message
