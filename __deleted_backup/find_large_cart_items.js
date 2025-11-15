// scripts/find_large_cart_items.js
const { supabase } = require('../services/config');

async function findLargeCartItems(threshold = 10000) {
    const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select('id, cart_id, quantity')
        .gt('quantity', threshold);
    if (error) {
        console.error('Error fetching cart items:', error.message);
        return;
    }
    if (!cartItems || cartItems.length === 0) {
        console.log('✅ No cart items with quantity above', threshold);
        return;
    }
    console.log(`Found ${cartItems.length} cart items with quantity > ${threshold}`);
    for (const item of cartItems) {
        // Find cart and user info
        const { data: cart } = await supabase
            .from('carts')
            .select('id, conversation_id, status')
            .eq('id', item.cart_id)
            .single();
        let phone = null;
        if (cart && cart.conversation_id) {
            const { data: conv } = await supabase
                .from('conversations')
                .select('end_user_phone')
                .eq('id', cart.conversation_id)
                .single();
            phone = conv ? conv.end_user_phone : null;
        }
        console.log(`CartItem: ${item.id} | Cart: ${item.cart_id} | Qty: ${item.quantity} | User: ${phone}`);
    }
}

findLargeCartItems();
