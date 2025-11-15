/**
 * Fix duplicate customer profile for 96567709452
 * Merges the profile without @c.us into the one with @c.us
 */

require('dotenv').config();
const { supabase } = require('../services/config');

async function fixDuplicateCustomer() {
    try {
        console.log('🔄 Fixing duplicate customer profile for 96567709452...\n');

        const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';

        // Get both profiles
        const { data: profiles, error: fetchError } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .in('phone', ['96567709452', '96567709452@c.us'])
            .order('created_at', { ascending: true });

        if (fetchError) {
            throw fetchError;
        }

        if (!profiles || profiles.length === 0) {
            console.log('❌ No profiles found');
            return;
        }

        console.log(`📊 Found ${profiles.length} profile(s):\n`);
        profiles.forEach((p, i) => {
            console.log(`${i + 1}. ID: ${p.id}`);
            console.log(`   Phone: ${p.phone}`);
            console.log(`   GST: ${p.gst_number || 'None'}`);
            console.log(`   Created: ${p.created_at}`);
            console.log(`   First Name: ${p.first_name || 'None'}`);
            console.log(`   Company: ${p.company || 'None'}`);
            console.log('');
        });

        if (profiles.length === 1) {
            console.log('✅ Only one profile exists, no merge needed');

            // Check if it needs @c.us suffix
            if (!profiles[0].phone.includes('@c.us')) {
                console.log('⚠️  Phone number missing @c.us suffix, adding it...');

                const { error: updateError } = await supabase
                    .from('customer_profiles')
                    .update({
                        phone: profiles[0].phone + '@c.us',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', profiles[0].id);

                if (updateError) {
                    throw updateError;
                }

                console.log('✅ Phone number updated to:', profiles[0].phone + '@c.us');
            }

            return;
        }

        // Find which profile to keep (one with @c.us)
        const keepProfile = profiles.find(p => p.phone.includes('@c.us'));
        const deleteProfile = profiles.find(p => !p.phone.includes('@c.us'));

        if (!keepProfile || !deleteProfile) {
            console.log('⚠️  Both profiles have or lack @c.us, manual review needed');
            return;
        }

        console.log('📝 Merge Plan:');
        console.log(`   KEEP: ${keepProfile.id} (${keepProfile.phone})`);
        console.log(`   DELETE: ${deleteProfile.id} (${deleteProfile.phone})`);
        console.log('');

        // Merge data from deleteProfile into keepProfile
        const mergedData = {
            gst_number: deleteProfile.gst_number || keepProfile.gst_number,
            first_name: deleteProfile.first_name || keepProfile.first_name,
            last_name: deleteProfile.last_name || keepProfile.last_name,
            company: deleteProfile.company || keepProfile.company,
            business_address: deleteProfile.business_address || keepProfile.business_address,
            business_verified: deleteProfile.business_verified || keepProfile.business_verified,
            onboarding_completed: deleteProfile.onboarding_completed || keepProfile.onboarding_completed,
            updated_at: new Date().toISOString()
        };

        console.log('📥 Merging data into keep profile...');
        console.log('   GST:', mergedData.gst_number || 'None');
        console.log('   Name:', mergedData.first_name, mergedData.last_name);
        console.log('   Company:', mergedData.company || 'None');
        console.log('');

        // Update the keep profile
        const { error: updateError } = await supabase
            .from('customer_profiles')
            .update(mergedData)
            .eq('id', keepProfile.id);

        if (updateError) {
            throw updateError;
        }

        console.log('✅ Keep profile updated successfully');

        // Check if delete profile has any related data
        console.log('🔍 Checking for related data in delete profile...');

        // Check business_info_extractions
        const { data: businessInfo, error: businessError } = await supabase
            .from('business_info_extractions')
            .select('id')
            .eq('customer_id', deleteProfile.id);

        if (!businessError && businessInfo && businessInfo.length > 0) {
            console.log(`   Found ${businessInfo.length} business_info_extraction(s), migrating...`);

            const { error: migrateError } = await supabase
                .from('business_info_extractions')
                .update({ customer_id: keepProfile.id })
                .eq('customer_id', deleteProfile.id);

            if (migrateError) {
                console.warn('   ⚠️  Error migrating business_info_extractions:', migrateError.message);
            } else {
                console.log('   ✅ Migrated business_info_extractions');
            }
        }

        // Check conversations
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('customer_phone', deleteProfile.phone);

        if (!convError && conversations && conversations.length > 0) {
            console.log(`   Found ${conversations.length} conversation(s), updating phone...`);

            const { error: updateConvError } = await supabase
                .from('conversations')
                .update({ customer_phone: keepProfile.phone })
                .eq('customer_phone', deleteProfile.phone);

            if (updateConvError) {
                console.warn('   ⚠️  Error updating conversations:', updateConvError.message);
            } else {
                console.log('   ✅ Updated conversations');
            }
        }

        // Now delete the duplicate profile
        console.log('');
        console.log('🗑️  Deleting duplicate profile...');

        const { error: deleteError } = await supabase
            .from('customer_profiles')
            .delete()
            .eq('id', deleteProfile.id);

        if (deleteError) {
            throw deleteError;
        }

        console.log('✅ Duplicate profile deleted');

        // Verify final state
        console.log('');
        console.log('🔍 Verifying final state...');

        const { data: finalProfile, error: finalError } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('id', keepProfile.id)
            .single();

        if (finalError) {
            throw finalError;
        }

        console.log('');
        console.log('✅ FINAL PROFILE:');
        console.log(`   ID: ${finalProfile.id}`);
        console.log(`   Phone: ${finalProfile.phone}`);
        console.log(`   GST: ${finalProfile.gst_number || 'None'}`);
        console.log(`   Name: ${finalProfile.first_name} ${finalProfile.last_name}`);
        console.log(`   Company: ${finalProfile.company || 'None'}`);
        console.log(`   Business Verified: ${finalProfile.business_verified}`);
        console.log('');
        console.log('🎉 Cleanup complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the fix
fixDuplicateCustomer().then(() => {
    console.log('');
    console.log('✅ Script completed successfully');
    process.exit(0);
});
