# Pre-Deployment Testing Checklist

## Why This Matters

**Recent Issue:** Deployed code with `context is not defined` error because I didn't verify the method signature matched the caller.

**Lesson:** Always test code logic, parameter passing, and error handling BEFORE deployment.

---

## Mandatory Pre-Deployment Checks

### ✅ 1. Code Syntax & Logic Validation

**Before committing ANY code change:**

```bash
# Check for obvious syntax errors
node --check <file.js>

# For multiple files
find . -name "*.js" -not -path "./node_modules/*" -exec node --check {} \;
```

**Manual Checks:**
- [ ] Function signatures match all callers
- [ ] All parameters are defined and passed correctly
- [ ] Variable names are consistent
- [ ] No typos in variable/function names
- [ ] All required modules are imported
- [ ] Context objects have expected properties

---

### ✅ 2. Parameter Validation

**When adding/modifying function calls:**

```javascript
// ALWAYS CHECK:
// 1. Function signature
function myFunction(param1, param2, context = {}) { ... }

// 2. All callers pass correct parameters
myFunction(value1, value2, { key: 'value' });

// 3. Inside function, params are used correctly
if (context.key) { ... }  // ✅ context exists
if (context.missingKey) { ... }  // ❌ Check if key exists!
```

**Recent Mistake:**
```javascript
// Method signature
quickClassify(message) { ... }  // ❌ Missing context param

// Caller
quickClassify(userQuery, { inOrderDiscussion: true })  // ❌ Passes context

// Inside method
if (context.inOrderDiscussion) { ... }  // ❌ CRASH: context undefined
```

**Should have been:**
```javascript
quickClassify(message, context = {}) { ... }  // ✅ Accepts context
```

---

### ✅ 3. Search for All Usages

**Before changing a function signature:**

```bash
# Find all places where function is called
grep -r "functionName(" --include="*.js"

# Or use VSCode: Right-click → Find All References
```

**Verify:**
- [ ] All callers updated to match new signature
- [ ] All callers pass correct parameters
- [ ] No missing imports/requires

---

### ✅ 4. Check Dependencies

**Before deploying:**

- [ ] All `require()` statements have valid paths
- [ ] All imported functions/variables exist
- [ ] No circular dependencies
- [ ] All async/await properly handled

**Recent Mistakes:**
- `require('../config/supabaseClient')` ❌ Path doesn't exist
- `require('../utils/maytapi')` ❌ Module doesn't exist
- `require('../utils/contextExtractor')` ❌ Module doesn't exist

---

### ✅ 5. State Machine Validation

**For conversation state changes:**

- [ ] All possible states documented
- [ ] State transitions are valid
- [ ] Conditions check for ALL relevant states
- [ ] No missing state in conditionals

**Recent Mistake:**
```javascript
// Only checked 2 states
if (state === 'order_discussion' || state === 'multi_product_order_discussion') {
    // Add product logic
}

// But actual state was 'pricing_inquiry' ❌
```

**Should check:**
```javascript
const validStates = [
    'order_discussion',
    'multi_product_order_discussion', 
    'pricing_inquiry',  // ✅ Added this
    // ... check for more
];
```

---

### ✅ 6. Error Handling

**Every change must have:**

```javascript
try {
    // Your code
} catch (error) {
    console.error('[MODULE_NAME] Error:', error.message);
    console.error('[MODULE_NAME] Stack:', error.stack);
    // Graceful fallback
}
```

- [ ] Try-catch blocks present
- [ ] Errors are logged with context
- [ ] Graceful fallbacks exist
- [ ] User gets helpful error message

---

### ✅ 7. Logging & Debugging

**Add debug logs for:**

```javascript
// Before operation
console.log('[FUNCTION] Input params:', { param1, param2 });
console.log('[FUNCTION] Current state:', state);

// After operation
console.log('[FUNCTION] Result:', result);
console.log('[FUNCTION] Success:', success);
```

- [ ] Key decision points logged
- [ ] Input parameters logged
- [ ] Results/outcomes logged
- [ ] Error paths logged

---

### ✅ 8. Test Scenarios

**Before deploying, mentally test:**

#### Scenario 1: Happy Path
```
User: give me price 8x80 10 ctns
Bot: Shows pricing
User: add 8x100 5 ctns
Expected: Both products in cart ✅
```

#### Scenario 2: Error Path
```
User: add 8x100 5 ctns (without prior conversation)
Expected: Should handle gracefully, not crash ✅
```

#### Scenario 3: Edge Cases
```
User: ad 8x100 5ctns (typo)
Expected: AI handles it ✅

User: aur 8x100 bhi (Hindi)
Expected: AI understands ✅
```

---

## Pre-Deployment Testing Process

### Phase 1: Code Review (Before git commit)

```bash
# 1. Check syntax
node --check routes/handlers/customerHandler.js
node --check services/ai/intentClassifier.js

# 2. Search for function usages
grep -r "quickClassify" --include="*.js"
grep -r "extractOrderDetails" --include="*.js"

# 3. Check imports
grep -r "require.*intentClassifier" --include="*.js"
```

