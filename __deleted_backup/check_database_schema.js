// Check database schema for all tables
const { supabase } = require('./services/config');

async function checkSchema() {
    console.log('='.repeat(80));
    console.log('DATABASE SCHEMA CHECK');
    console.log('='.repeat(80));
    
    const tables = ['customer_profiles', 'products', 'orders', 'tenants'];
    
    for (const table of tables) {
        console.log(`\n📋 Table: ${table}`);
        console.log('-'.repeat(80));
        
        try {
            // Get first row to see all columns
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.error(`❌ Error querying ${table}:`, error.message);
                continue;
            }
            
            if (!data || data.length === 0) {
                console.log(`⚠️  Table is empty, trying to get columns anyway...`);
                
                // Try with specific tenant_id if available
                const { data: data2, error: error2 } = await supabase
                    .from(table)
                    .select('*')
                    .eq('tenant_id', 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6')
                    .limit(1);
                
                if (data2 && data2.length > 0) {
                    console.log('✅ Columns found:');
                    Object.keys(data2[0]).forEach(col => {
                        console.log(`   - ${col}: ${typeof data2[0][col]}`);
                    });
                } else {
                    console.log('⚠️  No data found in table');
                }
            } else {
                console.log('✅ Columns found:');
                Object.keys(data[0]).forEach(col => {
                    const value = data[0][col];
                    const type = value === null ? 'null' : typeof value;
                    console.log(`   - ${col}: ${type}`);
                });
            }
            
        } catch (e) {
            console.error(`❌ Exception for ${table}:`, e.message);
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('SCHEMA CHECK COMPLETE');
    console.log('='.repeat(80));
    
    process.exit(0);
}

checkSchema();
