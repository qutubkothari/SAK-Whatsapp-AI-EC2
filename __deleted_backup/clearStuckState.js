#!/usr/bin/env node

/**
 * EMERGENCY FIX: Clear stuck conversation state
 * 
 * This clears the awaiting_gst_info state for a customer who's stuck
 */

const { supabase } = require('../config/database');

async function clearStuckState() {
    try {
        // Customer who's stuck
        const customerPhone = '96567709452@c.us';
        
        console.log('🔍 Finding conversation for:', customerPhone);
        
        // Get conversation
        const { data: conversation, error: findError } = await supabase
            .from('conversations')
            .select('id, state, tenant_id, end_user_phone')
            .eq('end_user_phone', customerPhone)
            .single();
        
        if (findError) {
            console.log('❌ Conversation not found:', findError.message);
            process.exit(1);
        }
        
        console.log('✅ Found conversation:', {
            id: conversation.id,
            phone: conversation.end_user_phone,
            state: conversation.state
        });
        
        // Check customer profile
        const { data: profile } = await supabase
            .from('customer_profiles')
            .select('id, phone, gst_number, onboarding_completed, business_verified')
            .eq('tenant_id', conversation.tenant_id)
            .eq('phone', customerPhone)
            .single();
        
        if (profile) {
            console.log('\n📋 Customer Profile:', {
                id: profile.id,
                hasGST: !!profile.gst_number,
                gst: profile.gst_number || 'NONE',
                onboarded: profile.onboarding_completed,
                verified: profile.business_verified
            });
            
            // If has GST but flags are wrong, fix them
            if (profile.gst_number && !profile.onboarding_completed) {
                console.log('\n🔧 Fixing profile flags...');
                await supabase
                    .from('customer_profiles')
                    .update({
                        onboarding_completed: true,
                        business_verified: true
                    })
                    .eq('id', profile.id);
                console.log('✅ Profile flags fixed!');
            }
        } else {
            console.log('\n⚠️  No customer profile found');
        }
        
        // Clear conversation state
        console.log('\n🧹 Clearing conversation state...');
        
        const { data: updated, error: updateError } = await supabase
            .from('conversations')
            .update({
                state: null,
                context_data: null
            })
            .eq('id', conversation.id)
            .select();
        
        if (updateError) {
            throw new Error(`Update failed: ${updateError.message}`);
        }
        
        console.log('\n✅ SUCCESS! Conversation state cleared:\n');
        console.log('Previous state:', conversation.state);
        console.log('New state:', 'null (cleared)');
        
        console.log('\n🎯 Customer can now:');
        console.log('   - Send price queries: "price 8x80"');
        console.log('   - Add to cart: "10 cartons"');
        console.log('   - Place orders normally');
        
        console.log('\n💡 The "awaiting_gst_info" trap is cleared!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Run the fix
console.log('🚑 EMERGENCY: Clearing stuck conversation state...\n');
clearStuckState();
