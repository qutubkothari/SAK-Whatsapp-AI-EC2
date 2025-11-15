# AI Discount - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1. Database Setup
```bash
psql $DATABASE_URL -f migrations/add_discount_negotiations_table.sql
```

### 2. Add API Key
```bash
# In .env file
OPENAI_API_KEY=sk-proj-your-key-here
```

### 3. Deploy
```bash
.\deploy.ps1
```

---

## 📝 Test Commands

### Test AI Functions
```bash
node test_ai_discount.js
```

### Check Syntax
```bash
node -c services/aiDiscountUnderstanding.js
node -c services/discountNegotiationService_v2.js
node -c routes/handlers/customerHandler.js
```

### Monitor Logs
```bash
gcloud app logs read --limit=50 | Select-String "AI_DISCOUNT"
```

---

## 🧪 Quick Test Messages

| Message | Expected Behavior |
|---------|-------------------|
| `give me discount for 8x80 100 ctns` | ✅ Triggers discount with product extraction |
| `8x80 price` | ❌ Shows price (NOT discount) |
| `thoda aur kam karo` | ✅ Offers max discount |
| `2.50 per piece chalega` | ✅ Evaluates counter offer |
| `best price bata do` | ✅ Immediate max discount |

---

## 📊 Key Database Queries

### View Recent Negotiations
```sql
SELECT customer_message, 
       ai_intent_result->>'confidence' as conf,
       offered_discount,
       created_at 
FROM discount_negotiations 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Success Rate Today
```sql
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE accepted = true) as accepted,
    ROUND(AVG((ai_intent_result->>'confidence')::numeric), 2) as avg_conf
FROM discount_negotiations
WHERE created_at >= CURRENT_DATE;
```

---

## 🔍 Log Patterns to Watch

### Success
```
[AI_DISCOUNT] Analysis result: isDiscountRequest: true, confidence: 0.95
[AI_DISCOUNT] Extracted details: products: [{productCode: "8x80", quantity: 100}]
[AI_DISCOUNT] Negotiation context built: totalCartons: 100
[AI_DISCOUNT] Discount negotiation response generated
```

### Not a Discount (Normal)
```
[AI_DISCOUNT] Not a discount request or low confidence: 0.1
```

### Error (Investigate)
```
[AI_DISCOUNT] Error in AI discount detection: <error message>
```

---

## 💰 Cost Reference

| Volume | Monthly Cost |
|--------|-------------|
| 1,000 requests | $0.15 |
| 10,000 requests | $1.50 |
| 100,000 requests | $15.00 |

---

## 🐛 Quick Fixes

### API Key Not Working
```bash
# Check if set
echo $env:OPENAI_API_KEY

# Set it
$env:OPENAI_API_KEY = "sk-proj-your-key"
```

### Low Confidence Scores
- Check if `conversationContext` is passed
- Verify `quotedProducts` array exists
- Review customer message format

### Wrong Products Extracted
- Pass `recentProducts` to extraction
- Validate product codes against DB
- Add examples to prompts

---

## 📂 File Locations

| File | Purpose |
|------|---------|
| `services/aiDiscountUnderstanding.js` | Core AI functions |
| `services/discountNegotiationService_v2.js` | Integration wrapper |
| `routes/handlers/customerHandler.js` | Main integration (line 2750) |
| `migrations/add_discount_negotiations_table.sql` | Database setup |
| `test_ai_discount.js` | Test suite |

---

## 📞 Support

- **Issues:** Tag with `[AI-DISCOUNT]`
- **Docs:** `AI_DISCOUNT_MIGRATION_GUIDE.md`
- **Implementation:** `AI_DISCOUNT_IMPLEMENTATION_SUMMARY.md`
- **Owner:** @qutubkothari

---

## ✅ Pre-Deployment Checklist

- [ ] Migration ran
- [ ] API key set
- [ ] Tests passed (8/8)
- [ ] Syntax clean
- [ ] Deployed
- [ ] Logs checked

---

**Version:** 1.0  
**Last Updated:** October 21, 2025  
**Status:** Ready for Production
