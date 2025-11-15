require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const correctPhone = '96567709452@c.us';
const wrongPhone = '1796174692373092623';
const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';

async function mergeDuplicateProfiles() {
    console.log('🔧 Merging duplicate customer profiles...\n');
    
    try {
        // Get the correct profile (with orders but no GST)
        const { data: correctProfile, error: err1 } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('phone', correctPhone)
            .eq('tenant_id', tenantId)
            .single();
        
        if (err1 || !correctProfile) {
            console.error('❌ Could not find correct profile:', correctPhone);
            return;
        }
        
        console.log('✅ Found CORRECT profile (with orders):');
        console.log({
            id: correctProfile.id,
            phone: correctProfile.phone,
            orders: correctProfile.total_orders,
            spent: correctProfile.total_spent,
            gst: correctProfile.gst_number || 'NONE'
        });
        
        // Get the wrong profile (with GST but wrong phone)
        const { data: wrongProfile, error: err2 } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('phone', wrongPhone)
            .eq('tenant_id', tenantId)
            .single();
        
        if (err2 || !wrongProfile) {
            console.error('❌ Could not find wrong profile:', wrongPhone);
            return;
        }
        
        console.log('\n✅ Found WRONG profile (with GST):');
        console.log({
            id: wrongProfile.id,
            phone: wrongProfile.phone,
            gst: wrongProfile.gst_number,
            first_name: wrongProfile.first_name,
            last_name: wrongProfile.last_name,
            company: wrongProfile.company,
            address: wrongProfile.business_address
        });
        
        // Copy GST data from wrong profile to correct profile
        console.log('\n📋 Copying GST data to correct profile...');
        
        const { data: updated, error: updateErr } = await supabase
            .from('customer_profiles')
            .update({
                gst_number: wrongProfile.gst_number,
                first_name: wrongProfile.first_name,
                last_name: wrongProfile.last_name,
                company: wrongProfile.company,
                business_address: wrongProfile.business_address,
                business_verified: true,
                onboarding_completed: true,
                zoho_customer_id: wrongProfile.zoho_customer_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', correctProfile.id)
            .select();
        
        if (updateErr) {
            console.error('❌ Error updating correct profile:', updateErr.message);
            return;
        }
        
        console.log('✅ SUCCESS! GST data copied to correct profile:');
        console.log({
            phone: correctPhone,
            gst_number: wrongProfile.gst_number,
            first_name: wrongProfile.first_name,
            last_name: wrongProfile.last_name,
            company: wrongProfile.company,
            orders: correctProfile.total_orders,
            onboarding_completed: true
        });
        
        // Delete the wrong profile
        console.log('\n🗑️  Deleting duplicate profile with wrong phone...');
        
        const { error: deleteErr } = await supabase
            .from('customer_profiles')
            .delete()
            .eq('id', wrongProfile.id);
        
        if (deleteErr) {
            console.error('⚠️  Could not delete duplicate:', deleteErr.message);
            console.log('   (You can manually delete it later)');
        } else {
            console.log('✅ Duplicate profile deleted');
        }
        
        // Clear any stuck conversation state
        console.log('\n🧹 Clearing conversation state...');
        
        const { data: conv } = await supabase
            .from('conversations')
            .select('id, state')
            .eq('tenant_id', tenantId)
            .eq('end_user_phone', correctPhone)
            .single();
        
        if (conv && conv.state) {
            await supabase
                .from('conversations')
                .update({ state: null, context_data: null })
                .eq('id', conv.id);
            
            console.log('✅ Cleared conversation state:', conv.state, '→ null');
        } else {
            console.log('ℹ️  No stuck state to clear');
        }
        
        console.log('\n✅ MERGE COMPLETE!');
        console.log('\n📱 Customer', correctPhone, 'now has:');
        console.log('   ✅ GST:', wrongProfile.gst_number);
        console.log('   ✅ Name:', wrongProfile.first_name, wrongProfile.last_name);
        console.log('   ✅ Company:', wrongProfile.company);
        console.log('   ✅ Orders:', correctProfile.total_orders);
        console.log('   ✅ Total Spent: ₹', correctProfile.total_spent);
        console.log('\n🎯 Customer can now place orders without GST prompt!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

mergeDuplicateProfiles();
