require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Use Supabase instead of direct PostgreSQL
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Export a pool-like interface for compatibility
module.exports = {
  query: async (text, params) => {
    // Parse SQL to get table name (basic implementation)
    // This is a simplified adapter - you may need to enhance it
    console.log('Query:', text, params);
    throw new Error('Direct SQL queries not supported with Supabase. Use supabase client instead.');
  },
  supabase: supabase
};