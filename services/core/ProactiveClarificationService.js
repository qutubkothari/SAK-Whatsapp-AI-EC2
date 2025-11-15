/**
 * ProactiveClarificationService - Ask Smart Questions Instead of Guessing
 * 
 * When AI confidence is low or ambiguous input detected, this service:
 * 1. Identifies what's ambiguous or unclear
 * 2. Asks specific clarifying questions
 * 3. Provides helpful examples
 * 4. Guides users toward successful completion
 * 
 * @module services/core/ProactiveClarificationService
 */

const { openai } = require('../config');

class ProactiveClarificationService {
    
    /**
     * Analyze input and determine if clarification is needed
     * @param {Object} context - Input context
     * @param {string} context.userInput - What user said
     * @param {Object} context.intent - Intent classification result
     * @param {Object} context.entities - Extracted entities
     * @param {Object} context.conversationState - Current state
     * @param {Array} context.recentMessages - Recent conversation history
     * @returns {Promise<Object>} Clarification response or null if not needed
     */
    async analyzeAndClarify(context) {
        const { userInput, intent, entities, conversationState, recentMessages } = context;
        
        console.log('[ProactiveClarification] Analyzing input:', {
            userInput,
            intentConfidence: intent?.confidence,
            entitiesFound: Object.keys(entities || {}).length
        });
        
        // Determine if we need clarification
        const needsClarification = this.needsClarification(intent, entities, conversationState);
        
        if (!needsClarification) {
            return null;
        }
        
        // Generate specific clarifying question based on context
        const clarification = await this.generateClarification(context);
        
        return clarification;
    }
    
    /**
     * Check if input needs clarification
     */
    needsClarification(intent, entities, conversationState) {
        // Low confidence intent
        if (intent && intent.confidence < 0.6) {
            return true;
        }
        
        // Ambiguous quantity (like "some", "a few", "many")
        if (entities?.quantity && this.isAmbiguousQuantity(entities.quantity)) {
            return true;
        }
        
        // Multiple possible products mentioned
        if (entities?.products && entities.products.length > 1) {
            return true;
        }
        
        // Incomplete information for current state
        if (conversationState?.state === 'AWAITING_PRODUCT' && !entities?.product) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if quantity is ambiguous
     */
    isAmbiguousQuantity(quantity) {
        const ambiguousTerms = ['some', 'few', 'many', 'several', 'lot', 'bunch', 'couple'];
        const qtyStr = String(quantity).toLowerCase();
        return ambiguousTerms.some(term => qtyStr.includes(term));
    }
    
    /**
     * Generate contextual clarifying question
     */
    async generateClarification(context) {
        const { userInput, intent, entities, conversationState, recentMessages } = context;
        
        // Build context for AI
        const conversationContext = recentMessages
            .slice(-3)
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');
        
        const prompt = `You are a helpful sales assistant. A customer said: "${userInput}"

Recent conversation:
${conversationContext}

Current state: ${conversationState?.state || 'INITIAL'}
Intent detected: ${intent?.intent || 'unclear'} (confidence: ${intent?.confidence || 0})
Entities found: ${JSON.stringify(entities)}

The input is ambiguous or unclear. Generate a clarifying question that:
1. Is specific and actionable
2. Provides examples
3. Helps the customer succeed
4. Sounds natural and friendly
5. Offers clear options when possible

Respond with ONLY the clarifying question text, nothing else.`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful sales assistant who asks clear, specific clarifying questions.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 200
            });
            
            const clarifyingQuestion = response.choices[0].message.content.trim();
            
            console.log('[ProactiveClarification] Generated question:', clarifyingQuestion);
            
