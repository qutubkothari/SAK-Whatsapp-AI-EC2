# WhatsApp AI Sales Assistant - System Audit & Refactor Plan
**Date**: November 11, 2025  
**Status**: Critical Issues Identified - Deep Refactor Required

## Executive Summary

The current system has **fragmented architecture** with inconsistent patterns causing production bugs. This document outlines critical issues and the refactoring roadmap.

---

## Critical Issues Identified

### 1. **Phone Number Inconsistency** 🔴 CRITICAL
**Problem**: Phone numbers stored in different formats across tables
- `conversations.end_user_phone`: `"919106886259@c.us"` (with @c.us)
- `customer_profiles.phone`: `"919106886259@c.us"` (with @c.us) ✅ FIXED
- Code sometimes uses normalized format: `"919106886259"` (without @c.us)

**Impact**: 
- Profile lookups fail
- GST preferences can't be saved
- Customer data fragmentation

**Root Cause**: No centralized phone normalization/formatting

**Fix Required**: 
- ✅ Updated `customerProfileService.js` to use `toWhatsAppFormat()`
- ❌ Need to audit ALL phone-related queries in codebase
- ❌ Create TypeScript-style validation

---

### 2. **Column Name Confusion** 🔴 CRITICAL
**Problem**: Inconsistent column names used across codebase
- `conversations` table has: `end_user_phone`
- Code was checking: `customer_phone` (doesn't exist!)

**Examples Found**:
```javascript
// WRONG - routes/webhook.js line 586
.eq('customer_phone', message.from)

// CORRECT - should be
.eq('end_user_phone', message.from)
```

**Impact**: 
- GST state detection completely broken
- Conversation state checks failing silently

**Fix Required**:
- ✅ Fixed in `routes/webhook.js` lines 586 & 599
- ❌ Need to grep entire codebase for `customer_phone` usage
- ❌ Add database abstraction layer to prevent this

---

### 3. **Customer Profile Creation** 🟡 MEDIUM
**Problem**: Profile only created during cart operations, not on first message

**Timeline of Fixes**:
1. Originally: Profile created only in `cartService.js` during add-to-cart
2. Today's Fix: Added `syncCustomerProfile()` call in `routes/webhook.js` line 473
3. Issue: Should be in a middleware, not buried in webhook handler

**Impact**:
- New customers can't save GST preferences
- Customer data missing for analytics

**Fix Required**:
- ✅ Added to webhook.js message handler
- ❌ Should create dedicated middleware
- ❌ Need guaranteed profile creation with proper error handling

---

### 4. **State Machine Chaos** 🔴 CRITICAL
**Problem**: Conversation states checked ad-hoc in multiple places

**Current States Found**:
- `awaiting_gst_details` - waiting for GST input
- `awaiting_address_update` - waiting for address
- `awaiting_shipping_info` - waiting for shipping details
- `multi_product_order_discussion` - general ordering
- NULL / undefined - initial state

**Issues**:
- No validation of state transitions
- States checked in 3+ different files
- No clear "escape" mechanisms
- AI routing bypasses state handlers

**Example of Broken Flow**:
```
User adds to cart → State: awaiting_gst_details
User says "No gst" → AI classifies as "follow_up" → GST not saved
User says "Go ahead" → Still in awaiting_gst_details → Checkout fails
```

**Fix Required**:
- ❌ Create `ConversationStateManager` service
- ❌ Define clear state transitions with validation
- ❌ Add state-specific handlers
- ❌ Implement escape patterns

---

### 5. **AI Intent Recognition Weakness** 🟡 MEDIUM
**Problem**: AI fails to understand simple, critical phrases

**Examples**:
- "No gst" → Classified as "follow_up" ❌ Should be "gst_preference_no"
- "Go ahead" (after cart shown) → Classified as "follow_up" ❌ Should be "checkout_confirmation"
- "Confirm" (during checkout) → Sometimes works, sometimes doesn't

**Root Cause**:
- Relies too heavily on AI without pattern fallbacks
- No context-aware classification
- Missing training data for critical intents

**Fix Required**:
- ❌ Add explicit pattern matching BEFORE AI
- ❌ Context-aware intent classification (check conversation state first)
- ❌ Expand training data for edge cases

---

### 6. **GST Flow Fragmentation** 🔴 CRITICAL
**Problem**: GST logic spread across 4 files

**Current Architecture**:
```
cartService.js → Requests GST (line 927)
gstValidationService.js → Validates & saves GST
routes/webhook.js → Checks for GST state (line 593)
handlers/customerHandler.js → May also handle GST?
```

**Issues**:
- No single source of truth
- Easy to miss GST checks
- Duplicate logic
- Hard to debug

**Fix Required**:
- ❌ Create unified `GSTService`
- ❌ Single entry point for all GST operations
- ❌ Clear methods: `requestGST()`, `saveGST()`, `validateGST()`

---

### 7. **Deployment Script Issues** 🟢 FIXED
**Problem**: Deploying to wrong project (sak-expense-tracker)

**Root Cause**: 
- Default gcloud project was sak-expense-tracker
- Pre-commit hook didn't specify project
- deploy.ps1 wasn't verifying project switch

**Fix Applied**: ✅
- Removed pre-commit hook
- Updated deploy.ps1 to check & switch project
- Added verification before deployment

---

## Database Schema Issues

### Phone Columns Across Tables

**conversations**:
- `end_user_phone` TEXT (with @c.us) ✅

**customer_profiles**:
- `phone` TEXT (with @c.us) ✅ FIXED TODAY
- `gst_preference` VARCHAR(20) - 'with_gst' | 'no_gst' | NULL

**carts**:
- `conversation_id` UUID (references conversations)
- NO direct phone column ✅

**orders**:
- Needs audit

**cart_items**:
- Needs audit

### Normalization Issues
- ❌ No foreign key constraints between conversations ↔ customer_profiles
- ❌ customer_profiles.phone should have unique constraint per tenant
- ❌ No indexes on phone columns (performance issue)

---

## Refactoring Roadmap

### Phase 1: Stabilization (Priority: CRITICAL)
**Goal**: Fix immediate production bugs

**Tasks**:
1. ✅ Fix phone format in customer_profiles
2. ✅ Fix column name bugs (customer_phone → end_user_phone)
3. ✅ Add customer profile sync on every message
4. ✅ Fix deployment script
5. ❌ Grep entire codebase for `customer_phone` usage
6. ❌ Add comprehensive error logging
7. ❌ Create health check endpoint

**Timeline**: TODAY

---

### Phase 2: Core Services Refactor (Priority: HIGH)
**Goal**: Create robust, testable services

**Tasks**:
1. ❌ Create `services/core/CustomerService.js`
   - Centralize all customer profile operations
   - Add validation layer
   - Ensure atomic operations
   
2. ❌ Create `services/core/ConversationStateManager.js`
   - Define state machine with transitions
   - Validate state changes
   - Add state-specific handlers
   
3. ❌ Create `services/core/GSTService.js`
   - Consolidate all GST logic
   - Clear API: request, save, validate
   - Integrate with state manager

4. ❌ Create `utils/phoneUtils.v2.js`
   - Enforce single format everywhere
   - Add validation
   - Add TypeScript-style JSDoc

5. ❌ Create `middleware/customerProfileMiddleware.js`
   - Guarantee profile exists before processing
   - Load customer context into req
   - Handle errors gracefully

**Timeline**: 2 days

---

### Phase 3: AI & Intent Recognition (Priority: MEDIUM)
**Goal**: Make AI smarter with better fallbacks

**Tasks**:
1. ❌ Enhance `services/ai/intentClassifier.js`
   - Add pattern matching layer BEFORE AI
   - Context-aware classification (check state first)
   - Add confidence thresholds
   
2. ❌ Create intent training data
   - Collect real customer messages
   - Label intents manually
   - Expand training set

3. ❌ Add intent-specific handlers
   - `handlers/intents/gstResponseHandler.js`
   - `handlers/intents/checkoutConfirmationHandler.js`
   - `handlers/intents/cartOperationHandler.js`

**Timeline**: 1 day

---

### Phase 4: Testing & Quality (Priority: HIGH)
**Goal**: Prevent regressions, ensure reliability

**Tasks**:
1. ❌ Add unit tests for core services
   - CustomerService
   - ConversationStateManager
   - GSTService
   
2. ❌ Add integration tests
   - End-to-end flow: Add to cart → GST → Checkout
   - Edge cases: Invalid GST, cart timeout, etc.
   
3. ❌ Add logging & monitoring
   - Structured logs with correlation IDs
   - Error alerting
   - Performance monitoring

**Timeline**: 1 day

---

### Phase 5: TypeScript Migration (Priority: LOW)
**Goal**: Type safety to prevent bugs

**Tasks**:
1. ❌ Add TypeScript to project
2. ❌ Migrate core services first
3. ❌ Add strict type checking
4. ❌ Generate type definitions for database

**Timeline**: 2 days (future work)

---

## Immediate Action Plan (Next 4 Hours)

### Task 1: Code Audit - Find All Bugs (60 min)
- [ ] Grep for `customer_phone` across codebase
- [ ] Grep for phone number handling (with/without @c.us)
- [ ] Find all state checks
- [ ] Find all customer profile queries
- [ ] Document findings

### Task 2: Create Core Services (90 min)
- [ ] Backup current files
- [ ] Create `services/core/CustomerService.js`
- [ ] Create `services/core/ConversationStateManager.js`
- [ ] Create `services/core/GSTService.js`

### Task 3: Refactor Critical Paths (60 min)
- [ ] Replace ad-hoc customer profile calls with CustomerService
- [ ] Replace state checks with StateManager
- [ ] Replace GST logic with GSTService

### Task 4: Test & Deploy (30 min)
- [ ] Manual test: New customer → Add to cart → GST → Checkout
- [ ] Check logs for errors
- [ ] Deploy to production
- [ ] Monitor for issues

---

## Success Metrics

**Before Refactor**:
- 🔴 GST preference save: BROKEN
- 🔴 Customer profile creation: INCONSISTENT
- 🔴 Cart confirmation: UNRELIABLE
- 🟡 AI understanding: ~60% accuracy

**After Phase 2 Target**:
- 🟢 GST preference save: 100% success
- 🟢 Customer profile creation: Guaranteed on first message
- 🟢 Cart confirmation: 100% reliable
- 🟢 AI understanding: 90%+ accuracy with fallbacks

---

## Notes for SaaS Production

**Current State**: ALPHA - Not production-ready
**Target State**: BETA - Production-ready with known limitations

**Required for Production**:
1. ✅ Stable deployment pipeline
2. ❌ Comprehensive error handling
3. ❌ Monitoring & alerting
4. ❌ Automated testing
5. ❌ Documentation
6. ❌ Rollback mechanism
7. ❌ Rate limiting
8. ❌ Security audit

**Recommended**:
- CI/CD pipeline (GitHub Actions)
- Staging environment
- Load testing
- Customer feedback loop

---

## Conclusion

The current system has a **fragile foundation** due to:
1. Inconsistent data patterns
2. Fragmented business logic
3. Weak error handling
4. Over-reliance on AI without fallbacks

**The refactor will**:
- ✅ Centralize all critical operations
- ✅ Add proper validation & error handling
- ✅ Make system predictable & testable
- ✅ Enable confident scaling for SaaS

**Estimated Total Time**: 4-5 days for production-ready system
**Immediate Focus**: Phase 1 & 2 (stabilization + core services)

---

*Document will be updated as refactoring progresses*
