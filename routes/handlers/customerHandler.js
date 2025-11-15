// Modular customer handler: delegates all logic to mainHandler.js
const { handleCustomerMessage } = require('./modules/mainHandler');

const handleCustomer = async (req, res) => {
    const { message, tenant } = req;
    const from = message.from;
    let userQuery = '';
    if (message && message.text && typeof message.text.body === 'string') {
        userQuery = message.text.body.trim();
    } else if (typeof message === 'string') {
        userQuery = message.trim();
    } else {
        userQuery = '';
    }
    let conversation = null;
    const { supabase } = require('../../services/config');
    
    try {
        // Fetch latest conversation context
        const { data: conversationData, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('end_user_phone', from)
            .single();
        
        if (conversationData) {
            conversation = conversationData;
        } else if (error && error.code === 'PGRST116') {
            // No conversation found, create a new one
            console.log('[CUSTOMER_HANDLER] No conversation found, creating new one for:', from);
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    tenant_id: tenant.id,
                    end_user_phone: from,
                    state: 'IDLE',
                    metadata: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_message_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (newConv) {
                conversation = newConv;
                console.log('[CUSTOMER_HANDLER] Created new conversation:', newConv.id);
            } else {
                console.error('[CUSTOMER_HANDLER] Failed to create conversation:', createError);
            }
        }
    } catch (e) {
        console.error('[CUSTOMER_HANDLER] Error fetching/creating conversation:', e);
        conversation = null;
    }
    
    return await handleCustomerMessage(req, res, tenant, from, userQuery, conversation);
};

module.exports = {
    handleCustomer
};
