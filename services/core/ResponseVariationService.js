/**
 * ResponseVariationService - Natural, Human-like Response Variation
 * 
 * Humans don't repeat the same phrase every time. This service:
 * 1. Varies responses naturally based on context
 * 2. Tracks recent responses to avoid repetition
 * 3. Adjusts tone based on conversation history
 * 4. Uses appropriate empathy and acknowledgment
 * 
 * @module services/core/ResponseVariationService
 */

class ResponseVariationService {
    constructor() {
        // Cache recent responses per conversation to avoid repetition
        this.recentResponses = new Map();
    }
    
    /**
     * Get a varied response for a given scenario
     * @param {string} scenarioType - Type of response (greeting, error, success, etc.)
     * @param {Object} context - Context for personalization
     * @returns {string} Natural, varied response
     */
    getResponse(scenarioType, context = {}) {
        const { conversationId, retryCount = 0, userName, previousResponse } = context;
        
        // Get response pool for this scenario
        const responsePool = this.getResponsePool(scenarioType, context);
        
        if (!responsePool || responsePool.length === 0) {
            return this.getDefaultResponse(scenarioType);
        }
        
        // Get responses we've used recently in this conversation
        const recentlyUsed = this.getRecentlyUsed(conversationId, scenarioType);
        
        // Filter out recently used responses
        let availableResponses = responsePool.filter(r => !recentlyUsed.includes(r));
        
        // If all have been used, reset and use full pool
        if (availableResponses.length === 0) {
            availableResponses = responsePool;
            this.clearRecentlyUsed(conversationId, scenarioType);
        }
        
        // Select based on retry count if applicable
        let selectedResponse;
        if (retryCount < availableResponses.length) {
            selectedResponse = availableResponses[retryCount];
        } else {
            // Random selection for variety
            selectedResponse = availableResponses[Math.floor(Math.random() * availableResponses.length)];
        }
        
        // Personalize with user name if available
        if (userName) {
            selectedResponse = selectedResponse.replace('{name}', userName);
        }
        
        // Track this response
        this.trackResponse(conversationId, scenarioType, selectedResponse);
        
        return selectedResponse;
    }
    
    /**
     * Get response pool for specific scenario
     */
    getResponsePool(scenarioType, context) {
        const pools = {
            // Greeting variations
            'greeting': [
                'Hello! How can I help you today?',
                'Hi there! What can I do for you?',
                'Hey! Looking for something specific?',
                'Welcome! How may I assist you?'
            ],
            
            'greeting_returning': [
                'Welcome back! Ready to place another order?',
                'Good to see you again! What can I help you with?',
                'Hi again! How can I help you today?'
            ],
            
            // Error acknowledgments (varying by retry count)
            'error_acknowledgment': [
                "Hmm, that didn't work as expected. Let me help you.",
                "I ran into a small issue there. Let's try a different way.",
                "Something went wrong on my end. Let me fix that for you.",
                "That's not quite right. Don't worry, we'll get it sorted."
            ],
            
            'error_acknowledgment_repeat': [
                "I see this is still not working. Let me try a different approach.",
                "I understand this is frustrating. Let's solve this together.",
                "This is taking longer than expected. I appreciate your patience.",
                "I'm working on figuring this out. Thanks for bearing with me."
            ],
            
            // Success variations
            'cart_add_success': [
                '✅ Added to cart!',
                '✅ Got it! Added to your cart.',
                '✅ Done! That\'s in your cart now.',
                '✅ Perfect! I\'ve added that for you.'
            ],
            
            'order_success': [
                '🎉 Order confirmed! You should receive it soon.',
                '✅ All set! Your order is on its way.',
                '🎉 Order placed successfully! We\'ll keep you updated.',
                '✅ Perfect! Your order has been confirmed.'
            ],
            
            // Clarification requests
            'need_clarification': [
                "I'm not quite sure what you mean. Could you clarify?",
                "Can you help me understand what you'd like to do?",
                "I want to make sure I get this right - could you explain a bit more?",
                "Just to be clear, what would you like me to do?"
            ],
            
            // Product not found
            'product_not_found': [
                `I couldn't find that product. Could you try a different name?`,
                `Hmm, I don't see that in our catalog. Want to try another search?`,
                `I don't have that product listed. Would you like to browse the catalog?`,
                `That one's not showing up. Let me help you find something similar.`
            ],
            
            // Waiting/processing
            'processing': [
                '⏳ Just a moment...',
                '⏳ Working on it...',
                '⏳ Give me a second...',
                '⏳ Processing...'
            ],
            
            // Checkout prompts
            'checkout_ready': [
                'Your cart is ready! Would you like to checkout?',
                'All set! Ready to place your order?',
                'Looking good! Shall we proceed to checkout?',
                'Perfect! Want to confirm and place this order?'
            ],
            
            // Thank you variations
            'thank_you': [
                'You\'re welcome! Happy to help.',
                'My pleasure! Let me know if you need anything else.',
                'Glad I could help!',
                'Anytime! Feel free to reach out if you need more.'
            ],
            
            // Goodbye variations
            'goodbye': [
                'Take care! Feel free to message anytime.',
                'Have a great day! I\'m here if you need anything.',
                'Thanks for shopping with us! See you soon.',
                'Goodbye! Looking forward to serving you again.'
            ]
        };
        
        return pools[scenarioType] || [];
    }
    
