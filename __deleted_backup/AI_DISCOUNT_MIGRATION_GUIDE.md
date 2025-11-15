# AI-Powered Discount Understanding - Migration Guide

**Date:** October 21, 2025  
**Upgrade:** Regex → AI Understanding  
**Impact:** Major improvement in discount negotiation accuracy and naturalness

---

## 🎯 What Changed

### Before (Regex-Based)
```javascript
// Old approach - rigid pattern matching
function isDiscountNegotiation(message) {
    const patterns = [
        /give\s*(?:me|us)?\s*(?:some|a)?\s*discount/i,
        /can\s*(?:you|i)\s*get\s*(?:a|some)?\s*discount/i,
        // ... 20+ hardcoded patterns
    ];
    return patterns.some(pattern => pattern.test(message));
}
```

**Problems:**
- ❌ Can't understand context
- ❌ Misses variations ("thoda kam kar do")
- ❌ False positives on price inquiries
- ❌ No confidence scoring
- ❌ Can't distinguish discount types
- ❌ Robotic hardcoded responses

### After (AI-Powered)
```javascript
// New approach - intelligent understanding
const result = await detectDiscountIntent(message, context);
// Returns:
// {
//   isDiscountRequest: true,
//   confidence: 0.95,
//   discountType: "initial_request",
//   extractedInfo: { productCode: "8x80", quantity: 100 }
// }
```

**Benefits:**
- ✅ Understands context and intent
- ✅ Handles Hindi/Hinglish naturally
- ✅ Confidence scoring (0-1)
- ✅ Distinguishes discount types
- ✅ Extracts products/quantities
- ✅ Natural AI-generated responses
- ✅ Learns from conversation history

---

## 📦 New Files

### 1. `services/aiDiscountUnderstanding.js` (NEW)
**Purpose:** Core AI functions for discount understanding

**Functions:**
- `detectDiscountIntent(message, context)` - Detects if message is asking for discount
- `extractDiscountRequestDetails(message, recentProducts)` - Extracts product codes, quantities, prices
- `generateDiscountResponse(context)` - Generates natural, contextual responses

**Dependencies:**
- OpenAI API (gpt-4o-mini)
- Environment variable: `OPENAI_API_KEY`

### 2. `services/discountNegotiationService_v2.js` (NEW)
**Purpose:** Upgraded discount negotiation handler using AI

**Main Function:**
```javascript
handleDiscountNegotiationV2(tenantId, phoneNumber, message, conversationContext)
```

**Returns:**
```javascript
{
    response: "Natural AI-generated response",
    discountOffered: 5.5,
    maxDiscount: 6.0,
    shouldEscalate: false,
    intentType: "initial_request",
    confidence: 0.95,
    nextAction: "await_confirmation"
}
```

### 3. `migrations/add_discount_negotiations_table.sql` (NEW)
**Purpose:** Database table to track AI negotiations

**Schema:**
```sql
discount_negotiations (
    id, tenant_id, customer_phone, cart_id,
    customer_message,
    ai_intent_result JSONB,
    ai_extracted_details JSONB,
    offered_discount, max_discount,
    discount_type, ai_response_tone,
    should_escalate, accepted, final_discount,
    created_at, resolved_at
)
```

---

## 🚀 Migration Steps

### Step 1: Run Database Migration
```bash
# Connect to Supabase and run migration
psql $DATABASE_URL -f migrations/add_discount_negotiations_table.sql
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'discount_negotiations';
```

### Step 2: Ensure OpenAI API Key
```bash
# Add to .env file
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Verify:**
```bash
echo $OPENAI_API_KEY  # Should show your key
```

### Step 3: Install OpenAI Package (if needed)
```bash
npm install openai@^3.3.0
```

**Verify:**
```bash
npm list openai
```

### Step 4: Test AI Functions Locally
```bash
node -e "
const { detectDiscountIntent } = require('./services/aiDiscountUnderstanding');
(async () => {
    const result = await detectDiscountIntent('give me discount for 8x80 100 ctns');
    console.log(result);
})();
"
```

**Expected Output:**
```json
{
  "isDiscountRequest": true,
  "confidence": 0.95,
  "discountType": "initial_request",
  "extractedInfo": {
    "productCode": "8x80",
    "quantity": 100
  }
}
```

### Step 5: Update customerHandler.js to Use V2

**Find this code (around line 800-850):**
```javascript
const { isDiscountNegotiation, handleDiscountNegotiation } = require('../services/discountNegotiationService');

