// routes/utils/validators.js
// Message validation utilities for webhook processing

/**
 * Validate basic message structure from Maytapi
 */
const validateMessageStructure = (message) => {
  const errors = [];
  
  if (!message) {
    errors.push('Message object is null or undefined');
    return { isValid: false, errors };
  }
  
  if (!message.from) {
    errors.push('Missing sender (from) field');
  }
  
  // 'to' field is optional for incoming messages (Maytapi doesn't always send it)
  // It's resolved via tenant lookup instead
  
  if (!message.type) {
    errors.push('Missing message type field');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number format (more lenient for WhatsApp)
 */
const validatePhoneNumber = (phone) => {
  if (!phone) return { isValid: false, error: 'Phone number is required' };
  
  const phoneStr = String(phone).trim();
  
  // Remove WhatsApp formatting (@c.us, @s.whatsapp.net, etc.)
  const cleanPhone = phoneStr.replace(/@.*$/, '');
  
  // Remove common formatting characters but keep + at start
  const digitsOnly = cleanPhone.replace(/[\s\-\(\)]/g, '');
  
  // More lenient validation - allow + and digits, and common WhatsApp patterns
  if (!/^(\+)?\d+$/.test(digitsOnly)) {
    // If it still has non-digits after cleaning, extract just the digits
    const extractedDigits = digitsOnly.replace(/\D/g, '');
    
    if (extractedDigits.length < 10) {
      return { isValid: false, error: 'Phone number too short (minimum 10 digits)' };
    }
    
    if (extractedDigits.length > 15) {
      return { isValid: false, error: 'Phone number too long (maximum 15 digits)' };
    }
    
    return { 
      isValid: true, 
      normalized: extractedDigits,
      original: phoneStr 
    };
  }
  
  // Extract just digits for length validation
  const finalDigits = digitsOnly.replace(/\D/g, '');
  
  // Check minimum length (at least 10 digits for most countries)
  if (finalDigits.length < 10) {
    return { isValid: false, error: 'Phone number too short (minimum 10 digits)' };
  }
  
  // Check maximum length (15 digits max international standard)
  if (finalDigits.length > 15) {
    return { isValid: false, error: 'Phone number too long (maximum 15 digits)' };
  }
  
  return { 
    isValid: true, 
    normalized: finalDigits,
    original: phoneStr 
  };
};

/**
 * Validate text message content
 */
const validateTextMessage = (message) => {
  if (message.type !== 'text') {
    return { isValid: false, error: 'Not a text message' };
  }
  
  if (!message.text) {
    return { isValid: false, error: 'Missing text object' };
  }
  
  if (!message.text.body || typeof message.text.body !== 'string') {
    return { isValid: false, error: 'Missing or invalid text body' };
  }
  
  const textContent = message.text.body.trim();
  
  if (textContent.length === 0) {
    return { isValid: false, error: 'Empty text message' };
  }
  
  // Check for reasonable length (prevent spam/abuse)
  if (textContent.length > 4000) {
    return { isValid: false, error: 'Text message too long (max 4000 characters)' };
  }
  
  return { 
    isValid: true, 
    content: textContent,
    length: textContent.length 
  };
};

/**
 * Validate document/file message
 */
const validateDocumentMessage = (message) => {
  if (message.type !== 'document') {
    return { isValid: false, error: 'Not a document message' };
  }
  
  if (!message.document) {
    return { isValid: false, error: 'Missing document object' };
  }
  
  if (!message.document.url) {
    return { isValid: false, error: 'Missing document URL' };
  }
  
  // Validate URL format
  const url = message.document.url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { isValid: false, error: 'Invalid document URL format' };
  }
  
  return { 
    isValid: true, 
    url: message.document.url,
    filename: message.document.filename || null,
    mimeType: message.document.mime || null
  };
};

/**
 * Validate image/media message
 */
const validateImageMessage = (message) => {
  const validImageTypes = ['image', 'media'];
  
  if (!validImageTypes.includes(message.type)) {
    return { isValid: false, error: 'Not an image/media message' };
  }
  
  // Check for URL in various possible locations
  const hasUrl = message.url || 
                message.image?.url || 
                message.media?.url || 
                message.document?.url;
  
  if (!hasUrl) {
    return { isValid: false, error: 'Missing image URL' };
  }
  
  return { 
    isValid: true, 
    type: message.type,
    hasImageData: !!message.image,
    hasMediaData: !!message.media
  };
};

/**
 * Validate admin command format
 */
const validateAdminCommand = (textContent) => {
  if (!textContent || typeof textContent !== 'string') {
    return { isValid: false, error: 'Invalid command text' };
  }
  
  const trimmed = textContent.trim();
  
  if (!trimmed.startsWith('/')) {
    return { isValid: false, error: 'Command must start with /' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Command too short' };
  }
  
  // Extract command and arguments
  const parts = trimmed.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  // Basic command name validation
  if (!/^\/[a-z_]+$/.test(command)) {
    return { isValid: false, error: 'Invalid command format (use letters and underscores only)' };
  }
  
  return { 
    isValid: true, 
    command,
    args,
    fullText: trimmed,
    argCount: args.length 
  };
};

/**
 * Validate tenant/bot configuration
 */
const validateTenant = (tenant) => {
  if (!tenant) {
    return { isValid: false, error: 'Tenant object is required' };
  }
  
  const errors = [];
  
  if (!tenant.id) {
    errors.push('Missing tenant ID');
  }
  
  if (!tenant.bot_phone_number) {
    errors.push('Missing bot phone number');
  }
  
  if (!tenant.owner_whatsapp_number) {
    errors.push('Missing owner WhatsApp number');
  }
  
  // Validate phone numbers if present
  if (tenant.bot_phone_number) {
    const botPhoneValidation = validatePhoneNumber(tenant.bot_phone_number);
    if (!botPhoneValidation.isValid) {
      errors.push(`Invalid bot phone number: ${botPhoneValidation.error}`);
    }
  }
  
  if (tenant.owner_whatsapp_number) {
    const ownerPhoneValidation = validatePhoneNumber(tenant.owner_whatsapp_number);
    if (!ownerPhoneValidation.isValid) {
      errors.push(`Invalid owner phone number: ${ownerPhoneValidation.error}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    tenant: {
      id: tenant.id,
      botPhone: tenant.bot_phone_number,
      ownerPhone: tenant.owner_whatsapp_number,
      businessName: tenant.business_name || 'Unknown Business'
    }
  };
};

/**
 * Validate webhook request structure
 */
const validateWebhookRequest = (req) => {
  const errors = [];
  
  if (!req.body) {
    errors.push('Missing request body');
    return { isValid: false, errors };
  }
  
  // Check for required fields after normalization
  const message = req.message || req.body;
  
  const messageValidation = validateMessageStructure(message);
  if (!messageValidation.isValid) {
    errors.push(...messageValidation.errors);
  }
  
  // Validate phone numbers if present
  // 'from' is required, 'to' is optional (resolved via tenant)
  if (!message.from) {
    errors.push('Missing sender (from) field');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    messageType: message.type,
    from: message.from,
    to: message.to
  };
};

/**
 * Sanitize text content (remove potentially harmful content)
 */
const sanitizeTextContent = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 4000); // Limit length
};

/**
 * Check if message is spam-like
 */
const isSpamMessage = (textContent) => {
  if (!textContent) return false;
  
  const spamIndicators = [
    // Excessive repetition
    /(.)\1{10,}/, // Same character repeated 10+ times
    /(\w+\s+)\1{5,}/, // Same word repeated 5+ times
    
    // Excessive caps
    /[A-Z]{20,}/, // 20+ consecutive capital letters
    
    // Common spam patterns
    /\b(FREE|URGENT|WINNER|CONGRATULATIONS)\b.*\b(CLICK|CALL|TEXT)\b/i,
    
    // Excessive emojis
    /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]){10,}/u
  ];
  
  return spamIndicators.some(pattern => pattern.test(textContent));
};

/**
 * Validate and normalize message for processing
 */
const validateAndNormalize = (message) => {
  const validation = validateMessageStructure(message);
  
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }
  
  const normalized = {
    from: message.from,
    to: message.to,
    type: message.type,
    timestamp: message.timestamp || new Date().toISOString(),
    _original: message
  };
  
  // Type-specific validation and normalization
  switch (message.type) {
    case 'text':
      const textValidation = validateTextMessage(message);
      if (!textValidation.isValid) {
        return { success: false, errors: [textValidation.error] };
      }
      
      normalized.text = {
        body: sanitizeTextContent(textValidation.content)
      };
      
      // Check for spam
      if (isSpamMessage(normalized.text.body)) {
        normalized._flags = ['potential_spam'];
      }
      
      break;
      
    case 'document':
      const docValidation = validateDocumentMessage(message);
      if (!docValidation.isValid) {
        return { success: false, errors: [docValidation.error] };
      }
      
      normalized.document = {
        url: docValidation.url,
        filename: docValidation.filename,
        mimeType: docValidation.mimeType
      };
      break;
      
    case 'image':
    case 'media':
      const imageValidation = validateImageMessage(message);
      if (!imageValidation.isValid) {
        return { success: false, errors: [imageValidation.error] };
      }
      
      normalized.image = {
        url: message.url || message.image?.url || message.media?.url,
        filename: message.filename || message.image?.filename || message.media?.filename
      };
      break;
  }
  
  return { 
    success: true, 
    message: normalized,
    flags: normalized._flags || []
  };
};

module.exports = {
  validateMessageStructure,
  validatePhoneNumber,
  validateTextMessage,
  validateDocumentMessage,
  validateImageMessage,
  validateAdminCommand,
  validateTenant,
  validateWebhookRequest,
  validateAndNormalize,
  sanitizeTextContent,
  isSpamMessage
};