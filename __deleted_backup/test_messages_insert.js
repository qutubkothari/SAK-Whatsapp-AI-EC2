/**
 * Check the schema of the messages table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  try {
    console.log('Attempting to insert a test message...\n');
    
    const testData = {
      conversation_id: '1391fe3d-34d6-4048-a5a8-2f7e427aa7cc',
      tenant_id: 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6',
      message_body: 'TEST MESSAGE - IGNORE',
      sender: 'user',
      message_type: 'text',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('Error inserting message:',error);
      console.error('\nError details:');
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      console.error('Code:', error.code);
    } else {
      console.log('✅ Successfully inserted test message!');
      console.log('Data:', data);
      
      // Now delete it
      if (data && data[0]) {
        await supabase.from('messages').delete().eq('id', data[0].id);
        console.log('\n✅ Test message deleted');
      }
    }
    
  } catch (err) {
    console.error('Exception:', err);
  }
}

checkTableSchema();
