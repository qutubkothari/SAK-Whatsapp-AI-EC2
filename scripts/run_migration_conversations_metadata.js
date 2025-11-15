/**
 * Run database migration to add metadata column to conversations table
 * Usage: node scripts/run_migration_conversations_metadata.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
    console.log('[MIGRATION] Starting conversations metadata migration...');
    
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'migrations', 'add_conversations_metadata.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('[MIGRATION] Executing SQL...');
        
        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
        
        if (error) {
            console.error('[MIGRATION] ❌ Error:', error);
            
            // If exec_sql doesn't exist, try direct approach
            console.log('[MIGRATION] Trying alternative approach...');
            
            // Split into individual statements
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
            
            for (const statement of statements) {
                if (statement.toLowerCase().includes('do $$')) {
                    console.log('[MIGRATION] ⚠️  Cannot execute DO block via REST API');
                    console.log('[MIGRATION] Please run this migration manually in Supabase SQL Editor:');
                    console.log('\n' + migrationSQL + '\n');
                    return;
                }
            }
        } else {
            console.log('[MIGRATION] ✅ Migration completed successfully');
            console.log('[MIGRATION] Data:', data);
        }
        
    } catch (error) {
        console.error('[MIGRATION] ❌ Fatal error:', error);
        console.log('\n[MIGRATION] Please run this migration manually in Supabase SQL Editor:');
        const migrationPath = path.join(__dirname, '..', 'migrations', 'add_conversations_metadata.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log('\n' + migrationSQL + '\n');
    }
}

runMigration().then(() => {
    console.log('[MIGRATION] Script completed');
    process.exit(0);
}).catch(error => {
    console.error('[MIGRATION] Script failed:', error);
    process.exit(1);
});