            return {
                needsClarification: true,
                question: clarifyingQuestion,
                suggestedResponses: this.generateSuggestedResponses(intent, entities),
                originalIntent: intent
            };
            
        } catch (error) {
            console.error('[ProactiveClarification] AI generation failed:', error);
            
            // Fallback to template-based clarification
            return this.getFallbackClarification(context);
        }
    }
    
    /**
     * Generate suggested response options
     */
    generateSuggestedResponses(intent, entities) {
        const suggestions = [];
        
        // Quantity clarification
        if (entities?.quantity && this.isAmbiguousQuantity(entities.quantity)) {
            suggestions.push('5 pieces', '10 boxes', '20 cartons');
        }
        
        // Product clarification
        if (entities?.products && entities.products.length > 1) {
            suggestions.push(...entities.products.slice(0, 3).map(p => p.name));
        }
        
        // Intent clarification
        if (!intent || intent.confidence < 0.5) {
            suggestions.push('Add to cart', 'Check price', 'View catalog');
        }
        
        return suggestions;
    }
    
    /**
     * Fallback clarification when AI fails
     */
    getFallbackClarification(context) {
        const { userInput, intent, entities, conversationState } = context;
        
        let question = '';
        let suggestions = [];
        
        // Ambiguous quantity
        if (entities?.quantity && this.isAmbiguousQuantity(entities.quantity)) {
            question = `I understand you want ${entities.quantity}, but could you specify the exact quantity?\n\n` +
                      `For example: "5 pieces" or "10 boxes"`;
            suggestions = ['5 pieces', '10 boxes', '20 cartons'];
        }
        // Multiple products
        else if (entities?.products && entities.products.length > 1) {
            question = `I found multiple products. Which one did you mean?\n\n` +
                      entities.products.slice(0, 3).map((p, i) => `${i + 1}. ${p.name}`).join('\n') +
                      `\n\nReply with the number or product name.`;
            suggestions = entities.products.slice(0, 3).map(p => p.name);
        }
        // Unclear intent
        else if (!intent || intent.confidence < 0.5) {
            question = `I want to help, but I'm not sure what you'd like to do.\n\n` +
                      `Would you like to:\n` +
                      `1. Add a product to cart\n` +
                      `2. Check product prices\n` +
                      `3. View your cart\n` +
                      `4. Place an order`;
            suggestions = ['Add product', 'Check prices', 'View cart', 'Place order'];
        }
        // Generic clarification
        else {
            question = `Could you please clarify what you'd like me to do?\n\n` +
                      `For example:\n` +
                      `• "Add 5 Paper Cups to cart"\n` +
                      `• "Show me the catalog"\n` +
                      `• "What's the price of Tissue Box?"`;
            suggestions = ['Add to cart', 'Show catalog', 'Check price'];
        }
        
        return {
            needsClarification: true,
            question,
            suggestedResponses: suggestions,
            originalIntent: intent
        };
    }
    
    /**
     * Handle clarification response from user
     * @param {string} userResponse - User's response to clarification
     * @param {Object} originalContext - Original ambiguous context
     * @returns {Promise<Object>} Resolved intent and entities
     */
    async resolveClarification(userResponse, originalContext) {
        console.log('[ProactiveClarification] Resolving clarification:', userResponse);
        
        // Check if user selected a suggested option
        const selectedOption = this.matchSuggestedOption(
            userResponse,
            originalContext.suggestedResponses
        );
        
        if (selectedOption) {
            console.log('[ProactiveClarification] Matched suggested option:', selectedOption);
            return {
                resolved: true,
                selectedOption,
                intent: originalContext.originalIntent,
                clarifiedInput: selectedOption
            };
        }
        
        // Otherwise, treat as new input and re-classify
        return {
            resolved: true,
            clarifiedInput: userResponse,
            requiresReprocessing: true
        };
    }
    
    /**
     * Match user response to suggested options
     */
    matchSuggestedOption(userResponse, suggestions) {
        if (!suggestions || suggestions.length === 0) return null;
        
        const normalized = userResponse.toLowerCase().trim();
        
        // Check for number selection (1, 2, 3)
        const numberMatch = normalized.match(/^(\d+)$/);
        if (numberMatch) {
            const index = parseInt(numberMatch[1]) - 1;
            if (index >= 0 && index < suggestions.length) {
                return suggestions[index];
            }
        }
        
        // Check for fuzzy match
        for (const suggestion of suggestions) {
            const suggestionNormalized = suggestion.toLowerCase();
            if (normalized.includes(suggestionNormalized) || 
                suggestionNormalized.includes(normalized)) {
                return suggestion;
            }
        }
        
        return null;
    }
    
    /**
     * Analyze conversation for recurring confusion patterns
     * Helps identify if user consistently has trouble with certain flows
     */
    async analyzeConfusionPatterns(conversationId, tenantId) {
        // Future enhancement: track what users consistently struggle with
        // to improve prompts and guidance
        return {
            hasPatterns: false,
            patterns: []
        };
    }
}

module.exports = new ProactiveClarificationService();