### Phase 2: Logic Validation

**Ask yourself:**
1. ✅ Does function signature match all callers?
2. ✅ Are all parameters defined and passed?
3. ✅ Do all variables exist in scope?
4. ✅ Are all states/conditions covered?
5. ✅ Is error handling present?

### Phase 3: Deployment Readiness

**Checklist:**
- [ ] No syntax errors
- [ ] All imports valid
- [ ] All function signatures match
- [ ] All parameters passed correctly
- [ ] Error handling present
- [ ] Debug logging added
- [ ] Edge cases considered

### Phase 4: Post-Deployment Verification

```bash
# 1. Wait for deployment
gcloud app versions list --service=default --limit=3

# 2. Check for immediate errors
gcloud app logs read --limit=100 | Select-String "ERROR|ReferenceError|TypeError|undefined"

# 3. Monitor startup
gcloud app logs tail -s default

# 4. Test via WhatsApp
# Send test messages and verify responses
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Parameter Mismatch
```javascript
// Function
function doSomething(a, b) { ... }

// Caller passes 3 params
doSomething(x, y, z);  // ❌ z is ignored

// Or caller passes object
doSomething({ a: x, b: y });  // ❌ Expecting 2 separate params
```

### ❌ Mistake 2: Undefined Variables
```javascript
if (context.inOrderDiscussion) { ... }  // ❌ Is context defined?
if (context && context.inOrderDiscussion) { ... }  // ✅ Safe check
```

### ❌ Mistake 3: Wrong Import Paths
```javascript
require('../config/supabaseClient');  // ❌ File doesn't exist
require('../services/config');  // ✅ Correct path
```

### ❌ Mistake 4: Missing States
```javascript
if (state === 'order_discussion') {  // ❌ Only checks 1 state
if (state === 'order_discussion' || state === 'pricing_inquiry') {  // ✅ Checks multiple
```

### ❌ Mistake 5: No Error Handling
```javascript
const result = await apiCall();  // ❌ What if it fails?

try {
    const result = await apiCall();
} catch (error) {
    console.error('Error:', error);
    // Handle gracefully
}  // ✅ Proper error handling
```

---

## Testing Commands Reference

### Check for Errors in Logs
```powershell
# Recent errors
gcloud app logs read --limit=200 | Select-String "ERROR|Error:|undefined|ReferenceError"

# Specific version
gcloud app logs read --limit=200 | Select-String "auto-20251019-135543"

# Context around errors
gcloud app logs read --limit=200 | Select-String "ERROR" -Context 3,3
```

### Find Function Usage
```powershell
# In current directory
grep -r "functionName" --include="*.js"

# With context
grep -r "functionName" --include="*.js" -B 2 -A 2
```

### Check File Exists
```powershell
# Check if file exists
Test-Path "services/ai/intentClassifier.js"

# List directory
ls services/ai/
```

---

## Emergency Rollback

If deployment fails:

```powershell
# List recent versions
gcloud app versions list --service=default --limit=5

# Rollback to previous working version
gcloud app services set-traffic default --splits=auto-20251019-133324=1

# Or specific version
gcloud app services set-traffic default --splits=<WORKING_VERSION>=1
```

---

## Lessons Learned

### Issue 1: Import Path Errors (3 deployments failed)
**Cause:** Used non-existent paths like `../config/supabaseClient`  
**Prevention:** Always check file exists before requiring  
**Fix:** Use correct path `../services/config`

### Issue 2: Missing Context Parameter
**Cause:** Changed function usage without updating signature  
**Prevention:** Search all usages before changing signatures  
**Fix:** Added `context = {}` parameter

### Issue 3: Missing Conversation State
**Cause:** Only checked 2 states, missed 'pricing_inquiry'  
**Prevention:** List ALL possible states, check each one  
**Fix:** Added all relevant states to condition

---

## Future Improvements

1. **Unit Tests** - Write tests for critical functions
2. **Integration Tests** - Test full conversation flows
3. **Staging Environment** - Test before production deploy
4. **Automated Checks** - Pre-commit hooks to catch errors
5. **Type Checking** - Use TypeScript or JSDoc for type safety

---

## Action Items Going Forward

**Before EVERY commit:**

1. ✅ Run syntax check: `node --check <file>`
2. ✅ Search for all function usages
3. ✅ Verify parameter passing
4. ✅ Check all imports exist
5. ✅ Add error handling
6. ✅ Add debug logging
7. ✅ Consider edge cases
8. ✅ Review all code changes line by line

**After EVERY deployment:**

1. ✅ Check version deployed correctly
2. ✅ Monitor logs for 2-3 minutes
3. ✅ Look for any errors
4. ✅ Test basic functionality
5. ✅ Verify no regressions

---

**Remember:** 5 minutes of testing > 30 minutes of debugging production issues!

**Date:** October 19, 2025  
**Created After:** 3 failed deployments + 1 crash bug  
**Purpose:** Never repeat these mistakes again! 🎯
