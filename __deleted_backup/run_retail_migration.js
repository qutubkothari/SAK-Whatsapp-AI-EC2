/**
 * Script to verify retail customer tracking migration
 * Checks if customer_source, retail_visit_count, last_retail_visit, first_contact_date fields exist
 */

require('dotenv').config();
const { supabase } = require('../services/config');
const fs = require('fs');
const path = require('path');

async function verifyMigration() {
  try {
    console.log('🔄 Verifying retail customer tracking schema...\n');

    // Try to query the new fields
    console.log('🔍 Checking if new columns exist in customer_profiles...');
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('customer_profiles')
      .select('id, phone, customer_source, retail_visit_count, last_retail_visit, first_contact_date')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message);

      if (schemaError.message.includes('column') && schemaError.message.includes('does not exist')) {
        console.log('\n⚠️  MIGRATION NOT APPLIED YET!\n');
        console.log('The required columns do not exist in the database.');
        console.log('\n📋 TO FIX THIS:');
        console.log('─────────────────────────────────────────────');
        console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to "SQL Editor" in the left menu');
        console.log('4. Click "New Query"');
        console.log('5. Copy the contents of:');
        console.log('   database_migrations/20251023_add_retail_customer_tracking.sql');
        console.log('6. Paste into the SQL editor');
        console.log('7. Click "Run" to execute');
        console.log('8. Run this script again to verify\n');
        console.log('─────────────────────────────────────────────');
        return false;
      } else {
        throw schemaError;
      }
    }

    console.log('✅ All columns exist in customer_profiles table!\n');
    console.log('Schema verified:');
    console.log('  ✓ customer_source');
    console.log('  ✓ retail_visit_count');
    console.log('  ✓ last_retail_visit');
    console.log('  ✓ first_contact_date\n');

    // Check if any retail customers exist
    console.log('📊 Checking for retail customers...');
    const { data: retailCustomers, error: countError } = await supabase
      .from('customer_profiles')
      .select('id, phone, customer_source, retail_visit_count, last_retail_visit')
      .eq('customer_source', 'retail_counter')
      .order('last_retail_visit', { ascending: false })
      .limit(10);

    if (countError) {
      console.log('⚠️  Could not query retail customers:', countError.message);
    } else {
      console.log(`\n📈 Total retail customers found: ${retailCustomers?.length || 0}`);

      if (retailCustomers && retailCustomers.length > 0) {
        console.log('\n🛍️  Recent retail customers:');
        console.log('─────────────────────────────────────────────');
        retailCustomers.forEach((c, i) => {
          const visitDate = c.last_retail_visit ? new Date(c.last_retail_visit).toLocaleString() : 'N/A';
          console.log(`${i + 1}. ${c.phone}`);
          console.log(`   Visits: ${c.retail_visit_count || 0} | Last visit: ${visitDate}`);
        });
        console.log('─────────────────────────────────────────────');
      } else {
        console.log('\n💡 No retail customers captured yet.');
        console.log('   Test the QR code: https://wa.me/918484830021?text=CONNECT_RETAIL_CUSTOMER');
      }
    }

    // Check if orders table has new fields
    console.log('\n🔍 Checking orders table for retail fields...');
    const { data: ordersCheck, error: ordersError } = await supabase
      .from('orders')
      .select('id, bill_number, source')
      .limit(1);

    if (ordersError && ordersError.message.includes('column') && ordersError.message.includes('does not exist')) {
      console.log('⚠️  Orders table migration incomplete (bill_number/source columns missing)');
      console.log('   This is optional for basic retail capture functionality.');
    } else if (ordersError) {
      console.log('⚠️  Could not verify orders table:', ordersError.message);
    } else {
      console.log('✅ Orders table has retail tracking fields (bill_number, source)');
    }

    return true;

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\nFull error:', error);
    return false;
  }
}

// Run verification
console.log('═══════════════════════════════════════════════════════════');
console.log('🎯 RETAIL CUSTOMER TRACKING - SCHEMA VERIFICATION');
console.log('═══════════════════════════════════════════════════════════\n');

verifyMigration().then(success => {
  if (success) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ VERIFICATION SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n🎉 Your retail customer capture system is ready!');
    console.log('\n📱 Test QR Link:');
    console.log('   https://wa.me/918484830021?text=CONNECT_RETAIL_CUSTOMER\n');
    process.exit(0);
  } else {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('⚠️  MIGRATION REQUIRED');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}).catch(err => {
  console.error('💥 FATAL ERROR:', err);
  process.exit(1);
});
