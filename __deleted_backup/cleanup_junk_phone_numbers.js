/**
 * Cleanup Script: Remove customer profiles with junk/invalid phone numbers
 * These are records created with UUID-based phone numbers due to the bug
 */

const { supabase } = require('../services/config');

// Junk phone numbers to delete (from the data you provided)
const JUNK_PHONE_NUMBERS = [
    '64090874199863303476',      // idx 5 - UUID-derived junk
    '62560640329231861',          // idx 6 - UUID-derived junk
    '31289941589743874',          // idx 2 - UUID-derived junk
];

// Additional criteria: phone numbers that are suspiciously long (likely UUIDs)
const SUSPICIOUS_PHONE_LENGTH = 17; // Normal phone with country code is 12-15 digits max

async function findJunkRecords() {
    console.log('🔍 Searching for junk phone number records...\n');

    try {
        // Find records with exact junk numbers
        const { data: exactMatches, error: exactError } = await supabase
            .from('customer_profiles')
            .select('id, phone, first_name, last_name, company, gst_number, created_at, total_orders')
            .in('phone', JUNK_PHONE_NUMBERS);

        if (exactError) {
            console.error('❌ Error finding exact matches:', exactError.message);
            return { exactMatches: [], suspiciousMatches: [] };
        }

        // Find records with suspiciously long phone numbers
        const { data: allRecords, error: allError } = await supabase
            .from('customer_profiles')
            .select('id, phone, first_name, last_name, company, gst_number, created_at, total_orders');

        if (allError) {
            console.error('❌ Error fetching all records:', allError.message);
            return { exactMatches: exactMatches || [], suspiciousMatches: [] };
        }

        // Filter for suspicious phone numbers
        const suspiciousMatches = allRecords.filter(record => {
            const phone = (record.phone || '').toString().replace(/\D/g, ''); // Remove non-digits
            return phone.length >= SUSPICIOUS_PHONE_LENGTH && 
                   !JUNK_PHONE_NUMBERS.includes(record.phone); // Not already in junk list
        });

        return { 
            exactMatches: exactMatches || [], 
            suspiciousMatches: suspiciousMatches || [] 
        };

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        return { exactMatches: [], suspiciousMatches: [] };
    }
}

async function displayRecordsForReview(exactMatches, suspiciousMatches) {
    console.log('📋 Records Found:\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (exactMatches.length > 0) {
        console.log('🎯 EXACT JUNK MATCHES (Known Bad Phone Numbers):');
        console.log('───────────────────────────────────────────────────────────────\n');
        exactMatches.forEach((record, idx) => {
            console.log(`${idx + 1}. ID: ${record.id}`);
            console.log(`   Phone: ${record.phone}`);
            console.log(`   Name: ${record.first_name || 'N/A'} ${record.last_name || ''}`);
            console.log(`   Company: ${record.company || 'N/A'}`);
            console.log(`   GST: ${record.gst_number || 'N/A'}`);
            console.log(`   Created: ${record.created_at}`);
            console.log(`   Total Orders: ${record.total_orders || 0}`);
            console.log('');
        });
    }

    if (suspiciousMatches.length > 0) {
        console.log('\n⚠️  SUSPICIOUS MATCHES (Unusually Long Phone Numbers):');
        console.log('───────────────────────────────────────────────────────────────\n');
        suspiciousMatches.forEach((record, idx) => {
            const phoneDigits = (record.phone || '').toString().replace(/\D/g, '');
            console.log(`${idx + 1}. ID: ${record.id}`);
            console.log(`   Phone: ${record.phone} (${phoneDigits.length} digits)`);
            console.log(`   Name: ${record.first_name || 'N/A'} ${record.last_name || ''}`);
            console.log(`   Company: ${record.company || 'N/A'}`);
            console.log(`   GST: ${record.gst_number || 'N/A'}`);
            console.log(`   Created: ${record.created_at}`);
            console.log(`   Total Orders: ${record.total_orders || 0}`);
            console.log('');
        });
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`Total Exact Matches: ${exactMatches.length}`);
    console.log(`Total Suspicious Matches: ${suspiciousMatches.length}`);
    console.log(`Total Records to Delete: ${exactMatches.length + suspiciousMatches.length}\n`);
}

