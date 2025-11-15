const { supabase } = require('./services/config');

async function deleteAllCustomerProfiles() {
  const { error } = await supabase.from('customer_profiles').delete().not('id', 'is', null);
  if (error) {
    console.error('Error deleting all customer_profiles:', error);
  } else {
    console.log('✅ All customer_profiles deleted from the database.');
  }
}

deleteAllCustomerProfiles();
