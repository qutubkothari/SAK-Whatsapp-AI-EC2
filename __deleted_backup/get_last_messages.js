const { supabase } = require('../services/config');

(async ()=>{
  try {
    const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
    const phone = '919106886259';
    const { data: conv } = await supabase.from('conversations').select('id').eq('tenant_id', tenantId).eq('end_user_phone', phone).maybeSingle();
    if (!conv) return console.log('no conv');
    const { data: msgs } = await supabase.from('messages').select('sender,message_body,created_at').eq('conversation_id', conv.id).order('created_at', {ascending:false}).limit(10);
    console.log('Found', msgs?.length || 0, 'messages');
    msgs.forEach(m => console.log(m.created_at, m.sender, m.message_body));
  } catch (e) { console.error(e.message); }
})();
