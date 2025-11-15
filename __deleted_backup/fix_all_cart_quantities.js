// scripts/fix_all_cart_quantities.js
const { supabase } = require('../services/config');

async function fixAllCartQuantities(maxCartons = 10000, safeCartons = 1000) {
    // Find all active cart items with excessive quantity
    const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select('id, cart_id, quantity')
        .gt('quantity', maxCartons);
    if (error) {
        console.error('Error fetching cart items:', error.message);
        return;
    }
    if (!cartItems || cartItems.length === 0) {
        console.log('✅ No cart items with excessive quantity found.');
        return;
    }
    console.log(`Found ${cartItems.length} cart items with quantity > ${maxCartons}`);
    for (const item of cartItems) {
        console.log(`🔧 Fixing cart item ${item.id}: ${item.quantity} → ${safeCartons}`);
        await supabase
            .from('cart_items')
            .update({ quantity: safeCartons })
            .eq('id', item.id);
    }
    console.log('✅ All excessive cart quantities have been fixed!');
}

// Usage: node scripts/fix_all_cart_quantities.js
fixAllCartQuantities();
