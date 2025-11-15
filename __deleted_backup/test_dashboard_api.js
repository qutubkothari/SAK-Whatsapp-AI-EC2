// Quick test to check dashboard API endpoints
const { supabase } = require('./services/config');

const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';

async function testEndpoints() {
    console.log('Testing Dashboard API endpoints...\n');
    
    // Test products
    console.log('1. Testing products...');
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, product_code, name, description, base_price, stock_quantity')
            .eq('tenant_id', tenantId)
            .order('name', { ascending: true })
            .limit(100);
        
        if (error) {
            console.error('❌ Products error:', error);
        } else {
            console.log('✅ Products:', products?.length || 0, 'found');
        }
    } catch (e) {
        console.error('❌ Products exception:', e.message);
    }
    
    // Test conversations
    console.log('\n2. Testing conversations...');
    try {
        const { data: customers, error } = await supabase
            .from('customer_profiles')
            .select('id, phone, first_name, last_name, company, conversation_state, updated_at')
            .eq('tenant_id', tenantId)
            .not('conversation_state', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('❌ Conversations error:', error);
        } else {
            console.log('✅ Conversations:', customers?.length || 0, 'found');
        }
    } catch (e) {
        console.error('❌ Conversations exception:', e.message);
    }
    
    // Test orders
    console.log('\n3. Testing orders...');
    try {
        const { data: orders, error } = await supabase
            .from('sales_orders')
            .select('id, customer_id, total_amount, status, created_at')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('❌ Orders error:', error);
        } else {
            console.log('✅ Orders:', orders?.length || 0, 'found');
            if (orders && orders.length > 0) {
                console.log('   First order:', orders[0]);
            }
        }
    } catch (e) {
        console.error('❌ Orders exception:', e.message);
    }
    
    // Test tenant
    console.log('\n4. Testing tenant...');
    try {
        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, business_name, admin_phones, created_at')
            .eq('id', tenantId)
            .single();
        
        if (error) {
            console.error('❌ Tenant error:', error);
        } else {
            console.log('✅ Tenant found:', tenant?.business_name);
        }
    } catch (e) {
        console.error('❌ Tenant exception:', e.message);
    }
    
    process.exit(0);
}

testEndpoints();
