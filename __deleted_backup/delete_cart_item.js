// scripts/delete_cart_item.js
const { supabase } = require('../services/config');

async function deleteCartItem(itemId) {
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
    if (error) {
        console.error('❌ Error deleting cart item:', error.message);
    } else {
        console.log('✅ Deleted cart item:', itemId);
    }
}

deleteCartItem('3c129ecf-e468-45f9-bddb-9e75f5210b8e');
