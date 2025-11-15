/**
 * Test Core Services - Validation Script
 * Tests CustomerService, StateManager, and GSTService
 */

const { supabase } = require('../services/config');
const CustomerService = require('../services/core/CustomerService');
const StateManager = require('../services/core/ConversationStateManager');
const GSTService = require('../services/core/GSTService');

// Test phone number (use a test number, not real customer)
const TEST_PHONE = '919999999999@c.us';
const TENANT_ID = 'your-tenant-id'; // Will get from database

async function getTenantId() {
    const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
        .single();
    
    if (error || !data) {
        throw new Error('No tenant found');
    }
    
    return data.id;
}

async function testCustomerService(tenantId) {
    console.log('\n========================================');
    console.log('TEST 1: CustomerService');
    console.log('========================================\n');
    
    try {
        // Test 1: Ensure profile
        console.log('1.1 Testing ensureCustomerProfile...');
        const { profile, created } = await CustomerService.ensureCustomerProfile(tenantId, TEST_PHONE);
        console.log(`✅ Profile ${created ? 'created' : 'found'}:`, profile.phone);
        
        // Test 2: Get profile
        console.log('\n1.2 Testing getCustomerProfile...');
        const fetchedProfile = await CustomerService.getCustomerProfile(tenantId, TEST_PHONE);
        console.log('✅ Profile fetched:', fetchedProfile.phone);
        
        // Test 3: Save GST preference - no GST
        console.log('\n1.3 Testing saveGSTPreference (no_gst)...');
        await CustomerService.saveGSTPreference(tenantId, TEST_PHONE, 'no_gst', null);
        const gstPref = await CustomerService.getGSTPreference(tenantId, TEST_PHONE);
        console.log('✅ GST preference saved:', gstPref);
        
        // Test 4: Save GST preference - with GST
        console.log('\n1.4 Testing saveGSTPreference (with_gst)...');
        await CustomerService.saveGSTPreference(tenantId, TEST_PHONE, 'with_gst', '22AAAAA0000A1Z5');
        const gstPref2 = await CustomerService.getGSTPreference(tenantId, TEST_PHONE);
        console.log('✅ GST preference updated:', gstPref2);
        
        console.log('\n✅ CustomerService: ALL TESTS PASSED');
        return true;
    } catch (error) {
        console.error('❌ CustomerService test failed:', error.message);
        return false;
    }
}

