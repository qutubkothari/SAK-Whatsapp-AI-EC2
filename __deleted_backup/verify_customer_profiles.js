/**
 * Verify cleanup: Check remaining customer profiles
 */

const { supabase } = require('../services/config');

async function verifyCleanup() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║    Verification: Customer Profiles After Cleanup              ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        // Get all customer profiles
        const { data: profiles, error } = await supabase
            .from('customer_profiles')
            .select('id, phone, first_name, last_name, company, gst_number, total_orders, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching profiles:', error.message);
            return;
        }

        console.log(`📊 Total Customer Profiles: ${profiles.length}\n`);
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Analyze phone number formats
        const phoneAnalysis = {
            withAtCUS: 0,
            withPlus: 0,
            digitsOnly: 0,
            suspicious: 0,
            valid: 0
        };

        const suspiciousRecords = [];

        profiles.forEach(profile => {
            const phone = (profile.phone || '').toString();
            const digitsOnly = phone.replace(/\D/g, '');

            if (phone.includes('@c.us')) {
                phoneAnalysis.withAtCUS++;
                phoneAnalysis.valid++;
            } else if (phone.includes('+')) {
                phoneAnalysis.withPlus++;
                phoneAnalysis.valid++;
            } else if (digitsOnly.length >= 17) {
                phoneAnalysis.suspicious++;
                suspiciousRecords.push(profile);
            } else if (digitsOnly.length >= 10) {
                phoneAnalysis.digitsOnly++;
                phoneAnalysis.valid++;
            }
        });

        console.log('📱 Phone Number Format Analysis:');
        console.log('───────────────────────────────────────────────────────────────\n');
        console.log(`  ✅ Valid WhatsApp Format (@c.us): ${phoneAnalysis.withAtCUS}`);
        console.log(`  ✅ Valid International (+): ${phoneAnalysis.withPlus}`);
        console.log(`  ✅ Valid Digits Only: ${phoneAnalysis.digitsOnly}`);
        console.log(`  ⚠️  Suspicious (17+ digits): ${phoneAnalysis.suspicious}`);
        console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`  Total Valid: ${phoneAnalysis.valid}/${profiles.length}\n`);

        if (suspiciousRecords.length > 0) {
            console.log('⚠️  SUSPICIOUS RECORDS FOUND:\n');
            suspiciousRecords.forEach((record, idx) => {
                console.log(`${idx + 1}. ID: ${record.id}`);
                console.log(`   Phone: ${record.phone}`);
                console.log(`   Name: ${record.first_name || 'N/A'} ${record.last_name || ''}`);
                console.log(`   Company: ${record.company || 'N/A'}`);
                console.log(`   GST: ${record.gst_number || 'N/A'}`);
                console.log(`   Total Orders: ${record.total_orders || 0}`);
                console.log('');
            });
        }

        // Check for duplicate GST numbers
        const gstMap = new Map();
        profiles.forEach(profile => {
            if (profile.gst_number) {
                if (!gstMap.has(profile.gst_number)) {
                    gstMap.set(profile.gst_number, []);
                }
                gstMap.get(profile.gst_number).push(profile);
            }
        });

        const duplicateGST = Array.from(gstMap.entries()).filter(([_, records]) => records.length > 1);

        if (duplicateGST.length > 0) {
            console.log('\n⚠️  DUPLICATE GST NUMBERS FOUND:\n');
            duplicateGST.forEach(([gstNumber, records]) => {
                console.log(`  GST: ${gstNumber} (${records.length} records)`);
                records.forEach(record => {
                    console.log(`    - Phone: ${record.phone} | Orders: ${record.total_orders}`);
                });
                console.log('');
            });
        } else {
            console.log('✅ No duplicate GST numbers found!\n');
        }

        console.log('═══════════════════════════════════════════════════════════════');
        console.log(suspiciousRecords.length === 0 && duplicateGST.length === 0 
            ? '✅ DATABASE IS CLEAN!' 
            : '⚠️  Issues found - review above');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('💥 Verification failed:', error.message);
    }
}

verifyCleanup().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
});
