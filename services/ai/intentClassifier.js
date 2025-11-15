const OpenAI = require('openai');

/**
 * Classify customer intent for intelligent routing
 * Uses OpenAI (existing integration)
 */
class IntentClassifier {
  constructor() {
    // Handle different environment variable names
    const apiKey = process.env.OPENAI_API_KEY || 
                   process.env.OPENAI_API_KEY_OCR ||
                   null;

    if (!apiKey) {
      console.warn('⚠️ OpenAI API key not found. Only rule-based classification will work.');
      this.openai = null;
      this.aiEnabled = false;
    } else {
      this.openai = new OpenAI({ apiKey });
      this.aiEnabled = true;
    }
    this.model = process.env.AI_MODEL_FAST || 'gpt-4o-mini';

    // Intent categories
    this.intents = {
      ORDER: 'order',
      PRICE_INQUIRY: 'price_inquiry',
      PRODUCT_INFO: 'product_info',
      ORDER_STATUS: 'order_status',
      COMPLAINT: 'complaint',
      GREETING: 'greeting',
      FOLLOW_UP: 'follow_up',
      CONFIRMATION: 'confirmation',
      MODIFICATION: 'modification',
      GENERAL_INQUIRY: 'general_inquiry',
      HUMAN_REQUEST: 'human_request',
      CART_CLEAR: 'cart_clear',
      CART_VIEW: 'cart_view',
      CHECKOUT: 'checkout'
    };
  }

  /**
   * Classify intent using AI
   */
  async classifyIntent(message, context = {}) {
    if (!this.aiEnabled || !this.openai) {
      console.warn('AI not available, falling back to rules');
      return this.fallbackClassification(message);
    }
    try {
      const prompt = this.buildClassificationPrompt(message, context);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent classification
        response_format: { type: "json_object" } // Force JSON response
      });

      const classification = JSON.parse(response.choices[0].message.content);

