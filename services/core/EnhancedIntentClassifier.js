/**
 * EnhancedIntentClassifier - Context-Aware AI Classification
 * 
 * Improves upon intentClassifier.js with:
 * 1. Conversation memory integration
 * 2. Better entity extraction
 * 3. Confidence scoring with reasoning
 * 4. Learning from patterns
 * 
 * @module services/core/EnhancedIntentClassifier
 */

const { openai } = require('../config');
const ConversationMemory = require('./ConversationMemory');

/**
 * Enhanced intent classification with context awareness
 * 
 * @param {string} message - Customer message
 * @param {string} tenantId - Tenant UUID
 * @param {string} phoneNumber - Customer phone
 * @param {Object} options - Classification options
 * @returns {Promise<{
 *   intent: string,
 *   confidence: number,
 *   entities: Object,
 *   reasoning: string,
 *   method: string
 * }>}
 */
async function classifyWithContext(message, tenantId, phoneNumber, options = {}) {
    try {
        // Get conversation memory for context
        const memory = await ConversationMemory.getMemory(tenantId, phoneNumber);
        
        console.log('[EnhancedAI] Classifying with context:', {
            message: message.substring(0, 50),
            lastIntent: memory.lastIntent,
            cartActive: memory.cartActive,
            productsDiscussed: memory.products.length
        });
        
        // Build enhanced prompt with conversation context
        const systemPrompt = buildEnhancedSystemPrompt();
        const userPrompt = buildUserPrompt(message, memory);
        
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.2, // Low temperature for consistent classification
            max_tokens: 500,
            response_format: { type: "json_object" }
        });
        
        const result = JSON.parse(response.choices[0].message.content);
        
        // Enhance result with extracted entities
        const entities = extractEnhancedEntities(message, memory);
        
        const classification = {
            intent: result.intent || 'general_inquiry',
            confidence: result.confidence || 0.5,
            entities: entities,
            reasoning: result.reasoning || 'AI classification',
            method: 'enhanced-ai-with-context',
            contextUsed: {
                lastIntent: memory.lastIntent,
                cartActive: memory.cartActive,
                hasQuote: memory.hasQuote
            }
        };
        
        console.log('[EnhancedAI] Classification:', {
            intent: classification.intent,
            confidence: (classification.confidence * 100).toFixed(0) + '%',
            entitiesFound: Object.keys(entities).length
        });
        
        return classification;
        
    } catch (error) {
        console.error('[EnhancedAI] Classification failed:', error.message);
        
        // Fallback to basic entity extraction
        return {
            intent: 'general_inquiry',
            confidence: 0.3,
            entities: extractEnhancedEntities(message, {}),
            reasoning: 'Fallback due to error',
            method: 'fallback'
        };
    }
}

/**
 * Build enhanced system prompt with examples
 * @private
 */
