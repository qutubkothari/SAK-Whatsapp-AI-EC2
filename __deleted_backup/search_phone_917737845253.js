// Script to search for phone numbers containing 917737845253
const { supabase } = require('../services/config');

async function searchPhone() {
    const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
    const searchPattern = '917737845253';

    console.log('\n=== SEARCHING FOR PHONE: 917737845253 ===\n');

    try {
        // Search for any phone containing this pattern
        const { data: profiles, error } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .or(`phone.like.%${searchPattern}%`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error searching profiles:', error);
            return;
        }

        if (!profiles || profiles.length === 0) {
            console.log('❌ No profiles found for:', searchPattern);

            // Try searching without tenant filter
            console.log('\nSearching across all tenants...');
            const { data: allProfiles, error: allError } = await supabase
                .from('customer_profiles')
                .select('*')
                .or(`phone.like.%${searchPattern}%`)
                .order('created_at', { ascending: false });

            if (allProfiles && allProfiles.length > 0) {
                console.log(`\nFound ${allProfiles.length} profile(s) in OTHER tenants:`);
                allProfiles.forEach(p => {
                    console.log(`\n  Tenant: ${p.tenant_id}`);
                    console.log(`  ID: ${p.id}`);
                    console.log(`  Phone: ${p.phone}`);
                    console.log(`  Name: ${p.name || 'NULL'}`);
                    console.log(`  GST: ${p.gst_number || 'NULL'}`);
                    console.log(`  GST Pref: ${p.gst_preference || 'NULL'}`);
                    console.log(`  Created: ${p.created_at}`);
                });
            } else {
                console.log('No profiles found across all tenants either.');
            }
            return;
        }

        console.log(`✅ Found ${profiles.length} profile(s):\n`);

        profiles.forEach((p, idx) => {
            console.log(`Profile ${idx + 1}:`);
            console.log(`  ID: ${p.id}`);
            console.log(`  Phone: ${p.phone}`);
            console.log(`  Name: ${p.name || 'NULL'}`);
            console.log(`  Company: ${p.company_name || 'NULL'}`);
            console.log(`  GST Number: ${p.gst_number || 'NULL'}`);
            console.log(`  GST Preference: ${p.gst_preference || 'NULL'}`);
            console.log(`  Created: ${p.created_at}`);
            console.log(`  Updated: ${p.updated_at}`);
            console.log('');
        });

        // Check for duplicates
        const phoneNumbers = profiles.map(p => p.phone);
        const uniquePhones = new Set(phoneNumbers);

        if (phoneNumbers.length !== uniquePhones.size) {
            console.log('⚠️  DUPLICATES DETECTED!');
        } else {
            console.log('✅ No duplicates - all phone numbers are unique');
        }

    } catch (error) {
        console.error('\n=== ERROR ===');
        console.error(error);
    }
}

searchPhone()
    .then(() => {
        console.log('\n=== SEARCH COMPLETE ===\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('Search failed:', error);
        process.exit(1);
    });