      return {
        intent: classification.intent,
        confidence: classification.confidence,
        entities: classification.entities || {},
        reasoning: classification.reasoning,
        suggestedAction: classification.suggested_action,
        tokensUsed: response.usage.total_tokens
      };

    } catch (error) {
      console.error('Error classifying intent:', error);
      return this.fallbackClassification(message);
    }
  }

  /**
   * Quick rule-based classification (no AI, instant)
   */
  quickClassify(message, context = {}) {
    const lowerMessage = message.toLowerCase().trim();

    // Cart operation detection using semantic keywords (language-agnostic)
    const cartKeywords = ['cart', 'basket', 'trolley', 'shopping', 'order list'];
    const clearKeywords = ['clear', 'empty', 'delete', 'remove', 'reset', 'cancel', 'clean', 'erase', 
                          'khali', 'saaf', 'hata', 'delete', 'निकाल', 'साफ'];
    const viewKeywords = ['view', 'show', 'see', 'check', 'display', 'list', 'what', 'dekh', 'dikhao', 'दिखाओ'];
    const checkoutKeywords = ['checkout', 'place order', 'confirm order', 'order karna', 'finalize', 'complete'];
    
    const hasCartReference = cartKeywords.some(kw => lowerMessage.includes(kw));
    const hasClearIntent = clearKeywords.some(kw => lowerMessage.includes(kw));
    const hasViewIntent = viewKeywords.some(kw => lowerMessage.includes(kw));
    const hasCheckoutIntent = checkoutKeywords.some(kw => lowerMessage.includes(kw));
    
    // Smart detection: if message talks about cart/basket/order AND clearing/removing
    if ((hasCartReference || /\b(all|everything|sab|sara)\b/i.test(lowerMessage)) && hasClearIntent) {
      console.log('[INTENT] Detected cart clear intent - CART_CLEAR');
      return { intent: this.intents.CART_CLEAR, confidence: 0.92, method: 'semantic-cart-clear' };
    }
    
    // View cart
    if (hasCartReference && hasViewIntent) {
      console.log('[INTENT] Detected cart view intent - CART_VIEW');
      return { intent: this.intents.CART_VIEW, confidence: 0.90, method: 'semantic-cart-view' };
    }
    
    // Checkout
    if (hasCheckoutIntent || (hasCartReference && /\b(done|ready|proceed|confirm)\b/i.test(lowerMessage))) {
      console.log('[INTENT] Detected checkout intent - CHECKOUT');
      return { intent: this.intents.CHECKOUT, confidence: 0.88, method: 'semantic-checkout' };
    }

    // Greeting patterns
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste)/i.test(lowerMessage)) {
      return { intent: this.intents.GREETING, confidence: 0.95, method: 'rule-based' };
    }

    // ADD PRODUCT patterns (MUST BE BEFORE order patterns to avoid confusion)
    // Matches: "add 8x100 5ctns", "also need 10x140", "aur 8x80", "bhi chahiye", "include 8x100"
    // Context: Must be in order discussion state
    if (context.inOrderDiscussion && 
        /\b(add|also|too|aur|bhi|include|plus|extra|additionally|ek aur)\b/i.test(lowerMessage) &&
        /\d+[x*]\d+/i.test(lowerMessage)) {
      console.log('[INTENT] Detected add product during order - ADD_PRODUCT intent');
      return { 
        intent: 'ADD_PRODUCT', 
        confidence: 0.92, 
        method: 'rule-based-add-product',
        reasoning: 'Adding additional product to existing order'
      };
    }

    // Product availability/inquiry patterns (MUST BE BEFORE order patterns)
    // Matches: "8x80 hain aapke paas?", "do you have 8x100?", "available hai kya?"
    if (/\d+[x*]\d+.*(hain|hai|available|stock|milega|paas)/i.test(lowerMessage) ||
        /(available|stock|milega|paas|have).*((\d+[x*]\d+))/i.test(lowerMessage)) {
      console.log('[INTENT] Detected product availability query - PRODUCT_INFO intent');
      return { intent: this.intents.PRODUCT_INFO, confidence: 0.9, method: 'rule-based-availability' };
    }

    // Quantity-only patterns (for context-based orders)
    // Matches: "10ctns", "5 cartons", "100 pieces", "1lac pcs", "2 lakh pieces" WITHOUT product code
    if (/^\d+\s*(?:ctns?|cartons?|pcs?|pieces?)$/i.test(lowerMessage) ||
        /^\d+\s*(?:lac|lakh)\s*(?:ctns?|cartons?|pcs?|pieces?)$/i.test(lowerMessage)) {
      console.log('[INTENT] Detected quantity-only (context order) - ORDER intent');
      return { intent: this.intents.ORDER, confidence: 0.9, method: 'rule-based-context-qty' };
    }

    // Order patterns with product codes and quantities
    // Matches: "10x100, 10x120 10000pcs each", "8x80 5 cartons", "nff 8x100 10 ctns", "8x80 1lac pcs"
    if (/\d+[x*]\d+.*((\d+)\s*(ctns?|cartons?|pcs?|pieces?|lac|lakh|each))/i.test(lowerMessage)) {
      console.log('[INTENT] Detected product code with quantity - ORDER intent');
      return { intent: this.intents.ORDER, confidence: 0.95, method: 'rule-based-quantity' };
    }

    // Order patterns with keywords
    if (/\b(order|place order|want to order|need|buy|purchase|chahiye)\b/i.test(lowerMessage)) {
      return { intent: this.intents.ORDER, confidence: 0.85, method: 'rule-based' };
    }

    // Price patterns (WITHOUT quantity indicators - those are orders)
    // Must NOT have quantity patterns like "5 ctns", "10 pieces", etc.
    // Matches: "need price", "show prices", "how much", "what is the rate", etc.
    if (/\b(prices?|cost|rate|how much|quotation|quote|kya rate|kitne ka|need.*price|want.*price|show.*price|give.*price)\b/i.test(lowerMessage) &&
        !/\d+\s*(ctns?|cartons?|pcs?|pieces?)\s*(each)?/i.test(lowerMessage)) {
      return { intent: this.intents.PRICE_INQUIRY, confidence: 0.85, method: 'rule-based' };
    }

    // Confirmation patterns
    if (/^(yes|yeah|yep|ok|okay|sure|correct|right|confirm)/i.test(lowerMessage)) {
      return { intent: this.intents.CONFIRMATION, confidence: 0.9, method: 'rule-based' };
    }

    // Human request patterns
    if (/\b(talk to|speak to|human|person|manager|owner|call me)\b/i.test(lowerMessage)) {
      return { intent: this.intents.HUMAN_REQUEST, confidence: 0.9, method: 'rule-based' };
    }

    // Complaint patterns
    if (/\b(problem|issue|complaint|wrong|mistake|error|not received|defective)\b/i.test(lowerMessage)) {
      return { intent: this.intents.COMPLAINT, confidence: 0.8, method: 'rule-based' };
    }

    // Order status patterns
    if (/\b(status|where is|when will|delivery|shipped|tracking)\b/i.test(lowerMessage)) {
      return { intent: this.intents.ORDER_STATUS, confidence: 0.8, method: 'rule-based' };
    }

    // Company/Product information queries - route to smart router for website search
    // Matches: "tell me about", "what do you", "your company", "your products", "information about"
    if (/\b(tell me|about|information|what do you|who are you|your company|your business|your products|product range|what products)\b/i.test(lowerMessage)) {
      console.log('[INTENT] Detected company/product info query - PRODUCT_INFO intent for smart router');
      return { intent: this.intents.PRODUCT_INFO, confidence: 0.88, method: 'rule-based-info' };
    }

    return { intent: this.intents.GENERAL_INQUIRY, confidence: 0.5, method: 'rule-based' };
  }

  /**
   * Hybrid classification: Try quick rules first, use AI if uncertain
   */
  async hybridClassify(message, context = {}, options = {}) {
    const quickResult = this.quickClassify(message);

    // If high confidence from rules, use it (saves AI cost!)
    if (quickResult.confidence >= 0.85) {
      return quickResult;
    }

    // Low confidence - use AI
    if (options.useAI !== false) {
      try {
        const aiResult = await this.classifyIntent(message, context);
        aiResult.method = 'ai-enhanced';
        return aiResult;
      } catch (error) {
        console.error('AI classification failed, using rule-based:', error);
        return quickResult;
      }
    }

    return quickResult;
  }

  // ... (rest of methods same as before)
  
  buildClassificationPrompt(message, context) {
    let prompt = `Classify the following customer message into one of these intents:\n\n`;
    prompt += `INTENTS:\n`;
    prompt += `- order: Placing an order with quantities (e.g., "I want 10 cartons", "order 8x80 5000pcs")\n`;
    prompt += `- price_inquiry: Asking for prices without ordering (e.g., "what's the price", "send rate list")\n`;
    prompt += `- product_info: Asking about products, availability, or specifications (e.g., "do you have screws", "what products", "tell me about anchors", "any wood screws available")\n`;
    prompt += `- order_status: Checking order status or tracking\n`;
    prompt += `- complaint: Issues or complaints\n`;
    prompt += `- greeting: Hi, hello, good morning\n`;
    prompt += `- follow_up: Following up on previous conversation\n`;
    prompt += `- confirmation: Yes, ok, confirm\n`;
    prompt += `- modification: Changing existing order\n`;
    prompt += `- general_inquiry: Other questions not fitting above categories\n`;
    prompt += `- human_request: Wants to talk to a person\n\n`;
    
    if (context.previousIntent) {
      prompt += `CONTEXT: Previous intent was "${context.previousIntent}"\n\n`;
    }

    prompt += `MESSAGE: "${message}"\n\n`;
    prompt += `CRITICAL CLASSIFICATION RULES:
1. "I want X", "I need X", "Give me X", "Send X" → classify as "order" (even if X is short/unclear)
2. "Do you have X", "any X available", "what products" → classify as "product_info"
3. Product codes, abbreviations, or short names (e.g., "nff", "10x140", "cup") → classify as "order"
4. If message contains product-like terms with want/need/give verbs → always "order", never "general_inquiry"

Examples:
- "I want nff" → order
- "I need cups" → order  
- "Send me 10x140" → order
- "Give me nff 10 ctns" → order
- "Do you have nff?" → product_info
- "What is nff?" → general_inquiry\n\n`;
    prompt += `Respond with a JSON object containing: intent, confidence (0-1), entities, reasoning, suggested_action`;

    return prompt;
  }

  getSystemPrompt() {
    return `You are an intent classification system. Classify messages accurately into predefined intents. Always respond with valid JSON.`;
  }

  fallbackClassification(message) {
    const quickResult = this.quickClassify(message);
    quickResult.method = 'fallback';
    return quickResult;
  }

  determineRouting(classification) {
    // Same routing logic as before
    const routing = { useAI: false, useRules: false, useHuman: false, priority: 'normal' };
    
    switch (classification.intent) {
      case this.intents.GREETING:
      case this.intents.CONFIRMATION:
        routing.useRules = true;
        routing.priority = 'low';
        break;
      case this.intents.ORDER:
      case this.intents.PRICE_INQUIRY:
      case this.intents.PRODUCT_INFO:  // Add PRODUCT_INFO to rules routing
        routing.useRules = true;
        routing.priority = 'high';
        break;
      case this.intents.COMPLAINT:
      case this.intents.HUMAN_REQUEST:
        routing.useHuman = true;
        routing.priority = 'urgent';
        break;
      default:
        routing.useAI = true;
        routing.priority = 'normal';
    }
    
    return routing;
  }

  extractProductCodes(message) {
    const codes = [];
    const patterns = [/\b\d+x\d+\b/gi, /\b[A-Z]{2,}\d+\b/gi];
    patterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) codes.push(...matches);
    });
    return [...new Set(codes)];
  }

  extractQuantities(message) {
    const quantities = [];
    const patterns = [
      /(\d+)\s*(box|boxes|carton|cartons|piece|pieces|unit|units|pcs)/gi,
      /quantity[:\s]+(\d+)/gi
    ];
    patterns.forEach(pattern => {
      const matches = [...message.matchAll(pattern)];
      matches.forEach(match => {
        const qty = parseInt(match[1]);
        if (qty > 0) quantities.push(qty);
      });
    });
    return quantities;
  }
}

module.exports = new IntentClassifier();