const aiIntegration = require('./aiIntegrationService');

/**
 * Helper functions to integrate AI into existing handlers
 */
class AIHandlerHelper {
  /**
   * Check if we should use AI for this message
   */
  async shouldUseAI(intent, customerTier, messageComplexity = 'medium') {
    // Always use rules for simple intents
    const simpleIntents = ['greeting', 'confirmation', 'order_status'];
    if (simpleIntents.includes(intent)) {
      return false;
    }

    // VIP customers get AI
    if (customerTier === 'VIP') {
      return true;
    }

    // Complex messages get AI
    if (messageComplexity === 'high') {
      return true;
    }

    // Default: use rules
    return false;
  }

  /**
   * Process message and decide routing
   */
  async processAndRoute(phoneNumber, message, tenantId) {
    try {
      const result = await aiIntegration.processMessage(phoneNumber, message, tenantId);

      return {
        action: result.action,
        intent: result.intent,
        response: result.response,
        shouldUseRules: result.action === 'use_rules',
        shouldTransferHuman: result.action === 'transfer_to_human',
        aiResponse: result.action === 'ai_response' ? result.response : null
      };

    } catch (error) {
      console.error('Error in AI routing:', error);
      return {
        action: 'use_rules',
        shouldUseRules: true,
        error: error.message
      };
    }
  }

  /**
   * Check order for anomalies and get suggestions
   */
  async checkOrderAndSuggest(customerProfileId, orderItems) {
    try {
      const anomalies = await aiIntegration.checkOrderAnomalies(customerProfileId, orderItems);

      if (anomalies.hasAnomalies && anomalies.suggestions) {
        return {
          hasSuggestions: true,
          message: anomalies.suggestions,
          missingProducts: anomalies.missingProducts,
          quantityAnomalies: anomalies.quantityAnomalies
        };
      }

      return { hasSuggestions: false };

    } catch (error) {
      console.error('Error checking order:', error);
      return { hasSuggestions: false };
    }
  }

  /**
   * Generate AI response (force AI mode)
   */
  async forceAIResponse(phoneNumber, message, tenantId, options = {}) {
    try {
      const result = await aiIntegration.processMessage(
        phoneNumber, 
        message, 
        tenantId,
        { forceAI: true, ...options }
      );

      return result.response || null;

    } catch (error) {
      console.error('Error generating AI response:', error);
      return null;
    }
  }
}

module.exports = new AIHandlerHelper();