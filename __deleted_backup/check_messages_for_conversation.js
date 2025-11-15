// Script: check_messages_for_conversation.js
// Description: Prints all messages for a specific conversation.
// Usage: node check_messages_for_conversation.js <conversation_id>

const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const conversationId = process.argv[2];
  if (!conversationId) {
    console.error('Usage: node check_messages_for_conversation.js <conversation_id>');
    process.exit(1);
  }

  // Fetch all messages for this conversation
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching messages:', error.message);
    process.exit(1);
  }

  console.log(`\nFound ${messages.length} messages for conversation ${conversationId}:\n`);
  
  for (const msg of messages) {
    console.log('---');
    console.log('Message ID:', msg.id);
    console.log('Sender:', msg.sender);
    console.log('Body:', msg.message_body);
    console.log('Created:', msg.created_at);
    console.log('Type:', msg.message_type);
  }
}

main();
