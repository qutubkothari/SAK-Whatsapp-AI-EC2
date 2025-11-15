const { supabase } = require('./services/config');

async function nukeAllOrderData() {
  // Delete all order_items
  const { error: oiError } = await supabase.from('order_items').delete().not('id', 'is', null);
  if (oiError) console.error('Error deleting all order_items:', oiError);

  // Delete all orders
  const { error: oError } = await supabase.from('orders').delete().not('id', 'is', null);
  if (oError) console.error('Error deleting all orders:', oError);

  // Delete all cart_items
  const { error: ciError } = await supabase.from('cart_items').delete().not('id', 'is', null);
  if (ciError) console.error('Error deleting all cart_items:', ciError);

  // Delete all carts
  const { error: cError } = await supabase.from('carts').delete().not('id', 'is', null);
  if (cError) console.error('Error deleting all carts:', cError);

  // Delete all conversations
  const { error: convError } = await supabase.from('conversations').delete().not('id', 'is', null);
  if (convError) console.error('Error deleting all conversations:', convError);

  console.log('✅ All order, cart, and conversation data deleted from the database.');
}

nukeAllOrderData();
