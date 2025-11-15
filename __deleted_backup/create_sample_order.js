const { supabase } = require('./services/config');

async function createSampleOrder() {
  try {
    const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
    const customerPhone = '+91 84848 30021';

    // First, get or create conversation for this phone
    let { data: existingConv, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('end_user_phone', customerPhone)
      .single();

    let conversationId;
    if (existingConv) {
      conversationId = existingConv.id;
      console.log('Using existing conversation:', conversationId);
    } else {
      // Create new conversation
      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          tenant_id: tenantId,
          end_user_phone: customerPhone,
          state: 'active'
        })
        .select('id')
        .single();

      if (newConvError) {
        console.error('Error creating conversation:', newConvError);
        return;
      }
      conversationId = newConv.id;
      console.log('Created new conversation:', conversationId);
    }

    // Create a sample order with the discounted prices
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        conversation_id: conversationId,
        customer_profile_id: null, // No customer profile for this test
        total_amount: 7127.29,
        status: 'pending_payment',
        subtotal_amount: 7127.29,
        gst_rate: 18,
        gst_amount: 1282.91,
        shipping_charges: 0,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return;
    }

    console.log('Created order:', order.id);

    // Get product IDs
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name')
      .in('name', ['NFF 8x80', 'NFF 8x100', 'NFF 10x100']);

    if (prodError) {
      console.error('Error getting products:', prodError);
      return;
    }

    const productMap = {};
    products.forEach(p => {
      productMap[p.name] = p.id;
    });

    console.log('Product mapping:', productMap);

    // Create order items with discounted prices
    const orderItems = [
      {
        order_id: order.id,
        product_id: productMap['NFF 8x80'],
        quantity: 10,
        price_at_time_of_purchase: 2460.78
      },
      {
        order_id: order.id,
        product_id: productMap['NFF 8x100'],
        quantity: 5,
        price_at_time_of_purchase: 2296.73
      },
      {
        order_id: order.id,
        product_id: productMap['NFF 10x100'],
        quantity: 3,
        price_at_time_of_purchase: 2360.53
      }
    ];

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select('*');

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return;
    }

    console.log('Created order items:', items.length);
    items.forEach(item => {
      console.log(`  ${item.product_id}: ₹${item.price_at_time_of_purchase} x ${item.quantity}`);
    });

    console.log('\n✅ Sample order created successfully!');
    console.log('Customer +91 84848 30021 now has purchase history.');
    console.log('Next cart view should show discounted prices.');

  } catch (err) {
    console.error('Script error:', err);
  }
}

createSampleOrder();