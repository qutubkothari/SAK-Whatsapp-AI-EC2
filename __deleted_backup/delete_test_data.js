const { supabase } = require('./services/config');

async function deleteAllTestData() {
  const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
  const customerPhone = '+91 84848 30021';

  // Find all conversations for this customer
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('end_user_phone', customerPhone);

  if (convError) {
    console.error('Error fetching conversations:', convError);
    return;
  }

  const conversationIds = conversations.map(c => c.id);
  if (conversationIds.length === 0) {
    console.log('No conversations found for customer.');
    return;
  }

  // Delete order_items for orders in these conversations
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .in('conversation_id', conversationIds);

  if (orderError) {
    console.error('Error fetching orders:', orderError);
    return;
  }

  const orderIds = orders.map(o => o.id);
  if (orderIds.length > 0) {
    const { error: oiError } = await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds);
    if (oiError) console.error('Error deleting order_items:', oiError);
  }

  // Delete orders
  if (orderIds.length > 0) {
    const { error: oError } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds);
    if (oError) console.error('Error deleting orders:', oError);
  }

  // Delete cart_items and carts for these conversations
  const { data: carts, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .in('conversation_id', conversationIds);
  if (cartError) {
    console.error('Error fetching carts:', cartError);
    return;
  }
  const cartIds = carts.map(c => c.id);
  if (cartIds.length > 0) {
    const { error: ciError } = await supabase
      .from('cart_items')
      .delete()
      .in('cart_id', cartIds);
    if (ciError) console.error('Error deleting cart_items:', ciError);
    const { error: cError } = await supabase
      .from('carts')
      .delete()
      .in('id', cartIds);
    if (cError) console.error('Error deleting carts:', cError);
  }

  // Delete conversations
  const { error: convDelError } = await supabase
    .from('conversations')
    .delete()
    .in('id', conversationIds);
  if (convDelError) console.error('Error deleting conversations:', convDelError);

  console.log('✅ All test data deleted for customer', customerPhone);
}

deleteAllTestData();
