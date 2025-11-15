// routes/handlers/modules/intentHandler.js
// Handles intent recognition and processing logic

const { recognizeIntent } = require('../../../services/intentRecognitionService');
const { analyzeConversationContext } = require('../../../services/aiConversationContextService');

async function processIntentAndContext(userQuery, tenant, from, conversation) {
    console.log('[INTENT_HANDLER] Processing intent and context');

    // Build intent context
    const intentContext = {
        tenantId: tenant.id,
        phoneNumber: from,
        conversationId: conversation?.id,
        hasActiveCart: false, // Will be checked later if needed
        lastMessage: userQuery,
        conversationHistory: conversation?.messages || []
    };

    // Recognize intent
    console.log('[INTENT_HANDLER] Recognizing intent...');
    const intentResult = await recognizeIntent(userQuery, intentContext);
    console.log('[INTENT_HANDLER] Intent recognized:', intentResult?.intent, 'Confidence:', intentResult?.confidence);

    // Analyze conversation context if needed
    let conversationContext = null;
    if (conversation) {
        console.log('[INTENT_HANDLER] Analyzing conversation context...');
        // Pass tenant ID and phone for cart context awareness
        conversationContext = await analyzeConversationContext(userQuery, conversation?.messages || [], conversation, tenant.id, from);
    }

    return {
        intentResult,
        conversationContext
    };
}

module.exports = {
    processIntentAndContext
};