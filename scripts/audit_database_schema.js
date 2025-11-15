// Database Schema Audit Script
// Checks all phone-related columns and conversation states

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://pscjkegnbidbvzaaguqg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2prZWduYmlkYnZ6YWFndXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjY3Mzc3NSwiZXhwIjoyMDQyMjQ5Nzc1fQ.7tmRj2LrtgcV43t2BUIaQWNT3NAjcWIhx-mq1SG_cXE'
);

async function auditPhoneColumns() {
    console.log('\n=== PHONE COLUMN AUDIT ===\n');
    
    const tables = ['conversations', 'customer_profiles', 'carts', 'orders', 'cart_items'];
    
    for (const table of tables) {
        const { data, error } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', table)
            .like('column_name', '%phone%');
        
        console.log(`${table.toUpperCase()}:`);
        if (data && data.length > 0) {
            data.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
        } else {
            console.log('  No phone columns');
        }
        console.log('');
    }
}

async function auditConversationStates() {
    console.log('\n=== CONVERSATION STATES AUDIT ===\n');
    
    const { data: states } = await supabase
        .from('conversations')
        .select('state, count')
        .not('state', 'is', null);
    
    console.log('Current states in use:');
    if (states) {
        const stateCounts = {};
        states.forEach(s => {
            if (s.state) {
                stateCounts[s.state] = (stateCounts[s.state] || 0) + 1;
            }
        });
        Object.entries(stateCounts).forEach(([state, count]) => {
            console.log(`  - ${state}: ${count} conversations`);
        });
    }
}

async function auditCustomerProfiles() {
    console.log('\n=== CUSTOMER PROFILES AUDIT ===\n');
    
    const { data: profiles } = await supabase
        .from('customer_profiles')
        .select('phone, gst_preference')
        .limit(5);
    
    if (profiles && profiles.length > 0) {
        console.log('Sample profiles:');
        profiles.forEach(p => {
            console.log(`  Phone: ${p.phone}`);
            console.log(`    Format: ${p.phone.includes('@c.us') ? 'With @c.us' : 'Without @c.us'}`);
            console.log(`    GST Pref: ${p.gst_preference || 'null'}`);
        });
    }
    
    const { count: totalProfiles } = await supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true });
    
    const { count: withGST } = await supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true })
        .not('gst_preference', 'is', null);
    
    console.log(`\nTotal profiles: ${totalProfiles}`);
    console.log(`Profiles with GST preference: ${withGST}`);
}

async function runAudit() {
    try {
        await auditPhoneColumns();
        await auditConversationStates();
        await auditCustomerProfiles();
        console.log('\n=== AUDIT COMPLETE ===\n');
    } catch (error) {
        console.error('Audit error:', error.message);
    }
}

runAudit();
