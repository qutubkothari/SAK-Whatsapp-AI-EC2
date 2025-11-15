/**
 * Test script for discount negotiation feature
 * 
 * Run with: node test_discount_negotiation.js
 */

const { 
    isDiscountNegotiation, 
    extractDiscountRequest, 
    evaluateDiscountRequest,
    handleDiscountNegotiation,
    handleBestPriceRequest
} = require('./services/discountNegotiationService');

console.log('='.repeat(80));
console.log('DISCOUNT NEGOTIATION TEST SCENARIOS');
console.log('='.repeat(80));

// Test 1: Detect discount requests
console.log('\n📋 TEST 1: DISCOUNT REQUEST DETECTION\n');
const testMessages = [
    'give me discount',
    'can you give some discount',
    'discount chahiye',
    'reduce the price',
    'best price kya hai',
    'final price?',
    'last price',
    'kam karo thoda',
    'I need prices for 8x80, 8x100', // Should NOT match
    'place order', // Should NOT match
];

testMessages.forEach(msg => {
    const isDiscount = isDiscountNegotiation(msg);
    console.log(`"${msg}" → ${isDiscount ? '✅ DISCOUNT' : '❌ NOT DISCOUNT'}`);
});

// Test 2: Extract specific discount requests
console.log('\n\n📋 TEST 2: SPECIFIC DISCOUNT EXTRACTION\n');
const specificRequests = [
    'give me 5% discount',
    'can you do 10 percent off',
    'make it ₹1.45 per piece',
    '1.50 rupees me karo',
    '₹100 off karo',
    '200 rupees discount chahiye',
    'best price', // No specific request
];

specificRequests.forEach(msg => {
    const extracted = extractDiscountRequest(msg);
    if (extracted) {
        console.log(`"${msg}"`);
        console.log(`  → Type: ${extracted.type}`);
        console.log(`  → Value: ${extracted.value}`);
    } else {
        console.log(`"${msg}" → No specific request`);
    }
});

// Test 3: Evaluate discount requests
console.log('\n\n📋 TEST 3: DISCOUNT EVALUATION\n');

const evaluationScenarios = [
    {
        request: { type: 'percentage', value: 2 },
        currentPrice: 2400,
        quantity: 15,
        isReturning: false,
        desc: 'New customer, 15 cartons, wants 2%'
    },
    {
        request: { type: 'percentage', value: 5 },
        currentPrice: 2400,
        quantity: 15,
        isReturning: false,
        desc: 'New customer, 15 cartons, wants 5%'
    },
    {
        request: { type: 'percentage', value: 8 },
        currentPrice: 2400,
        quantity: 15,
        isReturning: false,
        desc: 'New customer, 15 cartons, wants 8% (too high)'
    },
    {
        request: { type: 'percentage', value: 1.5 },
        currentPrice: 2300,
        quantity: 20,
        isReturning: true,
        desc: 'Returning customer, 20 cartons, wants 1.5%'
    },
    {
        request: { type: 'percentage', value: 3 },
        currentPrice: 2300,
        quantity: 20,
        isReturning: true,
        desc: 'Returning customer, 20 cartons, wants 3% (too high for returning)'
    },
    {
        request: { type: 'specific_price', value: 1.45 },
        currentPrice: 1.50,
        quantity: 30,
        isReturning: false,
        desc: 'New customer, 30 cartons, wants ₹1.45 (₹0.05 off from ₹1.50)'
    },
    {
        request: { type: 'percentage', value: 7 },
        currentPrice: 2400,
        quantity: 150,
        isReturning: false,
        desc: 'Large order: 150 cartons, wants 7%'
    },
];

evaluationScenarios.forEach((scenario, i) => {
    console.log(`\nScenario ${i + 1}: ${scenario.desc}`);
    const evaluation = evaluateDiscountRequest(
        scenario.request,
        scenario.currentPrice,
        scenario.quantity,
        scenario.isReturning
    );
    console.log(`  Result: ${evaluation.acceptable === true ? '✅ ACCEPTED' : evaluation.acceptable === 'negotiate' ? '🤝 COUNTER-OFFER' : '❌ REJECTED'}`);
    console.log(`  Reason: ${evaluation.reason}`);
    console.log(`  Counter/Offer: ${evaluation.counterOffer}%`);
});

// Test 4: Full negotiation flow
console.log('\n\n📋 TEST 4: FULL NEGOTIATION RESPONSES\n');

async function testNegotiation() {
    const scenarios = [
        {
            message: 'give me discount',
            context: {
                totalCartons: 20,
                cartTotal: 48000,
                averagePrice: 2400,
                isReturningCustomer: false
            },
            desc: 'Generic discount request - new customer'
        },
        {
            message: 'give me your best price',
            context: {
                totalCartons: 25,
                cartTotal: 60000,
                averagePrice: 2400,
                isReturningCustomer: true
            },
            desc: 'Best price request - returning customer'
        },
        {
            message: 'can you do 5% discount',
            context: {
                totalCartons: 15,
                cartTotal: 36000,
                averagePrice: 2400,
                isReturningCustomer: false
            },
            desc: 'Specific 5% request - 15 cartons'
        },
        {
            message: 'make it ₹1.45 per piece',
            context: {
                totalCartons: 30,
                cartTotal: 45000,
                averagePrice: 1.50,
                isReturningCustomer: false
            },
            desc: 'Specific price request'
        },
    ];

    for (const scenario of scenarios) {
        console.log(`\n${'─'.repeat(70)}`);
        console.log(`Scenario: ${scenario.desc}`);
        console.log(`Message: "${scenario.message}"`);
        console.log(`Context: ${scenario.context.totalCartons} cartons, ₹${scenario.context.cartTotal} total`);
        console.log(`${'─'.repeat(70)}`);
        
        let result;
        if (/\b(?:best|final|last|lowest)\s*price\b/i.test(scenario.message)) {
            result = await handleBestPriceRequest('tenant_id', '1234567890', scenario.context);
        } else {
            result = await handleDiscountNegotiation('tenant_id', '1234567890', scenario.message, scenario.context);
        }
        
        console.log('\nBot Response:');
        console.log(result.response);
        console.log('\nResult Details:');
        console.log(`  Approved: ${result.approved || false}`);
        console.log(`  Discount %: ${result.discountPercent || result.counterOffer || 'N/A'}`);
        console.log(`  Needs Follow-up: ${result.needsFollowup}`);
    }
}

testNegotiation().then(() => {
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(80));
    console.log('\nKEY BEHAVIORS:');
    console.log('1. Generic "give discount" → Asks what they\'re looking for');
    console.log('2. "Best price" → Offers max discount for their quantity tier');
    console.log('3. Specific % request → Evaluates against volume discount slabs');
    console.log('4. Returning customers → Max 1-2% additional discount');
    console.log('5. New customers → Based on volume discount tiers');
    console.log('6. Too high request → Counter-offers with maximum allowed');
    console.log('\n');
}).catch(err => {
    console.error('Test error:', err);
});
