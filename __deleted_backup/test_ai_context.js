/**
 * Test script for AI Context Analysis Service
 * Run this after deployment to verify the AI is working correctly
 */

const { analyzeConversationContext } = require('./services/aiConversationContextService');

// Test Case 1: "i need 100 cartons" after discount offer should be QUANTITY_UPDATE
async function testQuantityUpdate() {
    console.log('\n=== Test 1: Quantity Update Detection ===');
    
    const conversationHistory = [
        { sender: 'customer', content: 'best price?', created_at: new Date() },
        { sender: 'bot', content: "Okay, 1 cartons - I'll give you 0% off. Ready?", created_at: new Date() }
    ];
    
    const conversationState = {
        state: 'discount_offered',
        context_data: {
            quoted_products: [{ product_code: '8x80', quantity: 1 }]
        }
    };
    
    const analysis = await analyzeConversationContext(
        'i need 100 cartons',
        conversationHistory,
        conversationState
    );
    
    console.log('Result:', analysis);
    console.log('Expected: QUANTITY_UPDATE');
    console.log('Got:', analysis.intent);
    console.log('✅ PASS' ? analysis.intent === 'QUANTITY_UPDATE' : '❌ FAIL');
    
    return analysis.intent === 'QUANTITY_UPDATE';
}

// Test Case 2: "yes go ahead" after discount offer should be ORDER_CONFIRMATION
async function testOrderConfirmation() {
    console.log('\n=== Test 2: Order Confirmation Detection ===');
    
    const conversationHistory = [
        { sender: 'customer', content: 'price 8x80', created_at: new Date() },
        { sender: 'bot', content: "3% discount: ₹1.62/pc for 10 cartons. Okay?", created_at: new Date() }
    ];
    
    const conversationState = {
        state: 'discount_offered',
        context_data: {
            quoted_products: [{ product_code: '8x80', quantity: 10, discount_percent: 3 }]
        }
    };
    
    const analysis = await analyzeConversationContext(
        'yes go ahead',
        conversationHistory,
        conversationState
    );
    
    console.log('Result:', analysis);
    console.log('Expected: ORDER_CONFIRMATION');
    console.log('Got:', analysis.intent);
    console.log(analysis.intent === 'ORDER_CONFIRMATION' ? '✅ PASS' : '❌ FAIL');
    
    return analysis.intent === 'ORDER_CONFIRMATION';
}

// Test Case 3: "best price?" should be DISCOUNT_REQUEST
async function testDiscountRequest() {
    console.log('\n=== Test 3: Discount Request Detection ===');
    
    const conversationHistory = [
        { sender: 'customer', content: 'price 8x80 10 cartons', created_at: new Date() },
        { sender: 'bot', content: "Base price: ₹1.67/pc for 10 cartons", created_at: new Date() }
    ];
    
    const conversationState = {
        state: 'pricing_inquiry',
        context_data: {
            quoted_products: [{ product_code: '8x80', quantity: 10 }]
        }
    };
    
    const analysis = await analyzeConversationContext(
        'best price?',
        conversationHistory,
        conversationState
    );
    
    console.log('Result:', analysis);
    console.log('Expected: DISCOUNT_REQUEST');
    console.log('Got:', analysis.intent);
    console.log(analysis.intent === 'DISCOUNT_REQUEST' ? '✅ PASS' : '❌ FAIL');
    
    return analysis.intent === 'DISCOUNT_REQUEST';
}

// Run all tests
async function runTests() {
    console.log('🧪 Testing AI Context Analysis Service\n');
    console.log('This will test if AI correctly understands conversation context\n');
    
    try {
        const test1 = await testQuantityUpdate();
        const test2 = await testOrderConfirmation();
        const test3 = await testDiscountRequest();
        
        console.log('\n=== Test Summary ===');
        console.log('Quantity Update:', test1 ? '✅' : '❌');
        console.log('Order Confirmation:', test2 ? '✅' : '❌');
        console.log('Discount Request:', test3 ? '✅' : '❌');
        
        const passed = [test1, test2, test3].filter(t => t).length;
        console.log(`\nPassed: ${passed}/3 tests`);
        
        if (passed === 3) {
            console.log('\n🎉 All tests passed! AI Context Service is working correctly!');
        } else {
            console.log('\n⚠️ Some tests failed. Check AI prompts and logic.');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error(error.stack);
    }
}

// Run if called directly
if (require.main === module) {
    runTests().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { runTests, testQuantityUpdate, testOrderConfirmation, testDiscountRequest };
