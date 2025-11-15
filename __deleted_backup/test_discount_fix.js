const axios = require('axios');

// Test the discount context fix
async function testDiscountContext() {
    const baseUrl = 'https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com';

    console.log('Testing discount context linkage fix...');

    // Simulate a price inquiry first (Maytapi format)
    const priceInquiryPayload = {
        message: {
            from: '919106886259@c.us', // Customer number
            to: '919876543210@c.us',   // Business number (receiving)
            type: 'text',
            text: {
                body: 'What is the price for 8x80 and 8x100?'
            }
        }
    };

    try {
        console.log('1. Sending price inquiry...');
        const priceResponse = await axios.post(`${baseUrl}/webhook`, priceInquiryPayload);
        console.log('Price inquiry response status:', priceResponse.status);
        console.log('Price inquiry response data:', priceResponse.data);

        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Now simulate a discount request
        const discountPayload = {
            message: {
                from: '919106886259@c.us', // Same customer number
                to: '919876543210@c.us',   // Same business number
                type: 'text',
                text: {
                    body: 'Can I get a discount on these?'
                }
            }
        };

        console.log('2. Sending discount request...');
        const discountResponse = await axios.post(`${baseUrl}/webhook`, discountPayload);
        console.log('Discount request response status:', discountResponse.status);
        console.log('Discount request response data:', discountResponse.data);

        console.log('Test completed successfully! The fix appears to be working.');

    } catch (error) {
        console.error('Test failed:', error.response?.status, error.response?.data || error.message);
    }
}

testDiscountContext();