/**
 * Emergency script to clear GST loop for stuck users
 * Usage: node scripts/clearGSTLoop.js <phone_number>
 */

const { supabase } = require('../services/config');

async function clearGSTLoop(phoneNumber) {
  if (!phoneNumber) {
    console.error('❌ Please provide a phone number');
    console.log('Usage: node scripts/clearGSTLoop.js <phone_number>');
    process.exit(1);
  }

  console.log(`🔄 Clearing GST loop for: ${phoneNumber}`);

  try {
    // Get all tenants (we'll need to find which tenant this user belongs to)
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id');

    if (tenantError) {
      console.error('❌ Error fetching tenants:', tenantError.message);
      return;
    }

    let foundConversation = null;
    let tenantId = null;

    // Find the conversation across all tenants
    for (const tenant of tenants) {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, state, context_data, tenant_id')
        .eq('tenant_id', tenant.id)
        .eq('end_user_phone', phoneNumber)
        .single();

      if (conversation && !convError) {
        foundConversation = conversation;
        tenantId = tenant.id;
        console.log(`✅ Found conversation in tenant: ${tenant.id}`);
        break;
      }
    }

    if (!foundConversation) {
      console.log('❌ No conversation found for this phone number');
      return;
    }

    console.log(`📊 Current state: ${foundConversation.state}`);

    // Clear the GST loop state
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        state: null,
        context_data: null
      })
      .eq('tenant_id', tenantId)
      .eq('end_user_phone', phoneNumber);

    if (updateError) {
      console.error('❌ Error clearing GST loop:', updateError.message);
      return;
    }

    // Also update customer profile to mark as completed
    const { error: profileError } = await supabase
      .from('customer_profiles')
      .update({
        onboarding_completed: true,
        business_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('phone', phoneNumber);

    if (profileError) {
      console.warn('⚠️  Warning: Could not update customer profile:', profileError.message);
    }

    console.log('✅ GST loop cleared successfully!');
    console.log('✅ User can now interact normally');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Get phone number from command line arguments
const phoneNumber = process.argv[2];
clearGSTLoop(phoneNumber);