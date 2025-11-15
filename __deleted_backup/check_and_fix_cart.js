// scripts/check_and_fix_cart.js
const { supabase } = require('../services/config');

async function checkAndFixCart(phoneNumber) {
    try {
        console.log(`\n🔍 Checking cart for: ${phoneNumber}`);
        
        // Get conversation
        const { data: conversation } = await supabase
            .from('conversations')
            .select('id')
            .eq('phone_number', phoneNumber)
            .single();
        
        if (!conversation) {
            console.log('❌ No conversation found');
            return;
        }
        
        // Get cart
        const { data: cart } = await supabase
            .from('carts')
            .select(`
                *,
                cart_items (
                    *,
                    products (*)
                )
            `)
            .eq('conversation_id', conversation.id)
            .eq('status', 'active')
            .single();
        
        if (!cart) {
            console.log('❌ No active cart found');
            return;
        }
        
        console.log(`\n📦 Cart ID: ${cart.id}`);
        console.log(`📊 Cart Items: ${cart.cart_items.length}`);
        
        for (const item of cart.cart_items) {
            const product = item.products;
            console.log(`\n🔹 Product: ${product.name} (${product.product_code})`);
            console.log(`   Units per carton: ${product.units_per_carton}`);
            console.log(`   Current quantity in cart: ${item.quantity} cartons`);
            console.log(`   This equals: ${item.quantity * product.units_per_carton} pieces`);
            console.log(`   Price per carton: ₹${product.price}`);
            console.log(`   Total value: ₹${(item.quantity * product.price).toLocaleString()}`);
            
            // Check if this looks like a mistake
            if (item.quantity > 10000) {
                console.log(`\n⚠️  WARNING: Quantity seems very high!`);
                console.log(`   This is ${(item.quantity * product.units_per_carton).toLocaleString()} pieces`);
                console.log(`   Total value: ₹${(item.quantity * product.price / 10000000).toFixed(2)} crores`);
                
                // Suggest fix
                const suggestedQuantity = Math.ceil(item.quantity / 100);
                console.log(`\n💡 Suggested fix: Change quantity to ${suggestedQuantity} cartons`);
                console.log(`   This would be ${(suggestedQuantity * product.units_per_carton).toLocaleString()} pieces`);
                console.log(`   Total value: ₹${(suggestedQuantity * product.price).toLocaleString()}`);
                
                // Ask for confirmation
                console.log(`\n🔧 To fix, run:`);
                console.log(`   node scripts/fix_cart_quantity.js ${cart.id} ${item.id} ${suggestedQuantity}`);
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Get phone from command line
const phone = process.argv[2] || '971507055253@c.us';
checkAndFixCart(phone);
