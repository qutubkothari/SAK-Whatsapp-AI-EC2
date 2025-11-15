/**
 * Test script to simulate a webhook message and verify message saving
 */

const axios = require('axios');

// Configuration
const WEBHOOK_URL = 'https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com/webhook';
// Or for local testing: 'http://localhost:8081/webhook'

// Simulate a webhook payload from Maytapi
const testPayload = {
  type: 'message',
  message: {
    id: 'test-' + Date.now(),
    fromMe: false,
    text: 'give me prices for 6x40 10000pcs',
    type: 'chat',
    timestamp: Date.now()
  },
  user: {
    id: '919106886259',
    name: 'Test User',
    phone: '919106886259'
  },
  conversation: '919106886259@c.us'
};

async function testWebhook() {
  console.log('🧪 Testing webhook with payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n📤 Sending to:', WEBHOOK_URL);
  
  try {
    const response = await axios.post(WEBHOOK_URL, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('\n✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
    console.log('\n⏳ Waiting 3 seconds for message to be processed...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n💡 Now check the database with:');
    console.log('$env:SUPABASE_URL="https://upswoeziirmshuzelizz.supabase.co"; $env:SUPABASE_SERVICE_KEY="sb_secret_-uwce4s0ceLt0w4LiaIcKQ_i7dj4bCX"; node check_messages_for_conversation.js 1391fe3d-34d6-4048-a5a8-2f7e427aa7cc');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testWebhook();
