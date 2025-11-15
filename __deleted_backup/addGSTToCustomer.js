require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const customerPhone = '96567709452@c.us';
const tenantId = 'f1a3e5c7-2b4d-6f8e-0a1c-3e5f7a9b1c3d'; // SAK's tenant ID

const gstDetails = {
    gst_number: '27NZLPK0905D1ZA',
    legal_name: 'MUSTAFA ATIF KOTHARI',
    trade_name: 'UMMU TRADING',
    business_state: 'Maharashtra',
    business_address: 'C-WING 105, HATIMI HILLS, PHASE 1, Yewale Wadi, Pune, Maharashtra, 411048',
    onboarding_completed: true,
    business_verified: true,
    updated_at: new Date().toISOString()
};

async function addGSTToCustomer() {
    console.log('🔧 Adding GST details to customer:', customerPhone);
    console.log('📋 GST Number:', gstDetails.gst_number);
    
    try {
        // First check if customer profile exists
        const { data: profile, error: fetchError } = await supabase
            .from('customer_profiles')
            .select('id, phone, gst_number, onboarding_completed')
            .eq('phone', customerPhone)
            .eq('tenant_id', tenantId)
            .single();
        
        if (fetchError) {
            console.error('❌ Error fetching customer profile:', fetchError.message);
            return;
        }
        
        if (!profile) {
            console.error('❌ Customer profile not found for:', customerPhone);
            return;
        }
        
        console.log('✅ Found customer profile:', {
            id: profile.id,
            phone: profile.phone,
            currentGST: profile.gst_number || 'NONE',
            currentOnboarded: profile.onboarding_completed || false
        });
        
        // Update with GST details
        const { data: updated, error: updateError } = await supabase
            .from('customer_profiles')
            .update(gstDetails)
            .eq('id', profile.id)
            .select();
        
        if (updateError) {
            console.error('❌ Error updating customer profile:', updateError.message);
            return;
        }
        
        console.log('✅ SUCCESS! GST details added to customer profile:');
        console.log({
            id: profile.id,
            phone: customerPhone,
            gst_number: gstDetails.gst_number,
            legal_name: gstDetails.legal_name,
            trade_name: gstDetails.trade_name,
            onboarding_completed: true,
            business_verified: true
        });
        
        // Also clear any stuck conversation state
        console.log('\n🧹 Clearing any stuck conversation state...');
        
        const { data: conv } = await supabase
            .from('conversations')
            .select('id, state')
            .eq('tenant_id', tenantId)
            .eq('end_user_phone', customerPhone)
            .single();
        
        if (conv && conv.state === 'awaiting_gst_info') {
            await supabase
                .from('conversations')
                .update({ state: null, context_data: null })
                .eq('id', conv.id);
            
            console.log('✅ Cleared stuck conversation state');
        } else {
            console.log('ℹ️  No stuck state to clear (state:', conv?.state || 'null', ')');
        }
        
        console.log('\n✅ COMPLETE! Customer can now place orders without GST prompt!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

addGSTToCustomer();
