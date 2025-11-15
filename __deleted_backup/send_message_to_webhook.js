const axios = require('axios');

const webhook = process.argv[2] || 'https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/webhook';
const from = process.argv[3] || '919106886259@c.us';
const to = process.argv[4] || '918484830021@c.us';
const text = process.argv[5] || 'price for 8x80 - 5, 8x100 - 10, 8x120 - 3';

(async () => {
  try {
    const payload = {
      message: {
        from,
        to,
        type: 'text',
        text: { body: text },
        profile: { name: 'E2E Test' }
      }
    };

    console.log('Posting to', webhook, 'from', from, 'to', to, 'text:', text);
    const res = await axios.post(webhook, payload, { timeout: 20000 });
    console.log('Response status:', res.status);
    console.log('Response data:', JSON.stringify(res.data, null, 2).slice(0, 2000));
  } catch (error) {
    if (error.response) console.error('Error response:', error.response.status, JSON.stringify(error.response.data));
    else console.error('Request error', error.message);
  }
})();
