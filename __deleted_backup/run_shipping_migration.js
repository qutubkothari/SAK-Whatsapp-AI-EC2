const fs = require('fs');
const path = require('path');

// Read the shipping fields migration
const migrationPath = path.join(__dirname, 'database_migrations', '20251018_add_shipping_fields_to_customer_profiles.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

console.log('==================================================');
console.log('CRITICAL MIGRATION: Add shipping fields to customer_profiles');
console.log('==================================================\n');
console.log(migration);
console.log('\n==================================================');
console.log('INSTRUCTIONS:');
console.log('1. Copy the SQL above');
console.log('2. Go to Supabase Dashboard > SQL Editor');
console.log('3. Paste and run the SQL');
console.log('4. After this migration, Zoho sales orders will work!');
console.log('==================================================');
