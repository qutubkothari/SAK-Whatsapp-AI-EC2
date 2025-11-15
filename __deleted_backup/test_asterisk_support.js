/**
 * Test script for asterisk (*) product code support
 * Verifies that both "10x100" and "10*100" work the same
 */

const { extractOrderDetailsFallback } = require('./services/smartOrderExtractionService');

console.log('🧪 Testing Product Code Recognition with * and x\n');

const testCases = [
    {
        name: 'Standard x notation',
        input: '10x100 10000pcs',
        expected: { productCode: '10x100', quantity: 10000, unit: 'pieces' }
    },
    {
        name: 'Asterisk * notation',
        input: '10*100 10000pcs',
        expected: { productCode: '10x100', quantity: 10000, unit: 'pieces' }
    },
    {
        name: 'Multiple products with x',
        input: '8x80, 8x100 10 ctns each',
        expected: { isMultipleProducts: true, count: 2, quantity: 10 }
    },
    {
        name: 'Multiple products with *',
        input: '8*80, 8*100 10 ctns each',
        expected: { isMultipleProducts: true, count: 2, quantity: 10 }
    },
    {
        name: 'Mixed * and x',
        input: '10*100, 10x120 5000pcs each',
        expected: { isMultipleProducts: true, count: 2, quantity: 5000 }
    }
];

console.log('Running tests...\n');

testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);
    console.log(`Input: "${test.input}"`);
    
    const result = extractOrderDetailsFallback(test.input);
    
    if (!result) {
        console.log('❌ FAIL: No result returned\n');
        return;
    }
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    // Validate based on test case
    let passed = true;
    
    if (test.expected.productCode) {
        const extractedCode = result.orders?.[0]?.productCode || result.productCode;
        if (extractedCode !== test.expected.productCode) {
            console.log(`❌ FAIL: Expected product code "${test.expected.productCode}", got "${extractedCode}"`);
            passed = false;
        }
    }
    
    if (test.expected.isMultipleProducts) {
        if (!result.isMultipleProducts) {
            console.log('❌ FAIL: Expected multiple products, got single product');
            passed = false;
        } else if (result.orders.length !== test.expected.count) {
            console.log(`❌ FAIL: Expected ${test.expected.count} products, got ${result.orders.length}`);
            passed = false;
        } else {
            // Check that * was converted to x
            const allCodesNormalized = result.orders.every(order => 
                !order.productCode.includes('*') && order.productCode.includes('x')
            );
            if (!allCodesNormalized) {
                console.log('❌ FAIL: Product codes still contain * instead of x');
                passed = false;
            }
        }
    }
    
    if (test.expected.quantity) {
        const extractedQty = result.orders?.[0]?.quantity || result.quantity;
        if (extractedQty !== test.expected.quantity) {
            console.log(`❌ FAIL: Expected quantity ${test.expected.quantity}, got ${extractedQty}`);
            passed = false;
        }
    }
    
    if (passed) {
        console.log('✅ PASS\n');
    } else {
        console.log('');
    }
});

console.log('\n📋 Summary:');
console.log('All product codes using * should be converted to x internally');
console.log('Customer can use either 10*100 or 10x100 - both work the same!');