async function deleteRecords(recordsToDelete, dryRun = true) {
    if (recordsToDelete.length === 0) {
        console.log('✅ No records to delete!\n');
        return { success: true, deletedCount: 0 };
    }

    const recordIds = recordsToDelete.map(r => r.id);

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No records will be deleted');
        console.log('   The following record IDs would be deleted:');
        recordIds.forEach(id => console.log(`   - ${id}`));
        console.log('\n💡 To actually delete these records, run with --execute flag\n');
        return { success: true, deletedCount: 0, dryRun: true };
    }

    console.log('⚠️  WARNING: About to DELETE these records permanently!');
    console.log('   Press Ctrl+C in the next 5 seconds to cancel...\n');
    
    // Wait 5 seconds for user to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Deleting records...\n');

    try {
        const { error, count } = await supabase
            .from('customer_profiles')
            .delete()
            .in('id', recordIds);

        if (error) {
            console.error('❌ Delete failed:', error.message);
            return { success: false, error: error.message };
        }

        console.log(`✅ Successfully deleted ${recordIds.length} records!\n`);
        return { success: true, deletedCount: recordIds.length };

    } catch (error) {
        console.error('❌ Unexpected error during delete:', error.message);
        return { success: false, error: error.message };
    }
}

async function checkForDuplicateGST(records) {
    console.log('\n🔍 Checking for duplicate GST numbers...\n');

    const gstNumbers = records
        .filter(r => r.gst_number)
        .map(r => r.gst_number);

    if (gstNumbers.length === 0) {
        console.log('   No GST numbers found in records to delete.\n');
        return;
    }

    try {
        const { data: duplicates, error } = await supabase
            .from('customer_profiles')
            .select('id, phone, gst_number, first_name, last_name, company, total_orders')
            .in('gst_number', gstNumbers)
            .not('id', 'in', `(${records.map(r => r.id).join(',')})`); // Exclude records we're deleting

        if (error) {
            console.error('   ⚠️  Error checking duplicates:', error.message);
            return;
        }

        if (duplicates && duplicates.length > 0) {
            console.log('   ⚠️  FOUND DUPLICATE GST NUMBERS - These will remain after cleanup:');
            console.log('   ───────────────────────────────────────────────────────────────\n');
            duplicates.forEach(dup => {
                console.log(`   GST: ${dup.gst_number}`);
                console.log(`   Phone: ${dup.phone}`);
                console.log(`   Name: ${dup.first_name || 'N/A'} ${dup.last_name || ''}`);
                console.log(`   Company: ${dup.company || 'N/A'}`);
                console.log(`   Total Orders: ${dup.total_orders || 0}`);
                console.log('');
            });
        } else {
            console.log('   ✅ No duplicate GST numbers found - safe to delete.\n');
        }

    } catch (error) {
        console.error('   ⚠️  Error checking duplicates:', error.message);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const executeMode = args.includes('--execute');

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║    Customer Profile Cleanup - Junk Phone Numbers             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    if (executeMode) {
        console.log('⚠️  EXECUTE MODE - Records WILL be deleted!\n');
    } else {
        console.log('🔍 DRY RUN MODE - No records will be deleted\n');
    }

    // Step 1: Find junk records
    const { exactMatches, suspiciousMatches } = await findJunkRecords();
    const allRecordsToDelete = [...exactMatches, ...suspiciousMatches];

    if (allRecordsToDelete.length === 0) {
        console.log('✅ No junk records found! Database is clean.\n');
        return;
    }

    // Step 2: Display records for review
    await displayRecordsForReview(exactMatches, suspiciousMatches);

    // Step 3: Check for duplicate GST numbers
    await checkForDuplicateGST(allRecordsToDelete);

    // Step 4: Delete records (or dry run)
    const result = await deleteRecords(allRecordsToDelete, !executeMode);

    if (result.success && !result.dryRun) {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ CLEANUP COMPLETE!');
        console.log(`   ${result.deletedCount} junk records have been removed.`);
        console.log('═══════════════════════════════════════════════════════════════\n');
    }
}

// Run the script
main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
});