function buildEnhancedSystemPrompt() {
    return `You are an expert intent classifier for a B2B WhatsApp sales bot. You understand context and conversation flow. Always respond with JSON format.

**Available Intents:**
- ADD_PRODUCT / order: Customer placing or discussing an order, adding products
- QUANTITY_UPDATE: Updating quantity of existing cart items
- PRODUCT_INQUIRY / price_inquiry: Asking for product prices or information
- DISCOUNT_REQUEST: Negotiating or asking for discounts
- CHECKOUT: Ready to confirm/place order
- CART_VIEW / cart_operation: View, clear, or modify cart
- INVOICE_REQUEST: Requesting invoice, bill, receipt
- SHIPPING_ADDRESS_UPDATE / shipping_update: Update shipping/delivery address
- GST_PREFERENCE / gst: Providing or discussing GST details
- GREETING: Hello, hi, good morning, any language
- CONFIRMATION: Yes, ok, proceed, confirmation phrases
- GENERAL_INQUIRY: Other questions

**Context Awareness Rules:**
1. If customer has cart AND says "go ahead", "proceed", "ok", "haan", "yes" → CHECKOUT
2. If discussing product AND says "yes", "ok", "add", "haan" → ADD_PRODUCT (adding to cart)
3. If last intent was "ADD_PRODUCT" AND customer gives just number → QUANTITY_UPDATE
4. Requests for "invoice", "bill", "receipt" in ANY language → INVOICE_REQUEST
5. Requests to "update address", "change address", in ANY language → SHIPPING_ADDRESS_UPDATE
6. If customer mentions price they want → DISCOUNT_REQUEST (treat as counter_offer with entity)
7. If customer says "no gst", "without gst", "नहीं चाहिए GST" → GST_PREFERENCE

**Multilingual Support:**
- English: "I need 10 cartons", "send invoice", "update address"
- Hindi: "10 कार्टन चाहिए", "बिल भेजो", "पता बदलना है"
- Arabic: "أريد 10 كرتون", "أرسل الفاتورة"
- Any language: AI should understand intent naturally

**Entity Extraction:**
Always extract:
- product_codes: Array of product codes (e.g., ["10x140", "8x80", "SKU-123"])
- quantities: Array of {value, unit} (e.g., [{value: 5, unit: "cartons"}])
- prices: Array of price mentions (e.g., ["₹1.50/pc", "2000/carton"])
- gst_response: Boolean if customer responds to GST question

**Response Format:**
{
  "intent": "ADD_PRODUCT",
  "confidence": 0.95,
  "reasoning": "Customer mentioned product code with quantity",
  "entities": {
    "product_codes": ["10x140"],
    "quantities": [{"value": 5, "unit": "cartons"}]
  }
}

**Examples:**

Message: "10x140 5 cartons"
Context: No cart
→ {"intent": "ADD_PRODUCT", "confidence": 0.98, "reasoning": "Product code with quantity indicates order intent"}

Message: "I need 8x100 40ctns"
Context: No cart
→ {"intent": "ADD_PRODUCT", "confidence": 0.98, "reasoning": "Product with quantity - new order"}

Message: "40 only"
Context: Cart active, product 8x100 just added
→ {"intent": "QUANTITY_UPDATE", "confidence": 0.95, "reasoning": "Updating recently added item quantity"}

Message: "go ahead" OR "ok proceed" OR "haan theek hai"
Context: Cart active, last intent was "order"
→ {"intent": "CHECKOUT", "confidence": 0.95, "reasoning": "Confirmation with active cart indicates checkout"}

Message: "no gst" OR "नहीं GST" OR "without GST"
Context: Last intent was asking for GST
→ {"intent": "GST_PREFERENCE", "confidence": 0.98, "reasoning": "Clear GST preference response"}

Message: "discount milega?" OR "price kam karo" OR "خصم"
Context: Has received quote
→ {"intent": "DISCOUNT_REQUEST", "confidence": 0.92, "reasoning": "Asking for discount after quote"}

Message: "send invoice" OR "bill bhejo" OR "أرسل الفاتورة"
→ {"intent": "INVOICE_REQUEST", "confidence": 0.95, "reasoning": "Requesting invoice/bill"}

Message: "update address" OR "पता बदलो" OR "change shipping address"
→ {"intent": "SHIPPING_ADDRESS_UPDATE", "confidence": 0.95, "reasoning": "Requesting address update"}`;
}

/**
 * Build user prompt with conversation context
 * @private
 */
function buildUserPrompt(message, memory) {
    let prompt = `**Current Message:** "${message}"\n\n`;
    
    prompt += `**Conversation Context:**\n`;
    
    if (memory.lastIntent) {
        prompt += `- Last Intent: ${memory.lastIntent}\n`;
    }
    
    if (memory.cartActive) {
        prompt += `- Cart Status: Active (has items)\n`;
    } else {
        prompt += `- Cart Status: Empty\n`;
    }
    
    if (memory.products.length > 0) {
        prompt += `- Products Discussed: ${memory.products.slice(0, 3).join(', ')}\n`;
    }
    
    if (memory.hasQuote) {
        prompt += `- Has Received: Price quotes\n`;
    }
    
    if (memory.recentMessages.length > 0) {
        prompt += `\n**Recent Conversation (last ${memory.recentMessages.length} messages):**\n`;
        memory.recentMessages.slice(-3).forEach((msg, i) => {
            prompt += `${i + 1}. [${msg.sender}]: "${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}"\n`;
        });
    }
    
    prompt += `\n**Task:** Classify the current message considering the conversation context above.`;
    
    return prompt;
}

/**
 * Extract enhanced entities from message with confidence
 * @private
 */
