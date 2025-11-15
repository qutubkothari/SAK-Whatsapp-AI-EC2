// Automated test for multi-product price inquiry (should NOT add to cart)
const assert = require('assert');
const axios = require('axios');

const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
const userPhone = '919106886259';
const testQuery = 'price for 8x80, 8x100, 10x100';

async function testMultiProductPriceInquiry() {
    // Simulate sending a multi-product price inquiry
    const response = await axios.post('http://localhost:8081/api_new/customer', {
        from: userPhone,
        message: testQuery,
        tenantId: tenantId
    });
    console.log('Multi-product price inquiry response:', response.data);
    assert(response.data.type === 'price_inquiry', 'Should return type price_inquiry');
    // Optionally, check that no cart/order context is updated (requires DB check or mock)
}

async function runTests() {
    await testMultiProductPriceInquiry();
    console.log('Multi-product price inquiry test passed.');
}

runTests().catch(err => {
    console.error('Multi-product price inquiry test failed:', err);
    process.exit(1);
});