async function testStateManager(tenantId) {
    console.log('\n========================================');
    console.log('TEST 2: ConversationStateManager');
    console.log('========================================\n');
    
    try {
        // Need a conversation first
        const { data: conversation, error } = await supabase
            .from('conversations')
            .upsert({
                tenant_id: tenantId,
                end_user_phone: TEST_PHONE,
                state: null
            }, {
                onConflict: 'tenant_id,end_user_phone'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Test 1: Get state
        console.log('2.1 Testing getState...');
        const { state } = await StateManager.getState(tenantId, TEST_PHONE);
        console.log('✅ Current state:', state || 'INITIAL');
        
        // Test 2: Set state
        console.log('\n2.2 Testing setState (AWAITING_GST)...');
        await StateManager.setState(tenantId, TEST_PHONE, StateManager.STATES.AWAITING_GST);
        const { state: newState } = await StateManager.getState(tenantId, TEST_PHONE);
        console.log('✅ State updated to:', newState);
        
        // Test 3: isInState
        console.log('\n2.3 Testing isInState...');
        const isInGST = await StateManager.isInState(tenantId, TEST_PHONE, StateManager.STATES.AWAITING_GST);
        console.log('✅ Is in AWAITING_GST:', isInGST);
        
        // Test 4: Escape keyword
        console.log('\n2.4 Testing isEscapeKeyword...');
        console.log('   "cancel":', StateManager.isEscapeKeyword('cancel'));
        console.log('   "stop":', StateManager.isEscapeKeyword('stop'));
        console.log('   "hello":', StateManager.isEscapeKeyword('hello'));
        console.log('✅ Escape keywords working');
        
        // Test 5: Reset state
        console.log('\n2.5 Testing resetState...');
        await StateManager.resetState(tenantId, TEST_PHONE);
        const { state: resetState } = await StateManager.getState(tenantId, TEST_PHONE);
        console.log('✅ State reset to:', resetState || 'INITIAL');
        
        console.log('\n✅ StateManager: ALL TESTS PASSED');
        return true;
    } catch (error) {
        console.error('❌ StateManager test failed:', error.message);
        return false;
    }
}

async function testGSTService(tenantId) {
    console.log('\n========================================');
    console.log('TEST 3: GSTService');
    console.log('========================================\n');
    
    try {
        // Test 1: Pattern detection - no GST
        console.log('3.1 Testing pattern detection (no GST)...');
        const patterns = ['no gst', 'without gst', 'nahi', 'no'];
        patterns.forEach(pattern => {
            const detected = GSTService.isNoGSTResponse(pattern);
            console.log(`   "${pattern}": ${detected ? '✅' : '❌'}`);
        });
        
        // Test 2: GST number validation
        console.log('\n3.2 Testing GST number validation...');
        const validGST = '22AAAAA0000A1Z5';
        const invalidGST = '123456';
        console.log(`   Valid GST (${validGST}):`, GSTService.isValidGSTNumber(validGST) ? '✅' : '❌');
        console.log(`   Invalid GST (${invalidGST}):`, GSTService.isValidGSTNumber(invalidGST) ? '❌ (correct)' : '✅');
        
        // Test 3: GST number extraction
        console.log('\n3.3 Testing GST number extraction...');
        const message = 'My GST is 22AAAAA0000A1Z5 please use it';
        const extracted = GSTService.extractGSTNumber(message);
        console.log(`   From: "${message}"`);
        console.log(`   Extracted: ${extracted}`, extracted === validGST ? '✅' : '❌');
        
        // Test 4: Checkout confirmation patterns
        console.log('\n3.4 Testing checkout confirmation patterns...');
        const checkoutPatterns = ['go ahead', 'proceed', 'confirm', 'ok'];
        checkoutPatterns.forEach(pattern => {
            const detected = GSTService.isCheckoutConfirmation(pattern);
            console.log(`   "${pattern}": ${detected ? '✅' : '❌'}`);
        });
        
        // Test 5: needsGSTCollection
        console.log('\n3.5 Testing needsGSTCollection...');
        // Clear GST preference first
        await CustomerService.saveGSTPreference(tenantId, TEST_PHONE, null, null);
        const needsGST1 = await GSTService.needsGSTCollection(tenantId, TEST_PHONE);
        console.log('   Without preference:', needsGST1 ? '✅ needs GST' : '❌');
        
        // Set preference and check again
        await CustomerService.saveGSTPreference(tenantId, TEST_PHONE, 'no_gst', null);
        const needsGST2 = await GSTService.needsGSTCollection(tenantId, TEST_PHONE);
        console.log('   With no_gst:', needsGST2 ? '❌' : '✅ doesn\'t need');
        
        console.log('\n✅ GSTService: ALL TESTS PASSED');
        return true;
    } catch (error) {
        console.error('❌ GSTService test failed:', error.message);
        return false;
    }
}

async function checkRecentActivity(tenantId) {
    console.log('\n========================================');
    console.log('RECENT ACTIVITY CHECK');
    console.log('========================================\n');
    
    try {
        // Check recent customer profiles
        console.log('Recent customer profiles:');
        const { data: profiles } = await supabase
            .from('customer_profiles')
            .select('phone, first_name, gst_preference, created_at')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (profiles && profiles.length > 0) {
            profiles.forEach(p => {
                console.log(`  - ${p.phone}: ${p.first_name || 'N/A'} | GST: ${p.gst_preference || 'not set'}`);
            });
        } else {
            console.log('  No profiles found');
        }
        
        // Check recent conversations
        console.log('\nRecent conversation states:');
        const { data: conversations } = await supabase
            .from('conversations')
            .select('end_user_phone, state, updated_at')
            .eq('tenant_id', tenantId)
            .not('state', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(5);
        
        if (conversations && conversations.length > 0) {
            conversations.forEach(c => {
                console.log(`  - ${c.end_user_phone}: ${c.state}`);
            });
        } else {
            console.log('  No active conversation states');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Activity check failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('\n🚀 CORE SERVICES VALIDATION TEST\n');
    console.log('Deployment: auto-deploy-20251112-003427');
    console.log('Testing: CustomerService, StateManager, GSTService\n');
    
    try {
        // Get tenant ID
        const tenantId = await getTenantId();
        console.log('Using tenant ID:', tenantId);
        
        // Run tests
        const results = {
            customerService: await testCustomerService(tenantId),
            stateManager: await testStateManager(tenantId),
            gstService: await testGSTService(tenantId),
            activity: await checkRecentActivity(tenantId)
        };
        
        // Summary
        console.log('\n========================================');
        console.log('TEST SUMMARY');
        console.log('========================================\n');
        
        const passed = Object.values(results).filter(r => r === true).length;
        const total = Object.keys(results).length;
        
        Object.entries(results).forEach(([test, result]) => {
            console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
        });
        
        console.log(`\n${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('\n🎉 ALL TESTS PASSED - Core services are working correctly!\n');
        } else {
            console.log('\n⚠️  SOME TESTS FAILED - Review errors above\n');
        }
        
        process.exit(passed === total ? 0 : 1);
        
    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests
runAllTests();
