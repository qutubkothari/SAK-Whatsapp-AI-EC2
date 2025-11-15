// Test shipment tracking webhook
const https = require('https');

const webhookUrl = 'https://auto-deploy-20251021-102847.uc.r.appspot.com/webhook';

const testData = {
  message: {
    from: "919876543210@c.us",
    to: "917358123456@c.us",
    type: "text",
    text: {
      body: "1234567892"
    },
    timestamp: "1638360000"
  }
};

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('Sending test webhook request with LR number 1234567892...');
console.log('Request body:', JSON.stringify(testData, null, 2));

const req = https.request(webhookUrl, options, (res) => {
  console.log(`Response status: ${res.statusCode}`);
  console.log('Response headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:', data);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(JSON.stringify(testData));
req.end();