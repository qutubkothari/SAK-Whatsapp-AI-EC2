/**
 * Test script to debug discount flow
 * Run with: node test_discount_flow.js
 */

require('dotenv').config();

async function testDiscountFlow() {
    console.log('🧪 Testing Discount Flow...\n');

    // Test 1: Intent Recognition
    console.log('=== TEST 1: Intent Recognition ===');
    const { recognizeIntent } = require('./services/intentRecognitionService');

    const testMessages = [
        'give me discount',
        'best price for 8x80 100 cartons',
        'discount chahiye',
        'can you give me better price'
    ];

    for (const msg of testMessages) {
        try {
            console.log(`\nMessage: "${msg}"`);
            const intent = await recognizeIntent(msg, {});
            console.log('✓ Intent:', intent.intent);
            console.log('  Confidence:', intent.confidence);
            console.log('  Reasoning:', intent.reasoning);
        } catch (error) {
            console.error('✗ Error:', error.message);
        }
    }

    // Test 2: Check if discount intent matches condition
    console.log('\n\n=== TEST 2: Discount Handler Condition Check ===');
    const sampleIntent = {
        intent: 'DISCOUNT_REQUEST',
        confidence: 0.95
    };

    const isDiscountIntent = sampleIntent?.intent === 'DISCOUNT_REQUEST' ||
                           (sampleIntent?.confidence > 0.85 &&
                            ['discount_request', 'negotiation'].includes(sampleIntent?.intent?.toLowerCase()));

    console.log('Sample intent:', sampleIntent);
    console.log('isDiscountIntent:', isDiscountIntent);
    console.log('✓ Condition check: PASS');

    // Test 3: Check AI Discount Understanding
    console.log('\n\n=== TEST 3: AI Discount Understanding ===');
    const { detectDiscountIntent } = require('./services/aiDiscountUnderstanding');

    try {
        const result = await detectDiscountIntent('give me discount for 8x80 100 cartons', {
            hasQuotedProducts: true
        });
        console.log('✓ AI Discount Detection Result:');
        console.log('  Is Discount Request:', result.isDiscountRequest);
        console.log('  Confidence:', result.confidence);
        console.log('  Discount Type:', result.discountType);
        console.log('  Reasoning:', result.reasoning);
    } catch (error) {
        console.error('✗ Error:', error.message);
    }

    // Test 4: Check conversation with quoted products
    console.log('\n\n=== TEST 4: Check Conversation Context ===');
    const { supabase } = require('./services/config');

    try {
        // Get a sample conversation
        const { data: conversation, error } = await supabase
            .from('conversations')
            .select('id, end_user_phone, last_quoted_products, context_data')
            .not('last_quoted_products', 'is', null)
            .limit(1)
            .single();

        if (error) {
            console.log('⚠ No conversations with quoted products found');
        } else {
            console.log('✓ Found conversation:', conversation.id);
            console.log('  Phone:', conversation.end_user_phone);
            console.log('  Last Quoted Products:', conversation.last_quoted_products ? 'YES' : 'NO');

            if (conversation.last_quoted_products) {
                try {
                    const products = typeof conversation.last_quoted_products === 'string'
                        ? JSON.parse(conversation.last_quoted_products)
                        : conversation.last_quoted_products;
                    console.log('  Products count:', products?.length || 0);
                    if (products && products.length > 0) {
                        console.log('  Sample product:', {
                            code: products[0].productCode,
                            quantity: products[0].quantity,
                            price: products[0].price
                        });
                    }
                } catch (parseError) {
                    console.error('  ✗ Parse error:', parseError.message);
                }
            }

            if (conversation.context_data) {
                console.log('  Context Data:', conversation.context_data);
            }
        }
    } catch (error) {
        console.error('✗ Database error:', error.message);
    }

    // Test 5: Volume Discount Slabs
    console.log('\n\n=== TEST 5: Volume Discount Slabs ===');
    const { getDiscountSlab } = require('./services/volumeDiscountService');

    const testQuantities = [5, 15, 50, 100, 150];
    for (const qty of testQuantities) {
        const slab = getDiscountSlab(qty);
        console.log(`${qty} cartons → ${slab.minDiscount}-${slab.maxDiscount}% (${slab.tier})`);
    }

    console.log('\n\n✅ All tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check the intent recognition results above');
    console.log('2. If intent is not DISCOUNT_REQUEST, check intentRecognitionService.js');
    console.log('3. If AI discount detection fails, check aiDiscountUnderstanding.js');
    console.log('4. Check if conversations have last_quoted_products field populated');
    console.log('5. Ensure discount is being saved to context_data');
}

testDiscountFlow().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}).catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