    /**
     * Get default response if no pool exists
     */
    getDefaultResponse(scenarioType) {
        const defaults = {
            'greeting': 'Hello! How can I help you?',
            'error': 'Something went wrong. Please try again.',
            'success': 'Done!',
            'thank_you': 'You\'re welcome!',
            'goodbye': 'Goodbye!'
        };
        
        return defaults[scenarioType] || 'How can I help you?';
    }
    
    /**
     * Get recently used responses for this conversation
     */
    getRecentlyUsed(conversationId, scenarioType) {
        if (!conversationId) return [];
        
        const key = `${conversationId}_${scenarioType}`;
        return this.recentResponses.get(key) || [];
    }
    
    /**
     * Track response as used
     */
    trackResponse(conversationId, scenarioType, response) {
        if (!conversationId) return;
        
        const key = `${conversationId}_${scenarioType}`;
        const recent = this.recentResponses.get(key) || [];
        
        // Keep only last 3 responses
        recent.unshift(response);
        if (recent.length > 3) {
            recent.pop();
        }
        
        this.recentResponses.set(key, recent);
        
        // Clean up old entries (older than 1 hour)
        this.cleanupOldEntries();
    }
    
    /**
     * Clear recently used for this scenario (allows reuse)
     */
    clearRecentlyUsed(conversationId, scenarioType) {
        if (!conversationId) return;
        const key = `${conversationId}_${scenarioType}`;
        this.recentResponses.delete(key);
    }
    
    /**
     * Clean up old conversation entries from cache
     */
    cleanupOldEntries() {
        // Simple cleanup: if cache gets too large, clear it
        if (this.recentResponses.size > 1000) {
            console.log('[ResponseVariation] Cleaning up cache');
            this.recentResponses.clear();
        }
    }
    
    /**
     * Adjust tone based on conversation sentiment
     * @param {string} baseResponse - Base response text
     * @param {Object} sentimentContext - Sentiment analysis context
     * @returns {string} Tone-adjusted response
     */
    adjustTone(baseResponse, sentimentContext = {}) {
        const { sentiment = 'neutral', frustrationLevel = 0 } = sentimentContext;
        
        let adjusted = baseResponse;
        
        // Add empathy for frustrated users
        if (frustrationLevel > 0.5 || sentiment === 'negative') {
            const empathyPhrases = [
                "I understand this is frustrating. ",
                "I know this isn't ideal. ",
                "I appreciate your patience. ",
                "Thank you for bearing with me. "
            ];
            
            const empathy = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
            adjusted = empathy + adjusted;
        }
        
        // Add enthusiasm for positive interactions
        if (sentiment === 'positive') {
            // Replace periods with exclamation marks (but not too many)
            adjusted = adjusted.replace(/\.$/, '!');
        }
        
        return adjusted;
    }
    
    /**
     * Create a contextual response combining template and personalization
     * @param {string} templateKey - Response template identifier
     * @param {Object} data - Data to inject into template
     * @param {Object} context - Conversation context
     * @returns {string} Personalized response
     */
    createContextualResponse(templateKey, data = {}, context = {}) {
        const templates = {
            'product_added': [
                '✅ Added {quantity} {productName} to your cart! Total: ₹{total}',
                '✅ Got it! {quantity} {productName} added. Cart total: ₹{total}',
                '✅ Done! Your cart now has {quantity} {productName}. Total: ₹{total}'
            ],
            
            'cart_summary': [
                '🛒 Your cart:\n{items}\n\nTotal: ₹{total}\n\nReady to checkout?',
                '🛒 Here\'s what you have:\n{items}\n\nTotal: ₹{total}\n\nWould you like to place this order?',
                '🛒 Cart contents:\n{items}\n\nTotal: ₹{total}\n\nShall we proceed?'
            ],
            
            'gst_verified': [
                '✅ GST verified!\n\nBusiness: {businessName}\nGST: {gstNumber}\n\nProceeding to checkout...',
                '✅ Great! Your GST is verified.\n\nCompany: {businessName}\nGST: {gstNumber}\n\nLet\'s complete your order.',
                '✅ GST confirmed!\n\n{businessName}\nGST: {gstNumber}\n\nReady to checkout?'
            ]
        };
        
        const pool = templates[templateKey];
        if (!pool) return '';
        
        // Select variation
        const template = this.getResponse(templateKey, context) || pool[0];
        
        // Replace placeholders
        let response = template;
        Object.keys(data).forEach(key => {
            response = response.replace(new RegExp(`{${key}}`, 'g'), data[key]);
        });
        
        return response;
    }
}

module.exports = new ResponseVariationService();
