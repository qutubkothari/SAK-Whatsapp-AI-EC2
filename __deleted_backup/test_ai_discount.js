// =============================================
// Test AI Discount Understanding
// Run: node test_ai_discount.js
// =============================================

require('dotenv').config();
const { 
    detectDiscountIntent, 
    extractDiscountRequestDetails, 
    generateDiscountResponse 
} = require('./services/aiDiscountUnderstanding');

// Test cases
const testCases = [
    {
        name: "Basic discount request with product",
        message: "give me discount for 8x80 100 ctns",
        context: {},
        expectedIntent: true,
        expectedType: "initial_request"
    },
    {
        name: "Price inquiry (should NOT trigger)",
        message: "8x80 price",
        context: {},
        expectedIntent: false,
        expectedType: "none"
    },
    {
        name: "Hindi asking for more discount",
        message: "thoda aur kam karo",
        context: { previousDiscountOffered: "5%" },
        expectedIntent: true,
        expectedType: "asking_for_more"
    },
    {
        name: "Best price request",
        message: "best price bata do",
        context: {},
        expectedIntent: true,
        expectedType: "best_price"
    },
    {
        name: "Counter offer with specific price",
        message: "2.50 per piece chalega",
        context: {},
        expectedIntent: true,
        expectedType: "counter_offer"
    },
    {
        name: "Order confirmation (should NOT trigger)",
        message: "yes go ahead",
        context: {},
        expectedIntent: false,
        expectedType: "none"
    },
    {
        name: "Discount with multiple products",
        message: "give me discount for 8x80 and 10x100",
        context: {},
        expectedIntent: true,
        expectedType: "initial_request"
    },
    {
        name: "Hinglish discount request",
        message: "discount milega kya 100 cartons pe",
        context: {},
        expectedIntent: true,
        expectedType: "initial_request"
    }
];

async function runTests() {
    console.log('='.repeat(60));
    console.log('AI DISCOUNT UNDERSTANDING - TEST SUITE');
    console.log('='.repeat(60));
    console.log('');
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ ERROR: OPENAI_API_KEY not set in environment');
        console.error('Please add OPENAI_API_KEY to your .env file');
        process.exit(1);
    }
    
    console.log('✅ OpenAI API Key found');
    console.log('');
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        console.log('-'.repeat(60));
        console.log(`TEST: ${testCase.name}`);
        console.log(`Message: "${testCase.message}"`);
        console.log('');
        
        try {
            // Test intent detection
            const intentResult = await detectDiscountIntent(
                testCase.message, 
                testCase.context
            );
            
            console.log('Intent Result:');
            console.log(`  - Is Discount Request: ${intentResult.isDiscountRequest}`);
            console.log(`  - Confidence: ${intentResult.confidence.toFixed(2)}`);
            console.log(`  - Type: ${intentResult.discountType}`);
            console.log(`  - Reasoning: ${intentResult.reasoning}`);
            
            // Validate expectations
            const intentMatch = intentResult.isDiscountRequest === testCase.expectedIntent;
            const typeMatch = intentResult.discountType === testCase.expectedType;
            const highConfidence = intentResult.confidence > 0.7;
            
            if (intentMatch && typeMatch && highConfidence) {
                console.log('✅ PASSED');
                passed++;
            } else {
                console.log('❌ FAILED');
                if (!intentMatch) console.log(`   Expected intent: ${testCase.expectedIntent}, Got: ${intentResult.isDiscountRequest}`);
                if (!typeMatch) console.log(`   Expected type: ${testCase.expectedType}, Got: ${intentResult.discountType}`);
                if (!highConfidence) console.log(`   Low confidence: ${intentResult.confidence.toFixed(2)}`);
                failed++;
            }
            
            // If it's a discount request, test extraction
            if (intentResult.isDiscountRequest) {
                console.log('');
                console.log('Extraction Test:');
                
                const extractedDetails = await extractDiscountRequestDetails(
                    testCase.message,
                    []
                );
                
                console.log(`  - Products: ${JSON.stringify(extractedDetails.products)}`);
                console.log(`  - Discount Request: ${JSON.stringify(extractedDetails.discountRequest)}`);
                console.log(`  - Confidence: ${extractedDetails.confidence.toFixed(2)}`);
            }
            
        } catch (error) {
            console.log('❌ ERROR:', error.message);
            failed++;
        }
        
        console.log('');
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
    console.log('');
    
    // Test response generation
    console.log('='.repeat(60));
    console.log('TESTING RESPONSE GENERATION');
    console.log('='.repeat(60));
    console.log('');
    
    try {
        const responseContext = {
            customerMessage: "give me discount for 8x80 100 ctns",
            isReturningCustomer: false,
            totalCartons: 100,
            products: [
                { productCode: "8x80", quantity: 100, price: 2500 }
            ],
            offeredDiscount: 5.5,
            maxDiscount: 6.0,
            requestedDiscount: null,
            conversationHistory: []
        };
        
        console.log('Context:', JSON.stringify(responseContext, null, 2));
        console.log('');
        
        const aiResponse = await generateDiscountResponse(responseContext);
        
        console.log('Generated Response:');
        console.log(`  Tone: ${aiResponse.tone}`);
        console.log(`  Should Escalate: ${aiResponse.shouldEscalate}`);
        console.log(`  Message: "${aiResponse.message}"`);
        console.log('');
        
        // Check response quality
        const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(aiResponse.message);
        const hasDiscount = /\d+(\.\d+)?%/.test(aiResponse.message);
        const hasQuestion = /\?/.test(aiResponse.message);
        
        console.log('Response Quality:');
        console.log(`  Has emoji: ${hasEmoji ? '✅' : '❌'}`);
        console.log(`  Mentions discount: ${hasDiscount ? '✅' : '❌'}`);
        console.log(`  Asks question: ${hasQuestion ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('TESTS COMPLETE');
    console.log('='.repeat(60));
}

// Run tests
runTests().catch(console.error);
