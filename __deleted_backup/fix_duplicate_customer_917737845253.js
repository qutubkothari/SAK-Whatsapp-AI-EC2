// Script to fix duplicate customer profile for 917737845253
// Merges data and deletes duplicate profile without @c.us suffix

const { supabase } = require('../services/config');

async function fixDuplicateCustomer917737845253() {
    const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
    const phoneWithSuffix = '917737835253@c.us';  // CORRECTED: 835 not 845
    const phoneWithoutSuffix = '917737835253';    // CORRECTED: 835 not 845

    console.log('\n=== FIXING DUPLICATE CUSTOMER PROFILE ===');
    console.log('Phone (with @c.us):', phoneWithSuffix);
    console.log('Phone (without @c.us):', phoneWithoutSuffix);

    try {
        // Step 1: Fetch both profiles
        console.log('\n[STEP 1] Fetching both profiles...');

        const { data: profiles, error: fetchError } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .in('phone', [phoneWithSuffix, phoneWithoutSuffix])
            .order('created_at', { ascending: true });

        if (fetchError) {
            console.error('Error fetching profiles:', fetchError);
            return;
        }

        if (!profiles || profiles.length === 0) {
            console.log('No profiles found');
            return;
        }

        console.log(`Found ${profiles.length} profile(s):`);
        profiles.forEach(p => {
            console.log(`  - ID: ${p.id}`);
            console.log(`    Phone: ${p.phone}`);
            console.log(`    GST Number: ${p.gst_number || 'NULL'}`);
            console.log(`    GST Preference: ${p.gst_preference || 'NULL'}`);
            console.log(`    Created: ${p.created_at}`);
        });

        if (profiles.length === 1) {
            console.log('\nOnly one profile exists. No duplicates to merge.');
            return;
        }

        // Determine which profile to keep and which to delete
        const keepProfile = profiles.find(p => p.phone === phoneWithSuffix) || profiles[0];
        const deleteProfile = profiles.find(p => p.phone !== phoneWithSuffix && p.id !== keepProfile.id);

        if (!deleteProfile) {
            console.log('\nNo duplicate profile found');
            return;
        }

        console.log('\n[STEP 2] Merging data...');
        console.log('KEEP:', keepProfile.phone, '(ID:', keepProfile.id, ')');
        console.log('DELETE:', deleteProfile.phone, '(ID:', deleteProfile.id, ')');

        // Merge data: take non-null values from either profile
        const mergedData = {
            gst_number: keepProfile.gst_number || deleteProfile.gst_number,
            gst_preference: keepProfile.gst_preference || deleteProfile.gst_preference,
            updated_at: new Date().toISOString()
        };

        console.log('Merged data:', mergedData);

        // Update keep profile with merged data
        const { error: updateError } = await supabase
            .from('customer_profiles')
            .update(mergedData)
            .eq('id', keepProfile.id);

        if (updateError) {
            console.error('Error updating keep profile:', updateError);
            return;
        }

        console.log('✅ Keep profile updated with merged data');

        // Step 3: Migrate related records
        console.log('\n[STEP 3] Migrating related records...');

        // Migrate business_info_extractions
        const { data: businessInfos, error: bizError } = await supabase
            .from('business_info_extractions')
            .select('id')
            .eq('customer_profile_id', deleteProfile.id);

        if (businessInfos && businessInfos.length > 0) {
            console.log(`Found ${businessInfos.length} business_info_extractions to migrate`);

            const { error: bizMigrateError } = await supabase
                .from('business_info_extractions')
                .update({ customer_profile_id: keepProfile.id })
                .eq('customer_profile_id', deleteProfile.id);

            if (bizMigrateError) {
                console.error('Error migrating business_info_extractions:', bizMigrateError);
            } else {
                console.log('✅ Migrated business_info_extractions');
            }
        }

        // Migrate conversations
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('customer_profile_id', deleteProfile.id);

        if (conversations && conversations.length > 0) {
            console.log(`Found ${conversations.length} conversations to migrate`);

            const { error: convMigrateError } = await supabase
                .from('conversations')
                .update({ customer_profile_id: keepProfile.id })
                .eq('customer_profile_id', deleteProfile.id);

            if (convMigrateError) {
                console.error('Error migrating conversations:', convMigrateError);
            } else {
                console.log('✅ Migrated conversations');
            }
        }

        // Step 4: Delete duplicate profile
        console.log('\n[STEP 4] Deleting duplicate profile...');

        const { error: deleteError } = await supabase
            .from('customer_profiles')
            .delete()
            .eq('id', deleteProfile.id);

        if (deleteError) {
            console.error('Error deleting duplicate profile:', deleteError);
            return;
        }

        console.log('✅ Duplicate profile deleted');

        // Step 5: Verify final state
        console.log('\n[STEP 5] Verifying final state...');

        const { data: finalProfile, error: finalError } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('id', keepProfile.id)
            .single();

        if (finalError) {
            console.error('Error fetching final profile:', finalError);
            return;
        }

        console.log('\n✅ FINAL MERGED PROFILE:');
        console.log('  ID:', finalProfile.id);
        console.log('  Phone:', finalProfile.phone);
        console.log('  GST Number:', finalProfile.gst_number || 'NULL');
        console.log('  GST Preference:', finalProfile.gst_preference || 'NULL');

        console.log('\n=== SUCCESS! Duplicate profile fixed ===\n');

    } catch (error) {
        console.error('\n=== ERROR ===');
        console.error(error);
    }
}

// Run the script
fixDuplicateCustomer917737845253()
    .then(() => {
        console.log('Script completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
