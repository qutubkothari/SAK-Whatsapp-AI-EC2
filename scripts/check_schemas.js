// Direct Table Schema Check
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://pscjkegnbidbvzaaguqg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY2prZWduYmlkYnZ6YWFndXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjY3Mzc3NSwiZXhwIjoyMDQyMjQ5Nzc1fQ.7tmRj2LrtgcV43t2BUIaQWNT3NAjcWIhx-mq1SG_cXE'
);

async function checkSchemas() {
    console.log('\n=== CONVERSATIONS TABLE ===');
    const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .limit(1);
    if (conv && conv[0]) {
        console.log('Columns:', Object.keys(conv[0]).filter(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('customer') || k === 'state').join(', '));
    }
    if (convErr) console.log('Error:', convErr.message);

    console.log('\n=== CUSTOMER_PROFILES TABLE ===');
    const { data: prof, error: profErr } = await supabase
        .from('customer_profiles')
        .select('*')
        .limit(1);
    if (prof && prof[0]) {
        console.log('Columns:', Object.keys(prof[0]).filter(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('gst')).join(', '));
        console.log('Sample phone format:', prof[0].phone);
    }
    if (profErr) console.log('Error:', profErr.message);

    console.log('\n=== CARTS TABLE ===');
    const { data: cart, error: cartErr } = await supabase
        .from('carts')
        .select('*')
        .limit(1);
    if (cart && cart[0]) {
        console.log('Columns:', Object.keys(cart[0]).join(', '));
    }
    if (cartErr) console.log('Error:', cartErr.message);

    console.log('\n=== CONVERSATION STATES ===');
    const { data: states } = await supabase
        .from('conversations')
        .select('state')
        .not('state', 'is', null)
        .limit(20);
    if (states) {
        const uniqueStates = [...new Set(states.map(s => s.state))];
        console.log('Unique states:', uniqueStates.join(', '));
    }

    console.log('\n=== PHONE FORMAT CHECK ===');
    const { data: profiles } = await supabase
        .from('customer_profiles')
        .select('phone')
        .limit(10);
    if (profiles) {
        console.log('Sample phone formats:');
        profiles.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.phone} (${p.phone.includes('@c.us') ? 'with @c.us' : 'WITHOUT @c.us'})`);
        });
    }
}

checkSchemas();
