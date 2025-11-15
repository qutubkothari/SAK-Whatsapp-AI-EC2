#!/usr/bin/env node

/**
 * UPDATE CUSTOMER SHIPPING ADDRESS
 * 
 * Usage: node scripts/updateShippingAddress.js
 * 
 * This script updates the default shipping address for an existing customer
 */

const { supabase } = require('../config/database');

async function updateCustomerShipping() {
    try {
        // === CUSTOMER DETAILS ===
        const customerPhone = '919106886259@c.us';
        
        // === UPDATE THESE VALUES ===
        const shippingDetails = {
            default_shipping_address: 'C606, Hatimi Hills, Tilekarnagar',
            default_shipping_city: 'Pune',
            default_shipping_state: 'Maharashtra',
            default_shipping_pincode: '411048',
            default_transporter_name: 'VRL Logistics',
            updated_at: new Date().toISOString()
        };
        
        console.log('🔍 Finding customer:', customerPhone);
        
        // Get customer
        const { data: customer, error: findError } = await supabase
            .from('customer_profiles')
            .select('id, phone, company, first_name')
            .eq('phone', customerPhone)
            .single();
        
        if (findError) {
            throw new Error(`Customer not found: ${findError.message}`);
        }
        
        console.log('✅ Customer found:', {
            id: customer.id,
            name: customer.first_name,
            company: customer.company
        });
        
        console.log('\n📦 Updating shipping details...');
        
        // Update shipping details
        const { data: updated, error: updateError } = await supabase
            .from('customer_profiles')
            .update(shippingDetails)
            .eq('id', customer.id)
            .select()
            .single();
        
        if (updateError) {
            throw new Error(`Update failed: ${updateError.message}`);
        }
        
        console.log('\n✅ SUCCESS! Shipping details updated:\n');
        console.log('📍 Address:', updated.default_shipping_address);
        console.log('🏙️  City:', updated.default_shipping_city);
        console.log('🗺️  State:', updated.default_shipping_state);
        console.log('📮 Pincode:', updated.default_shipping_pincode);
        console.log('🚚 Transporter:', updated.default_transporter_name || 'Not set');
        
        console.log('\n🎯 Next Order:');
        console.log('   - System will automatically use these shipping details');
        console.log('   - Customer will see confirmation with option to update');
        console.log('   - Details will be added to Zoho Sales Order notes');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Run the update
console.log('🚀 Starting shipping address update...\n');
updateCustomerShipping();
