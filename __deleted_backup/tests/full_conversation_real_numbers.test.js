// Full end-to-end test using real mobile numbers and Maytapi webhook
const axios = require('axios');

// For local end-to-end testing, call the local webhook directly
const MAYTAPI_WEBHOOK_URL = 'http://localhost:8081/webhook';
const BOT_NUMBER = '+91 8484830021';
const ADMIN_NUMBER = '+91 9537653927';
const CUSTOMER_NUMBERS = ['+91 9106886259', '+971 50 7055253', '+965 67709452'];

const runConversation = async (customerNumber) => {
  const send = async (body) => {
    // Normalized payload expected by messageNormalizer
    const payload = {
      message: {
        from: customerNumber,
        to: BOT_NUMBER,
        type: 'text',
        text: { body },
        profile: { name: 'Test User' }
      }
    };
    try {
      const res = await axios.post(MAYTAPI_WEBHOOK_URL, payload);
  console.log(`Response for '${body}':`, JSON.stringify(res.data).slice(0, 1000));
      return res.data;
    } catch (err) {
      console.error(`Error for '${body}':`, err.response ? err.response.data : err.message);
      return null;
    }
  };

  // Step 1: Enquire price
  await send('price for 8x80, 8x100');
  // Step 2: Ask for price (redundant, but included for flow)
  await send('price?');
  // Step 3: Ask for discount
  await send('discount?');
  // Step 4: Place order
  await send('place order');
  // Step 5: Upload GST if asked for
  await send('27AABCU9603R1ZM');
  // Step 6: Add shipping details
  await send('Shipping Address: Pune 411060\nTransporter: VRL\nTransporter Contact: 919106886259');
  // Step 7: Confirm order
  await send('confirm order');
  // Step 8: Create sales order
  await send('create sales order');
  // Step 9: Ask for invoice
  await send('invoice');
};

(async () => {
  for (const customer of CUSTOMER_NUMBERS) {
    console.log(`\n--- Running conversation for customer: ${customer} ---`);
    await runConversation(customer);
  }
})();