// Later in code:
if (isDiscountNegotiation(msg)) {
    const result = await handleDiscountNegotiation(tenant.id, from, msg, conversationContext);
    // ...
}
```

**Replace with:**
```javascript
const { 
    isDiscountNegotiationV2, 
    handleDiscountNegotiationV2 
} = require('../services/discountNegotiationService_v2');

// Later in code:
if (await isDiscountNegotiationV2(msg, conversationContext)) {
    const result = await handleDiscountNegotiationV2(tenant.id, from, msg, conversationContext);
    // ...
}
```

**Note:** This is backward compatible - old code still works!

### Step 6: Deploy to Production
```bash
.\deploy.ps1
```

**Monitor logs:**
```bash
gcloud app logs read --limit=50 | Select-String "AI_DISCOUNT"
```

---

## 🧪 Testing Guide

### Test 1: Basic Discount Request with Product
**Message:** `give me discount for 8x80 100 ctns`

**Expected AI Analysis:**
```json
{
  "isDiscountRequest": true,
  "confidence": 0.95,
  "discountType": "initial_request",
  "extractedInfo": {
    "productCode": "8x80",
    "quantity": 100,
    "requestedDiscount": null,
    "requestedPrice": null
  }
}
```

**Expected Response:** Natural message offering discount with price breakdown

### Test 2: Hindi/Hinglish
**Message:** `thoda aur kam karo yaar`

**Expected AI Analysis:**
```json
{
  "isDiscountRequest": true,
  "confidence": 0.90,
  "discountType": "asking_for_more"
}
```

**Expected Response:** AI matches Hindi tone in response

### Test 3: Price Inquiry (Should NOT Trigger)
**Message:** `8x80 price kitna hai`

**Expected AI Analysis:**
```json
{
  "isDiscountRequest": false,
  "confidence": 0.10,
  "discountType": "none"
}
```

**Expected Response:** Price display, NOT discount negotiation

### Test 4: Counter Offer
**Message:** `2.50 per piece chalega`

**Expected AI Analysis:**
```json
{
  "isDiscountRequest": true,
  "confidence": 0.92,
  "discountType": "counter_offer",
  "extractedInfo": {
    "requestedPrice": "2.50"
  }
}
```

**Expected Response:** AI evaluates if 2.50 is within range, accepts or counters

### Test 5: Best Price Request
**Message:** `best price bata do`

**Expected AI Analysis:**
```json
{
  "isDiscountRequest": true,
  "confidence": 0.95,
  "discountType": "best_price"
}
```

**Expected Response:** Immediately offers max discount for quantity

---

## 📊 Monitoring & Analytics

### View AI Negotiation Logs
```sql
SELECT 
    customer_message,
    ai_intent_result->>'discountType' as type,
    ai_intent_result->>'confidence' as confidence,
    offered_discount,
    accepted,
    created_at
FROM discount_negotiations
WHERE tenant_id = 'YOUR_TENANT_ID'
ORDER BY created_at DESC
LIMIT 20;
```

### Daily Analytics
```sql
SELECT * FROM discount_negotiation_analytics
WHERE tenant_id = 'YOUR_TENANT_ID'
AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### Escalation Tracking
```sql
SELECT 
    customer_phone,
    customer_message,
    offered_discount,
    max_discount,
    ai_extracted_details->>'discountRequest'->'value' as requested,
    created_at
FROM discount_negotiations
WHERE should_escalate = true
AND resolved_at IS NULL
ORDER BY created_at DESC;
```

---

## 🔄 Gradual Migration Strategy

### Phase 1: Run Both Systems (A/B Test)
```javascript
// In customerHandler.js
const useAI = Math.random() > 0.5; // 50% traffic to AI

if (useAI) {
    const result = await handleDiscountNegotiationV2(...);
} else {
    const result = await handleDiscountNegotiation(...); // Old version
}
```

