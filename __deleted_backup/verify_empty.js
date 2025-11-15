const { supabase } = require('./services/config');

async function verifyTablesEmpty() {
  const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
  const customerPhone = '+91 84848 30021';

  // Check conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('end_user_phone', customerPhone);
  console.log('Conversations:', conversations ? conversations.length : 0);

  // Check orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('tenant_id', tenantId);
  console.log('Orders:', orders ? orders.length : 0);

  // Check order_items
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id');
  console.log('Order Items:', orderItems ? orderItems.length : 0);

  // Check carts
  const { data: carts } = await supabase
    .from('carts')
    .select('id')
    .eq('tenant_id', tenantId);
  console.log('Carts:', carts ? carts.length : 0);

  // Check cart_items
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('id');
  console.log('Cart Items:', cartItems ? cartItems.length : 0);
}

verifyTablesEmpty();
