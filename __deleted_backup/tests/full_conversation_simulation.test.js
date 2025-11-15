const axios = require('axios');
const { supabase } = require('../services/config');

// Patch WhatsApp service to avoid real network calls during tests
const whatsapp = require('../services/whatsappService');
whatsapp.sendMessage = async (to, text) => {
  console.log(`[TEST-FAKE-WHATSAPP] sendMessage -> ${to}: ${typeof text === 'string' ? text.slice(0,200) : JSON.stringify(text).slice(0,200)}`);
  return 'test-msg-id';
};
whatsapp.sendMessageWithImage = async (to, caption, url) => {
  console.log(`[TEST-FAKE-WHATSAPP] sendImage -> ${to}: ${caption.slice(0,100)} ${url}`);
  return 'test-img-id';
};
whatsapp.sendDocument = async (to, buffer, filename) => {
  console.log(`[TEST-FAKE-WHATSAPP] sendDocument -> ${to}: ${filename}`);
  return 'test-doc-id';
};

async function getTenant() {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, bot_phone_number')
    .limit(1)
    .single();
  if (error || !data) throw new Error('No tenant found in DB; please configure a tenant');
  return data;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function postMessage(tenant, from, text) {
  const payload = {
    message: {
      from,
      to: tenant.bot_phone_number,
      type: 'text',
      text: { body: text }
    }
  };
  const response = await axios.post('http://localhost:8080/webhook', payload).catch(err => {
    console.error('[TEST] HTTP error during POST /webhook:', err.response ? err.response.data : err.message);
    throw err;
  });
  return response.data;
}

async function findLatestOrderForConversation(tenantId, from) {
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('end_user_phone', from)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!conversation) return null;
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('conversation_id', conversation.id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return order;
}

async function runFullFlow() {
  console.log('\n=== Full conversation simulation test ===\n');
  const tenant = await getTenant();
  // Use a non-admin test phone number (not the tenant owner) to ensure normal customer flow
  const from = '919999888777';

  console.log('[TEST] Using tenant:', tenant.id, 'bot:', tenant.bot_phone_number);

  // Ensure test products exist for the tenant
  const requiredCodes = ['8x80', '8x100'];
  for (const code of requiredCodes) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('tenant_id', tenant.id)
      .ilike('name', `%${code}%`)
      .limit(1)
      .single();

    if (!existing) {
      console.log('[TEST] Inserting product for code:', code);
      await supabase.from('products').insert([{
        tenant_id: tenant.id,
        name: `NFF ${code}`,
        price: 2511,
        packaging_unit: 'carton',
        units_per_carton: 150,
        is_active: true
      }]);
    }
  }

  console.log('\n1) Asking prices for 8x80 and 8x100');
  await postMessage(tenant, from, 'price for 8x80, 8x100');
  await delay(1000);

  console.log('\n2) Asking for discount');
  await postMessage(tenant, from, 'discount?');
  await delay(1000);

  console.log('\n3) Confirming and placing order');
  await postMessage(tenant, from, 'Yes, go ahead');
  await delay(1500);

  // If GST is requested, upload GST number
  const { data: conv } = await supabase
    .from('conversations')
    .select('state')
    .eq('tenant_id', tenant.id)
    .eq('end_user_phone', from)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (conv && conv.state === 'awaiting_gst_info') {
    console.log('[TEST] System asked for GST - sending GST number and details');
    await postMessage(tenant, from, '27AABCU9603R1ZM\nCompany: TestCo\nAddress: Pune 411060');
    await delay(1000);
  }

  // Shipping details
  console.log('\n4) Sending shipping details');
  const shippingPayload = `1. Shipping Address: Pune 411060\n2. Transporter Details: VRL\n3. Transporter Contact: 919106886259`;
  await postMessage(tenant, from, shippingPayload);
  await delay(1500);

  // Confirm final order creation
  const order = await findLatestOrderForConversation(tenant.id, from);
  if (order) {
    console.log('[TEST] Order created:', order.id, 'Total:', order.total_amount);
  } else {
    console.warn('[TEST] No order found for the conversation');
  }

  // Try to request invoice display (if API supports it)
  if (order && order.id) {
    console.log('\n5) Requesting invoice (trigger)');
    // There's an admin/v1 style handler for invoices, but simpler: ask the bot
    await postMessage(tenant, from, `show invoice for ${order.id}`);
    await delay(1000);

    // Check if PDF was attached in orders
    const { data: refreshedOrder } = await supabase
      .from('orders')
      .select('pdf_delivery_url, pdf_delivery_status')
      .eq('id', order.id)
      .single();
    console.log('[TEST] Invoice status:', refreshedOrder?.pdf_delivery_status, refreshedOrder?.pdf_delivery_url);
  }

  console.log('\n=== Simulation complete ===\n');
}

runFullFlow().catch(err => {
  console.error('[TEST] Full flow failed:', err.message || err);
  process.exit(1);
});
