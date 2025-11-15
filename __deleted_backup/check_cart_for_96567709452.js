/**
 * Check cart status for customer 96567709452@c.us
 */

const { supabase } = require('../services/config');

async function checkCart() {
    const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
    const customerPhone = '96567709452@c.us';

    console.log('🔍 Checking cart for customer:', customerPhone);
    console.log('   Tenant ID:', tenantId);
    console.log('');

    // Check conversation
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('end_user_phone', customerPhone)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (convError) {
        console.error('❌ Error fetching conversation:', convError.message);
    } else {
        console.log('📝 Conversation:');
        console.log('   ID:', conversation?.id);
        console.log('   State:', conversation?.state);
        console.log('   Metadata:', JSON.stringify(conversation?.metadata, null, 2));
        console.log('');
    }

    // Check cart by conversation_id (if available)
    if (conversation?.id) {
        const { data: cart, error: cartError } = await supabase
            .from('carts')
            .select(`
                *,
                cart_items (
                    *,
                    product:products (*)
                )
            `)
            .eq('conversation_id', conversation.id)
            .maybeSingle();

        if (cartError) {
            console.error('❌ Error fetching cart by conversation_id:', cartError.message);
        } else if (cart) {
            console.log('🛒 Cart found by conversation_id:');
            console.log('   Cart ID:', cart.id);
            console.log('   Conversation ID:', cart.conversation_id);
            console.log('   Items:', cart.cart_items?.length || 0);
            if (cart.cart_items && cart.cart_items.length > 0) {
                cart.cart_items.forEach((item, idx) => {
                    console.log(`   ${idx + 1}. ${item.product?.name} - ${item.quantity} cartons`);
                });
            }
            console.log('');
        } else {
            console.log('⚠️  No cart found by conversation_id');
            console.log('');
        }
    } else {
        console.log('⚠️  No conversation ID available to query cart');
        console.log('');
    }

    console.log('');
    console.log('✅ Cart check complete');
}

checkCart()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('💥 Error:', err.message);
        process.exit(1);
    });
