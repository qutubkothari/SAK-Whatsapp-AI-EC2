// scripts/find_conversation.js
const { supabase } = require('../services/config');

async function findConversation() {
    try {
        // Try different phone formats
        const phoneFormats = [
            '971507055253@c.us',
            '971507055253',
            '+971507055253'
        ];
        
        for (const phone of phoneFormats) {
            console.log(`\n🔍 Trying: ${phone}`);
            const { data: conversations } = await supabase
                .from('conversations')
                .select('id, phone_number, tenant_id, state')
                .eq('phone_number', phone);
            
            if (conversations && conversations.length > 0) {
                console.log(`✅ Found ${conversations.length} conversation(s):`);
                conversations.forEach(conv => {
                    console.log(`   ID: ${conv.id}`);
                    console.log(`   Phone: ${conv.phone_number}`);
                    console.log(`   State: ${conv.state}`);
                });
                
                // Check cart for this conversation
                const { data: carts } = await supabase
                    .from('carts')
                    .select(`
                        *,
                        cart_items (
                            *,
                            products (name, product_code, units_per_carton, price)
                        )
                    `)
                    .eq('conversation_id', conversations[0].id)
                    .eq('status', 'active');
                
                if (carts && carts.length > 0) {
                    console.log(`\n📦 Found ${carts.length} active cart(s):`);
                    carts.forEach(cart => {
                        console.log(`\n   Cart ID: ${cart.id}`);
                        console.log(`   Items: ${cart.cart_items.length}`);
                        cart.cart_items.forEach(item => {
                            console.log(`\n   🔹 ${item.products.name}`);
                            console.log(`      Quantity: ${item.quantity} cartons`);
                            console.log(`      Units/carton: ${item.products.units_per_carton}`);
                            console.log(`      Total pieces: ${item.quantity * item.products.units_per_carton}`);
                            console.log(`      Price/carton: ₹${item.products.price}`);
                            console.log(`      Total: ₹${(item.quantity * item.products.price).toLocaleString()}`);
                        });
                    });
                } else {
                    console.log('❌ No active carts found');
                }
                
                return;
            }
        }
        
        console.log('\n❌ No conversations found with any phone format');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

findConversation();
