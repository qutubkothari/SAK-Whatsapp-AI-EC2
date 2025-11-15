// scripts/cleanup_duplicate_gst_profiles.js
// Clean up duplicate customer profiles created by GST uploads without @c.us suffix

const { supabase } = require('../config/database');

async function cleanupDuplicateProfiles() {
    try {
        console.log('🔍 Starting duplicate profile cleanup...\n');

        const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';

        // Get all customer profiles
        const { data: profiles, error } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Error fetching profiles:', error);
            return;
        }

        console.log(`📊 Total profiles found: ${profiles.length}\n`);

        // Group profiles by base phone number (without @c.us)
        const phoneGroups = {};
        profiles.forEach(profile => {
            const basePhone = profile.phone.replace('@c.us', '').replace(/\D/g, '');
            if (!phoneGroups[basePhone]) {
                phoneGroups[basePhone] = [];
            }
            phoneGroups[basePhone].push(profile);
        });

        // Find duplicates
        const duplicates = Object.entries(phoneGroups).filter(([phone, profiles]) => profiles.length > 1);

        if (duplicates.length === 0) {
            console.log('✅ No duplicates found!\n');
            return;
        }

        console.log(`🔍 Found ${duplicates.length} phone numbers with duplicates:\n`);

        for (const [basePhone, dupeProfiles] of duplicates) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`📱 Phone: ${basePhone}`);
            console.log(`📋 Found ${dupeProfiles.length} profiles:`);
            
            dupeProfiles.forEach((p, idx) => {
                console.log(`\n  [${idx + 1}] ID: ${p.id}`);
                console.log(`      Phone: ${p.phone}`);
                console.log(`      Created: ${p.created_at}`);
                console.log(`      GST: ${p.gst_number || 'None'}`);
                console.log(`      Company: ${p.company || 'None'}`);
                console.log(`      Business Verified: ${p.business_verified}`);
                console.log(`      Total Orders: ${p.total_orders}`);
                console.log(`      GST Preference: ${p.gst_preference || 'None'}`);
                console.log(`      Address: ${p.business_address || p.default_shipping_address || 'None'}`);
            });

            // Determine which profile to keep (prefer one with @c.us)
            const profileWithSuffix = dupeProfiles.find(p => p.phone.includes('@c.us'));
            const profileWithoutSuffix = dupeProfiles.find(p => !p.phone.includes('@c.us'));

            if (profileWithSuffix && profileWithoutSuffix) {
                console.log(`\n  ✅ KEEP: ${profileWithSuffix.phone} (has @c.us)`);
                console.log(`  ❌ DELETE: ${profileWithoutSuffix.phone} (no @c.us)`);

                // Merge data from duplicate to main profile
                const mergedData = {
                    // Take GST info from either profile
                    gst_number: profileWithSuffix.gst_number || profileWithoutSuffix.gst_number,
                    company: profileWithSuffix.company || profileWithoutSuffix.company,
                    business_address: profileWithSuffix.business_address || profileWithoutSuffix.business_address,
                    business_type: profileWithSuffix.business_type || profileWithoutSuffix.business_type,
                    business_verified: profileWithSuffix.business_verified || profileWithoutSuffix.business_verified,
                    
                    // Set GST preference to with_gst if GST number exists
                    gst_preference: (profileWithSuffix.gst_number || profileWithoutSuffix.gst_number) ? 'with_gst' : profileWithSuffix.gst_preference,
                    
                    // Keep shipping info
                    default_shipping_address: profileWithSuffix.default_shipping_address || profileWithoutSuffix.default_shipping_address,
                    default_shipping_city: profileWithSuffix.default_shipping_city || profileWithoutSuffix.default_shipping_city,
                    default_shipping_state: profileWithSuffix.default_shipping_state || profileWithoutSuffix.default_shipping_state,
                    default_shipping_pincode: profileWithSuffix.default_shipping_pincode || profileWithoutSuffix.default_shipping_pincode,
                    default_transporter_name: profileWithSuffix.default_transporter_name || profileWithoutSuffix.default_transporter_name,
                    default_transporter_contact: profileWithSuffix.default_transporter_contact || profileWithoutSuffix.default_transporter_contact,
                    
                    // Keep name info
                    first_name: profileWithSuffix.first_name || profileWithoutSuffix.first_name,
                    last_name: profileWithSuffix.last_name || profileWithoutSuffix.last_name,
                    
                    // Mark as onboarding completed if GST exists
                    onboarding_completed: (profileWithSuffix.gst_number || profileWithoutSuffix.gst_number) ? true : profileWithSuffix.onboarding_completed,
                    
                    updated_at: new Date().toISOString()
                };

                console.log(`\n  📝 Merged data to apply:`);
                console.log(`      GST Number: ${mergedData.gst_number || 'None'}`);
                console.log(`      Company: ${mergedData.company || 'None'}`);
                console.log(`      Business Address: ${mergedData.business_address || 'None'}`);
                console.log(`      GST Preference: ${mergedData.gst_preference || 'None'}`);
                console.log(`      Business Verified: ${mergedData.business_verified}`);
                console.log(`      Onboarding Completed: ${mergedData.onboarding_completed}`);

                // Update the profile with @c.us
                const { error: updateError } = await supabase
                    .from('customer_profiles')
                    .update(mergedData)
                    .eq('id', profileWithSuffix.id);

                if (updateError) {
                    console.error(`  ❌ Error updating profile: ${updateError.message}`);
                    continue;
                }

                console.log(`  ✅ Updated profile ${profileWithSuffix.id} with merged data`);

                // Delete the duplicate without @c.us
                const { error: deleteError } = await supabase
                    .from('customer_profiles')
                    .delete()
                    .eq('id', profileWithoutSuffix.id);

                if (deleteError) {
                    console.error(`  ❌ Error deleting duplicate: ${deleteError.message}`);
                } else {
                    console.log(`  ✅ Deleted duplicate profile ${profileWithoutSuffix.id}`);
                }
            } else if (dupeProfiles.length > 1) {
                // Multiple profiles with @c.us - keep the oldest with most data
                const sorted = dupeProfiles.sort((a, b) => {
                    // Prefer one with GST number
                    if (a.gst_number && !b.gst_number) return -1;
                    if (!a.gst_number && b.gst_number) return 1;
                    // Then prefer one with more orders
                    if (a.total_orders > b.total_orders) return -1;
                    if (a.total_orders < b.total_orders) return 1;
                    // Then prefer older
                    return new Date(a.created_at) - new Date(b.created_at);
                });

                const keep = sorted[0];
                const toDelete = sorted.slice(1);

                console.log(`\n  ✅ KEEP: ${keep.id} (${keep.phone})`);
                console.log(`  ❌ DELETE: ${toDelete.length} duplicate(s)`);

                // Merge all data into the keeper
                const allGSTNumbers = dupeProfiles.map(p => p.gst_number).filter(Boolean);
                const mergedData = {
                    gst_number: keep.gst_number || allGSTNumbers[0],
                    company: keep.company || dupeProfiles.find(p => p.company)?.company,
                    business_address: keep.business_address || dupeProfiles.find(p => p.business_address)?.business_address,
                    business_verified: keep.business_verified || dupeProfiles.some(p => p.business_verified),
                    gst_preference: (keep.gst_number || allGSTNumbers[0]) ? 'with_gst' : keep.gst_preference,
                    onboarding_completed: (keep.gst_number || allGSTNumbers[0]) ? true : keep.onboarding_completed,
                    updated_at: new Date().toISOString()
                };

                const { error: updateError } = await supabase
                    .from('customer_profiles')
                    .update(mergedData)
                    .eq('id', keep.id);

                if (updateError) {
                    console.error(`  ❌ Error updating profile: ${updateError.message}`);
                } else {
                    console.log(`  ✅ Updated keeper profile with merged data`);
                }

                // Delete the extras
                for (const dupe of toDelete) {
                    const { error: deleteError } = await supabase
                        .from('customer_profiles')
                        .delete()
                        .eq('id', dupe.id);

                    if (deleteError) {
                        console.error(`  ❌ Error deleting ${dupe.id}: ${deleteError.message}`);
                    } else {
                        console.log(`  ✅ Deleted duplicate ${dupe.id}`);
                    }
                }
            }
        }

        console.log(`\n${'='.repeat(80)}`);
        console.log('\n✅ Cleanup complete!\n');

        // Verify results
        console.log('📊 Verifying cleanup results...\n');
        const { data: finalProfiles } = await supabase
            .from('customer_profiles')
            .select('phone, gst_number, gst_preference, company')
            .eq('tenant_id', tenantId)
            .order('phone');

        console.log('Final customer profiles:');
        finalProfiles.forEach(p => {
            console.log(`  📱 ${p.phone}`);
            console.log(`     GST: ${p.gst_number || 'None'}`);
            console.log(`     Preference: ${p.gst_preference || 'None'}`);
            console.log(`     Company: ${p.company || 'None'}\n`);
        });

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    } finally {
        process.exit(0);
    }
}

// Run cleanup
cleanupDuplicateProfiles();