### Phase 2: Monitor for 1 Week
- Check `discount_negotiations` table for issues
- Compare AI vs regex success rates
- Review escalations

### Phase 3: Increase AI Traffic
```javascript
const useAI = Math.random() > 0.8; // 80% to AI
```

### Phase 4: Full Cutover
```javascript
// Remove old code entirely
const result = await handleDiscountNegotiationV2(...);
```

---

## 🎯 Success Metrics

### Week 1 Targets
- [ ] AI confidence > 0.8 for 90%+ of discount requests
- [ ] Escalation rate < 5%
- [ ] False positive rate < 2% (price inquiries triggering discount)
- [ ] Customer satisfaction (measure via "yes"/"ok" responses)

### Week 4 Targets
- [ ] Natural language coverage: Hindi/Hinglish 95%+
- [ ] Zero false positives on price inquiries
- [ ] AI-generated responses rated as "natural" by team
- [ ] Discount acceptance rate > current baseline

---

## 🐛 Troubleshooting

### Issue: OpenAI API Errors
**Symptoms:** Logs show `[AI_DISCOUNT] Error: Request failed`

**Solutions:**
1. Check API key: `echo $OPENAI_API_KEY`
2. Check API quota: https://platform.openai.com/usage
3. Verify network connectivity
4. Review rate limits

**Fallback:** System automatically falls back to basic keyword detection

### Issue: Low Confidence Scores
**Symptoms:** AI returns confidence < 0.6 frequently

**Solutions:**
1. Check if `conversationContext` is being passed correctly
2. Verify `quotedProducts` array has recent products
3. Review customer messages - may need prompt tuning
4. Check if messages are in unsupported language

### Issue: AI Response Too Slow
**Symptoms:** Customers wait > 5 seconds for response

**Solutions:**
1. Switch to `gpt-4o-mini` (faster, cheaper)
2. Reduce `max_tokens` to 200
3. Add timeout and fallback response
4. Consider caching common patterns

### Issue: Wrong Products Extracted
**Symptoms:** AI extracts wrong product codes

**Solutions:**
1. Pass `recentProducts` to `extractDiscountRequestDetails()`
2. Add product code format to prompt examples
3. Validate extracted codes against product database
4. Log false extractions for prompt improvement

---

## 💰 Cost Estimation

### OpenAI API Costs (gpt-4o-mini)
- **Input:** $0.150 per 1M tokens
- **Output:** $0.600 per 1M tokens

**Per Discount Request:**
- Input: ~400 tokens = $0.00006
- Output: ~150 tokens = $0.00009
- **Total: ~$0.00015 per request**

**Monthly Cost Projection:**
- 1,000 discount requests/month = $0.15
- 10,000 discount requests/month = $1.50
- 100,000 discount requests/month = $15.00

**ROI:** If AI improves discount conversion by even 1%, it pays for itself 100x over!

---

## 🔐 Security & Privacy

### Data Sent to OpenAI
- ✅ Customer messages (required for understanding)
- ✅ Product codes and quantities (non-sensitive)
- ❌ Customer phone numbers (NOT sent)
- ❌ Personal information (NOT sent)
- ❌ Payment details (NOT sent)

### Data Retention
- OpenAI: 30 days (API default)
- Our database: Permanent (for analytics)
- Can be anonymized: Hash customer_phone in `discount_negotiations` table

---

## 📚 Next Steps

1. ✅ Review this migration guide
2. ⏳ Run database migration
3. ⏳ Test AI functions locally
4. ⏳ Deploy to staging/production
5. ⏳ Monitor for 1 week
6. ⏳ Gradually increase AI traffic
7. ⏳ Deprecate old regex code

---

## 🆘 Support

**Issues:** Create GitHub issue with `[AI-DISCOUNT]` tag  
**Questions:** Tag @qutubkothari  
**Documentation:** See `services/aiDiscountUnderstanding.js` inline comments

---

**Migration Owner:** GitHub Copilot  
**Review Required:** Technical Lead  
**Status:** Ready for Implementation
