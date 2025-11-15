/**
 * Check actual schema by querying existing messages
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Fetching one message to see actual schema...\n');
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Found message. Columns:');
      console.log(Object.keys(data[0]));
      console.log('\nSample message:');
      console.log(JSON.stringify(data[0], null, 2));
    }
    
  } catch (err) {
    console.error('Exception:', err);
  }
}

checkSchema();
