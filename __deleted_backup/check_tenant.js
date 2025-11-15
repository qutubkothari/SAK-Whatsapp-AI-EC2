const { supabase } = require('../services/config');

(async () => {
  try {
    const bot = '918484830021';
    const { data, error } = await supabase.from('tenants').select('*').eq('bot_phone_number', bot).maybeSingle();
    console.log('TENANT_QUERY_FOUND:', !!data);
    if (error) console.error('TENANT_QUERY_ERROR:', error.message);
    if (data) console.log('TENANT_ID:', data.id, 'BOT:', data.bot_phone_number, 'BUSINESS:', data.business_name);
  } catch (e) {
    console.error('ERROR', e.message);
  }
})();
