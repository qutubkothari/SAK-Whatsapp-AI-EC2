/**
 * Run database migration to add customer_profile_id to orders table
 */
const { supabase } = require('./services/config');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🚀 Running migration: add customer_profile_id to orders...');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, 'database_migrations', '20251018_add_customer_profile_id_to_orders.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Migration SQL:', sql.substring(0, 200) + '...');
        
        // Execute the migration using Supabase RPC
        // Note: This requires a database function or direct SQL access
        // For now, we'll use the Supabase SQL editor or execute manually
        
        console.log('⚠️  Please run this migration manually in Supabase SQL Editor:');
        console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
        console.log('2. Copy and paste the SQL from:', migrationPath);
        console.log('3. Click "Run" to execute the migration');
        console.log('');
        console.log('Or run this SQL directly:');
        console.log('----------------------------------------');
        console.log(sql);
        console.log('----------------------------------------');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
