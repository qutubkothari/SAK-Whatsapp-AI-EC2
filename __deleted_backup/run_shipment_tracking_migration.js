const { supabase } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runShipmentTrackingMigration() {
  try {
    console.log('🚀 Running shipment tracking migration: add order_id to shipment_tracking...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'database_migrations', 'add_order_id_to_shipment_tracking.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:', sql.substring(0, 200) + '...');

    // Execute the migration using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.log('⚠️  RPC not available, please run this migration manually in Supabase SQL Editor:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy and paste the SQL from:', migrationPath);
      console.log('\nSQL Content:');
      console.log('='.repeat(50));
      console.log(sql);
      console.log('='.repeat(50));
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 Result:', data);

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('\n⚠️  Please run this migration manually in Supabase SQL Editor:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste the SQL from: database_migrations/add_order_id_to_shipment_tracking.sql');
  }
}

runShipmentTrackingMigration()
  .then(() => {
    console.log('\n✨ Migration check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });