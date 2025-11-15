/**
 * Check messages from today for a conversation
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTodayMessages(conversationId) {
  try {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
    console.log(`Fetching messages from ${today} for conversation ${conversationId}...\n`);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No messages found from today for this conversation.');
      return;
    }
    
    console.log(`Found ${data.length} messages from today:\n`);
    
    data.forEach((msg, index) => {
      console.log(`---`);
      console.log(`${index + 1}. Message ID: ${msg.id}`);
      console.log(`Sender: ${msg.sender}`);
      console.log(`Body: ${msg.message_body}`);
      console.log(`Created: ${msg.created_at}`);
      console.log(`Type: ${msg.message_type}`);
    });
    
  } catch (err) {
    console.error('Exception:', err);
  }
}

const conversationId = process.argv[2];

if (!conversationId) {
  console.error('Usage: node check_today_messages.js <conversation_id>');
  process.exit(1);
}

checkTodayMessages(conversationId);
