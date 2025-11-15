// Script to find ALL duplicate phone numbers across customer_profiles
const { supabase } = require('../services/config');

async function findAllDuplicates() {
    console.log('\n=== SEARCHING FOR ALL DUPLICATE PHONE NUMBERS ===\n');

    try {
        const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';

        // Get all profiles for this tenant
        const { data: profiles, error } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('phone');

        if (error) {
            console.error('Error fetching profiles:', error);
            return;
        }

        console.log(`Total profiles: ${profiles.length}\n`);

        // Group by phone number (normalized - remove @c.us for comparison)
        const phoneGroups = {};

        profiles.forEach(profile => {
            // Normalize: remove @c.us suffix for grouping
            const normalizedPhone = profile.phone.replace(/@c\.us$/i, '');

            if (!phoneGroups[normalizedPhone]) {
                phoneGroups[normalizedPhone] = [];
            }

            phoneGroups[normalizedPhone].push(profile);
        });

        // Find duplicates (phone number exists in multiple forms)
        const duplicates = Object.entries(phoneGroups).filter(([phone, profiles]) => profiles.length > 1);

        if (duplicates.length === 0) {
            console.log('✅ No duplicates found! All phone numbers are unique.\n');
            return;
        }

        console.log(`⚠️  Found ${duplicates.length} duplicate phone number(s):\n`);

        duplicates.forEach(([basePhone, profiles]) => {
            console.log(`\n========================================`);
            console.log(`📞 BASE PHONE: ${basePhone}`);
            console.log(`   Duplicate count: ${profiles.length}`);
            console.log(`========================================\n`);

            profiles.forEach((p, idx) => {
                console.log(`  Profile ${idx + 1}:`);
                console.log(`    ID: ${p.id}`);
                console.log(`    Phone: ${p.phone}`);
                console.log(`    GST Number: ${p.gst_number || 'NULL'}`);
                console.log(`    GST Pref: ${p.gst_preference || 'NULL'}`);
                console.log(`    Created: ${p.created_at}`);
                console.log('');
            });

            // Recommend which to keep
            const withSuffix = profiles.find(p => p.phone.endsWith('@c.us'));
            const withoutSuffix = profiles.find(p => !p.phone.endsWith('@c.us'));

            if (withSuffix && withoutSuffix) {
                console.log(`  ✅ RECOMMENDATION:`);
                console.log(`     KEEP: ${withSuffix.phone} (ID: ${withSuffix.id})`);
                console.log(`     DELETE: ${withoutSuffix.phone} (ID: ${withoutSuffix.id})`);
                console.log(`     MERGE GST: ${withoutSuffix.gst_number || 'none'} → ${withSuffix.phone}`);
            }
        });

        console.log('\n========================================\n');
        console.log('To fix a specific duplicate, run:');
        console.log('  node scripts/fix_duplicate_customer_[PHONE].js\n');

    } catch (error) {
        console.error('\n=== ERROR ===');
        console.error(error);
    }
}

findAllDuplicates()
    .then(() => {
        console.log('=== SEARCH COMPLETE ===\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('Search failed:', error);
        process.exit(1);
    });
