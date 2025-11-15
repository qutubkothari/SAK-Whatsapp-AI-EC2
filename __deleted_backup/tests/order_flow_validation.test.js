// Automated test for multi-product and piece-based order flows using cartonPricingService
const assert = require('assert');
const { addCartonProductToCart } = require('../services/cartonPricingService');

// Use provided tenant and customer data
const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
const userPhone = '919106886259';

async function testPieceBasedOrder() {
    // Simulate adding 150 pieces of product 'NFF 8x80'
    const result = await addCartonProductToCart(tenantId, userPhone, 'NFF 8x80', 150, 'pieces');
    console.log('Piece-based order result:', result);
    assert(result.includes('carton'), 'Should convert pieces to cartons');
    assert(result.includes('pieces'), 'Should show total pieces');
}

async function testMultiProductOrder() {
    // Simulate adding 3 cartons of 'NFF 8x80' and 2 cartons of 'NFF 8x100'
    const result1 = await addCartonProductToCart(tenantId, userPhone, 'NFF 8x80', 3, 'cartons');
    const result2 = await addCartonProductToCart(tenantId, userPhone, 'NFF 8x100', 2, 'cartons');
    console.log('Multi-product order result 1:', result1);
    console.log('Multi-product order result 2:', result2);
    assert(result1.includes('carton'), 'First product should be added as cartons');
    assert(result2.includes('carton'), 'Second product should be added as cartons');
}

async function runTests() {
    await testPieceBasedOrder();
    await testMultiProductOrder();
    console.log('All order flow tests passed.');
}

runTests().catch(err => {
    console.error('Order flow test failed:', err);
    process.exit(1);
});
