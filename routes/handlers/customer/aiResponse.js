// // Final AI fallback and smart response logic
const { sendMessage } = require('../../../services/whatsappService');

async function getFallbackAIResponse(tenant, userQuery, userLanguage, customerProfile, conversation, res) {
  try {
    console.log('[AI_RESPONSE] Generating fallback response for:', userQuery);
    
    // Simple greeting/fallback response
    const firstName = customerProfile?.first_name || 'there';
    const greeting = `Hello ${firstName}! 👋\n\nHow can I help you today?\n\n📋 You can:\n• Browse products\n• Place an order\n• Check order status\n• Get product information`;
    
    await sendMessage(conversation.end_user_phone || customerProfile.phone, greeting);
    console.log('[AI_RESPONSE] Fallback response sent');
    
    return res.status(200).json({ ok: true, type: 'ai_fallback_response' });
    
  } catch (error) {
    console.error('[AI_RESPONSE] Error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = {
  getFallbackAIResponse
};
