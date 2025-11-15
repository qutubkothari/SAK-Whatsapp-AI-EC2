// scripts/fix_cart_quantity.js
const { supabase } = require('../services/config');

async function fixCartQuantity(phone, correctCartons) {
    // Try all phone formats
    const phoneFormats = [phone, phone.replace('@c.us', ''), '+91' + phone.replace('@c.us', '')];
    let conversation = null;
    for (const p of phoneFormats) {
        const { data } = await supabase
            .from('conversations')
            .select('id, phone_number')
            .eq('phone_number', p)
            .single();
        if (data) { conversation = data; break; }
    }
    if (!conversation) {
        console.log('❌ No conversation found for', phone);
        return;
    }
    const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('conversation_id', conversation.id)
        .eq('status', 'active')
        .single();
    if (!cart) {
        console.log('❌ No active cart found for conversation', conversation.id);
        return;
    }
    const { data: cartItems } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id);
    if (!cartItems || cartItems.length === 0) {
        console.log('❌ No cart items found');
        return;
    }
    for (const item of cartItems) {
        console.log(`🔧 Fixing cart item ${item.id}: ${item.quantity} → ${correctCartons}`);
        await supabase
            .from('cart_items')
            .update({ quantity: correctCartons })
            .eq('id', item.id);
    }
    console.log('✅ Cart quantities updated!');
}

// Usage: node scripts/fix_cart_quantity.js 971507055253@c.us 1000
const phone = process.argv[2] || '971507055253@c.us';
const cartons = parseInt(process.argv[3] || '1000');
fixCartQuantity(phone, cartons);
