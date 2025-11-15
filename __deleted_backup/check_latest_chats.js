// Script: check_latest_chats.js
// Description: Prints the latest conversations and their most recent messages for a given tenant.
// Usage: node check_latest_chats.js <tenant_id> [limit]

const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const tenantId = process.argv[2];
  const limit = parseInt(process.argv[3], 10) || 10;
  if (!tenantId) {
    console.error('Usage: node check_latest_chats.js <tenant_id> [limit]');
    process.exit(1);
  }

  // Fetch latest conversations
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, end_user_phone, updated_at, created_at, state, last_message_at')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (convError) {
    console.error('Error fetching conversations:', convError.message);
    process.exit(1);
  }

  for (const conv of conversations) {
    console.log('---');
    console.log('Conversation ID:', conv.id);
    console.log('Phone:', conv.end_user_phone);
    console.log('Updated:', conv.updated_at);
    console.log('Created:', conv.created_at);
    console.log('State:', conv.state);
    console.log('Last message at:', conv.last_message_at);
    // Fetch latest message for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, message_body, sender, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (msgError) {
      console.error('  Error fetching messages:', msgError.message);
    } else if (messages.length > 0) {
      const msg = messages[0];
      console.log('  Latest message:', msg.message_body);
      console.log('  Sender:', msg.sender);
      console.log('  Sent at:', msg.created_at);
    } else {
      console.log('  No messages found for this conversation.');
    }
  }
}

main();
