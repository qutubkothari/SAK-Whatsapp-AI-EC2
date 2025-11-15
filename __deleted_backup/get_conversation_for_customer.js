const { supabase } = require('../services/config');

(async () => {
  try {
    const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
    const phone = '919106886259';
    const { data, error } = await supabase.from('conversations').select('*').eq('tenant_id', tenantId).eq('end_user_phone', phone).maybeSingle();
    if (error) console.error('ERROR', error.message);
    console.log('CONV:', !!data);
    if (data) console.log('STATE', data.state, 'LAST_QUOTED', data.last_quoted_products ? data.last_quoted_products.slice(0,200) : null);
  } catch (e) {
    console.error('ERR', e.message);
  }
})();
