// Test script to verify volume discount columns exist in database
const { supabase } = require('./services/config');

async function verifyVolumeDiscountColumns() {
    console.log('🔍 Checking if volume discount columns exist in orders table...\n');
    
    try {
        // Try to query the orders table with the new columns
        const { data, error } = await supabase
            .from('orders')
            .select('id, volume_discount_amount, volume_discount_percent')
            .limit(1);
        
        if (error) {
            console.error('❌ Error querying volume discount columns:');
            console.error(error.message);
            console.log('\n💡 The columns may not exist. Please run the migration SQL in Supabase.');
            return false;
        }
        
        console.log('✅ SUCCESS! Volume discount columns exist in the database.');
        console.log('\nColumn verification:');
        console.log('  - volume_discount_amount: ✅ Found');
        console.log('  - volume_discount_percent: ✅ Found');
        
        if (data && data.length > 0) {
            console.log('\n📊 Sample data from orders table:');
            console.log('  Order ID:', data[0].id);
            console.log('  Volume Discount Amount:', data[0].volume_discount_amount || 0);
            console.log('  Volume Discount Percent:', data[0].volume_discount_percent || 0);
        } else {
            console.log('\n📊 No orders in database yet (this is normal for new setup)');
        }
        
        // Test inserting a dummy value (we'll rollback)
        console.log('\n🧪 Testing column write capability...');
        
        // Get a real tenant_id and conversation_id from existing data
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('tenant_id, conversation_id')
            .limit(1)
            .single();
        
        if (!existingOrder) {
            console.log('⚠️  No existing orders to test with, but columns are verified as readable.');
            console.log('✅ Columns are properly added to the schema.');
            return true;
        }
        
        const testData = {
            tenant_id: existingOrder.tenant_id,
            conversation_id: existingOrder.conversation_id,
            volume_discount_amount: 123.45,
            volume_discount_percent: 5.00,
            total_amount: 1000,
            subtotal_amount: 1000,
            gst_amount: 0,
            shipping_charges: 0
        };
        
        const { data: insertedData, error: insertError } = await supabase
            .from('orders')
            .insert(testData)
            .select('id, volume_discount_amount, volume_discount_percent')
            .single();
        
        if (insertError) {
            console.error('❌ Error writing to volume discount columns:');
            console.error(insertError.message);
            return false;
        }
        
        console.log('✅ Write test successful!');
        console.log('  Written Amount:', insertedData.volume_discount_amount);
        console.log('  Written Percent:', insertedData.volume_discount_percent);
        
        // Clean up test data
        await supabase
            .from('orders')
            .delete()
            .eq('id', insertedData.id);
        
        console.log('✅ Test data cleaned up');
        
        console.log('\n🎉 All checks passed! Volume discount system is ready to use.');
        console.log('\n📝 Next steps:');
        console.log('  1. Create an order with multiple cartons');
        console.log('  2. Volume discount will be automatically calculated');
        console.log('  3. Check the order in database to see discount values');
        
        return true;
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        console.log('\n💡 Make sure you have run the migration SQL in Supabase SQL Editor.');
        return false;
    }
}

// Run the verification
verifyVolumeDiscountColumns()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