function extractEnhancedEntities(message, memory = {}) {
    const entities = {};
    
    // Product codes (e.g., 10x140, 8x80, NFF 8x100)
    const productPattern = /\b([A-Z]{2,}\s+)?\d+[x*×]\d+\b/gi;
    const productMatches = message.match(productPattern);
    if (productMatches) {
        entities.product_codes = productMatches.map(p => p.trim().toUpperCase());
        entities.product_confidence = 0.95;
    }
    
    // Quantities with units
    const quantities = [];
    
    // Pattern 1: "5 cartons", "10 ctns", "1000 pieces"
    const qtyPattern1 = /(\d+(?:,\d{3})*)\s*(ctns?|cartons?|pcs?|pieces?|units?)/gi;
    let match;
    while ((match = qtyPattern1.exec(message)) !== null) {
        quantities.push({
            value: parseInt(match[1].replace(/,/g, '')),
            unit: normalizeUnit(match[2]),
            confidence: 0.95
        });
    }
    
    // Pattern 2: "1 lac pcs", "2 lakh cartons"
    const qtyPattern2 = /(\d+(?:\.\d+)?)\s*(lac|lakh)\s*(ctns?|cartons?|pcs?|pieces?)/gi;
    while ((match = qtyPattern2.exec(message)) !== null) {
        const multiplier = 100000; // 1 lac = 100,000
        quantities.push({
            value: Math.round(parseFloat(match[1]) * multiplier),
            unit: normalizeUnit(match[3]),
            confidence: 0.90
        });
    }
    
    if (quantities.length > 0) {
        entities.quantities = quantities;
    }
    
    // Prices (e.g., ₹1.50, 2000/carton, 1.45/pc)
    const pricePattern = /(₹|rs\.?|inr)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:\/(?:pc|piece|carton|ctn|box))?/gi;
    const priceMatches = [];
    while ((match = pricePattern.exec(message)) !== null) {
        priceMatches.push({
            raw: match[0].trim(),
            amount: parseFloat(match[2].replace(/,/g, '')),
            confidence: 0.85
        });
    }
    if (priceMatches.length > 0) {
        entities.prices = priceMatches;
    }
    
    // GST response detection
    const gstPatterns = /\b(no\s*gst|without\s*gst|nahi|with\s*gst|han)\b/i;
    if (gstPatterns.test(message)) {
        entities.gst_response = true;
        entities.gst_confidence = 0.90;
    }
    
    // GST number detection
    const gstNumberPattern = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/;
    const gstMatch = message.match(gstNumberPattern);
    if (gstMatch) {
        entities.gst_number = gstMatch[0];
        entities.gst_confidence = 0.98;
    }
    
    // Discount indicators
    const discountPattern = /\b(discount|reduce|lower|best\s+price|kam|aur|more)\b/i;
    if (discountPattern.test(message)) {
        entities.discount_mentioned = true;
    }
    
    // Urgency indicators
    const urgencyPattern = /\b(urgent|asap|immediately|today|now|jaldi)\b/i;
    if (urgencyPattern.test(message)) {
        entities.urgency = 'high';
    }
    
    return entities;
}

/**
 * Normalize unit names
 * @private
 */
function normalizeUnit(unit) {
    const normalized = unit.toLowerCase().trim();
    if (/^(ctn|carton)s?$/.test(normalized)) return 'cartons';
    if (/^(pc|piece)s?$/.test(normalized)) return 'pieces';
    if (/^units?$/.test(normalized)) return 'units';
    return normalized;
}

/**
 * Calculate overall confidence based on multiple signals
 * 
 * @param {Object} classification - Classification result
 * @param {Object} memory - Conversation memory
 * @returns {number} Adjusted confidence (0-1)
 */
function calculateAdjustedConfidence(classification, memory) {
    let confidence = classification.confidence || 0.5;
    
    // Boost confidence if context supports the intent
    if (memory.cartActive && classification.intent === 'checkout') {
        confidence = Math.min(confidence + 0.1, 1.0);
    }
    
    if (memory.lastIntent === 'order' && classification.intent === 'order') {
        confidence = Math.min(confidence + 0.05, 1.0);
    }
    
    if (memory.hasQuote && classification.intent === 'discount_request') {
        confidence = Math.min(confidence + 0.08, 1.0);
    }
    
    // Reduce confidence if intent conflicts with context
    if (!memory.cartActive && classification.intent === 'checkout') {
        confidence = Math.max(confidence - 0.2, 0.3);
    }
    
    return confidence;
}

module.exports = {
    classifyWithContext,
    extractEnhancedEntities,
    calculateAdjustedConfidence
};
