/**
 * Test inserting without tenant_id
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    console.log('Test 1: Inserting WITHOUT tenant_id...\n');
    
    const testData = {
      conversation_id: '1391fe3d-34d6-4048-a5a8-2f7e427aa7cc',
      body: 'TEST MESSAGE - IGNORE',
      sender: 'user',
      message_type: 'text',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Inserted message:');
      console.log('ID:', data[0].id);
      console.log('Body:', data[0].body);
      console.log('Created:', data[0].created_at);
      
      // Delete the test message
      await supabase.from('messages').delete().eq('id', data[0].id);
      console.log('\n✅ Test message deleted');
    }
    
  } catch (err) {
    console.error('Exception:', err);
  }
}

testInsert();
