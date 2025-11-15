// routes/utils/commandParsers.js
// Command parsing utilities for admin and customer commands

/**
 * Parse quoted arguments from command strings
 * Example: /command "arg1" "arg2" -> ["arg1", "arg2"]
 */
const parseQuotedArgs = (text) => {
  const regex = /"([^"]+)"/g;
  const matches = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
};

/**
 * Parse space-separated arguments 
 * Example: /command arg1 arg2 arg3 -> ["arg1", "arg2", "arg3"]
 */
const parseSpaceArgs = (text, commandName) => {
  const parts = text.trim().split(/\s+/);
  
  // Remove the command itself
  if (parts[0] === commandName) {
    parts.shift();
  }
  
  return parts;
};

/**
 * Parse mixed quoted and space arguments
 * Example: /command "quoted arg" normal_arg "another quoted" -> ["quoted arg", "normal_arg", "another quoted"]
 */
const parseMixedArgs = (text) => {
  const args = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  // Skip command name (find first space)
  while (i < text.length && text[i] !== ' ') {
    i++;
  }
  
  // Skip spaces after command
  while (i < text.length && text[i] === ' ') {
    i++;
  }
  
  // Parse arguments
  while (i < text.length) {
    const char = text[i];
    
    if (char === '"') {
      if (inQuotes) {
        // End of quoted string
        if (current.trim()) {
          args.push(current);
          current = '';
        }
        inQuotes = false;
      } else {
        // Start of quoted string
        if (current.trim()) {
          args.push(current.trim());
          current = '';
        }
        inQuotes = true;
      }
    } else if (char === ' ' && !inQuotes) {
      // Space outside quotes - end of argument
      if (current.trim()) {
        args.push(current.trim());
        current = '';
      }
    } else {
      // Regular character
      current += char;
    }
    
    i++;
  }
  
  // Add final argument if exists
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
};

/**
 * Parse broadcast command arguments
 * Handles: /broadcast "Campaign" "Time" "Message"
 */
const parseBroadcastCommand = (text) => {
  const args = parseQuotedArgs(text);
  
  if (args.length !== 3) {
    return {
      isValid: false,
      error: 'Broadcast requires 3 quoted arguments: "Campaign" "Time" "Message"',
      usage: '/broadcast "Campaign Name" "tomorrow at 10am" "Your message here"'
    };
  }
  
  return {
    isValid: true,
    campaignName: args[0],
    timeString: args[1],
    message: args[2]
  };
};

/**
 * Parse broadcast_now command arguments
 * Handles: /broadcast_now "Campaign" "Message"
 */
const parseBroadcastNowCommand = (text) => {
  const args = parseQuotedArgs(text);
  
  if (args.length !== 2) {
    return {
      isValid: false,
      error: 'Broadcast now requires 2 quoted arguments: "Campaign" "Message"',
      usage: '/broadcast_now "Campaign Name" "Your message here"'
    };
  }
  
  return {
    isValid: true,
    campaignName: args[0],
    message: args[1]
  };
};

/**
 * Parse drip campaign message command
 * Handles: /add_drip_message "Campaign" 1 24 "Message"
 */
const parseDripMessageCommand = (text) => {
  const quotedArgs = parseQuotedArgs(text);
  const allParts = text.trim().split(/\s+/);
  
  if (quotedArgs.length !== 2) {
    return {
      isValid: false,
      error: 'Drip message requires 2 quoted arguments for campaign and message',
      usage: '/add_drip_message "Campaign" <sequence> <hours> "Message"'
    };
  }
  
  // Find numeric arguments between quotes
  const numericArgs = [];
  let partIndex = 0;
  let quotedIndex = 0;
  
  for (const part of allParts) {
    if (part.includes('"')) {
      quotedIndex++;
      if (quotedIndex === 2) break; // After second quoted arg
    } else if (quotedIndex === 1 && /^\d+$/.test(part)) {
      numericArgs.push(parseInt(part, 10));
    }
  }
  
  if (numericArgs.length !== 2) {
    return {
      isValid: false,
      error: 'Drip message requires sequence number and delay hours',
      usage: '/add_drip_message "Campaign" <sequence> <hours> "Message"'
    };
  }
  
  return {
    isValid: true,
    campaignName: quotedArgs[0],
    message: quotedArgs[1],
    sequence: numericArgs[0],
    delayHours: numericArgs[1]
  };
};

/**
 * Parse FAQ command arguments
 * Handles: /add_faq "Question" "Answer"
 */
const parseFaqCommand = (text) => {
  const args = parseQuotedArgs(text);
  
  if (args.length !== 2) {
    return {
      isValid: false,
      error: 'FAQ requires 2 quoted arguments: "Question" "Answer"',
      usage: '/add_faq "What are your hours?" "We are open 9am-5pm Monday to Friday"'
    };
  }
  
  return {
    isValid: true,
    question: args[0],
    answer: args[1]
  };
};

/**
 * Parse keyword command arguments
 * Handles: /add_keyword trigger response text here
 */
const parseKeywordCommand = (text) => {
  const parts = text.trim().split(/\s+/);
  
  if (parts.length < 3) {
    return {
      isValid: false,
      error: 'Keyword requires trigger and response',
      usage: '/add_keyword <trigger> <response text>'
    };
  }
  
  const trigger = parts[1];
  const response = parts.slice(2).join(' ');
  
  return {
    isValid: true,
    trigger,
    response
  };
};

/**
 * Parse office hours command
 * Handles: /set_office_hours 09:00 17:00
 */
const parseOfficeHoursCommand = (text) => {
  const parts = text.trim().split(/\s+/);
  
  if (parts.length !== 3) {
    return {
      isValid: false,
      error: 'Office hours requires start and end time',
      usage: '/set_office_hours 09:00 17:00'
    };
  }
  
  const startTime = parts[1];
  const endTime = parts[2];
  
  // Validate time format (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(startTime)) {
    return {
      isValid: false,
      error: 'Invalid start time format. Use HH:MM (24-hour format)',
      usage: '/set_office_hours 09:00 17:00'
    };
  }
  
  if (!timeRegex.test(endTime)) {
    return {
      isValid: false,
      error: 'Invalid end time format. Use HH:MM (24-hour format)',
      usage: '/set_office_hours 09:00 17:00'
    };
  }
  
  return {
    isValid: true,
    startTime,
    endTime
  };
};

/**
 * Parse support ticket command
 * Handles: /support "Subject" "Description"
 */
const parseSupportCommand = (text) => {
  const args = parseQuotedArgs(text);
  
  if (args.length !== 2) {
    return {
      isValid: false,
      error: 'Support ticket requires 2 quoted arguments: "Subject" "Description"',
      usage: '/support "Login Issues" "Cannot access my dashboard after password reset"'
    };
  }
  
  return {
    isValid: true,
    subject: args[0],
    description: args[1]
  };
};

/**
 * Parse single argument commands (common pattern)
 */
const parseSingleArgCommand = (text, commandName, argName) => {
  const content = text.replace(commandName, '').trim();
  
  if (!content) {
    return {
      isValid: false,
      error: `${commandName} requires ${argName}`,
      usage: `${commandName} <${argName}>`
    };
  }
  
  return {
    isValid: true,
    argument: content
  };
};

/**
 * Parse phone number argument commands
 * Handles commands that take a phone number as argument
 */
const parsePhoneCommand = (text, commandName) => {
  const parts = text.trim().split(/\s+/);
  
  if (parts.length < 2) {
    return {
      isValid: false,
      error: `${commandName} requires a phone number`,
      usage: `${commandName} <customer_phone>`
    };
  }
  
  const phoneNumber = parts[1];
  const additionalArgs = parts.slice(2);
  
  // Basic phone validation
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: 'Invalid phone number (too short)',
      usage: `${commandName} <customer_phone>`
    };
  }
  
  return {
    isValid: true,
    phoneNumber: digitsOnly,
    additionalArgs
  };
};

/**
 * Parse reminder command
 * Handles: /remind <phone> <reminder text>
 */
const parseReminderCommand = (text) => {
  const parts = text.trim().split(/\s+/);
  
  if (parts.length < 3) {
    return {
      isValid: false,
      error: 'Reminder requires phone number and reminder text',
      usage: '/remind <customer_phone> <reminder text>'
    };
  }
  
  const phoneNumber = parts[1];
  const reminderText = parts.slice(2).join(' ');
  
  return {
    isValid: true,
    phoneNumber: phoneNumber.replace(/\D/g, ''),
    reminderText
  };
};

/**
 * Parse order status update command
 * Handles: /update_order_status <phone> <status>
 */
const parseOrderStatusCommand = (text) => {
  const parts = text.trim().split(/\s+/);
  
  if (parts.length !== 3) {
    return {
      isValid: false,
      error: 'Order status update requires phone number and status',
      usage: '/update_order_status <customer_phone> <new_status>'
    };
  }
  
  return {
    isValid: true,
    phoneNumber: parts[1].replace(/\D/g, ''),
    newStatus: parts[2]
  };
};

/**
 * Parse segment broadcast command
 * Handles: /broadcast_to_segment "Segment" "Campaign" "Time" "Message"
 */
const parseSegmentBroadcastCommand = (text) => {
  const args = parseQuotedArgs(text);
  
  if (args.length !== 4) {
    return {
      isValid: false,
      error: 'Segment broadcast requires 4 quoted arguments',
      usage: '/broadcast_to_segment "Segment" "Campaign" "Time" "Message"'
    };
  }
  
  return {
    isValid: true,
    segmentName: args[0],
    campaignName: args[1],
    timeString: args[2],
    message: args[3]
  };
};

/**
 * Extract command name from text
 */
const extractCommandName = (text) => {
  if (!text || !text.startsWith('/')) return null;
  
  const firstSpace = text.indexOf(' ');
  if (firstSpace === -1) {
    return text.toLowerCase();
  }
  
  return text.substring(0, firstSpace).toLowerCase();
};

/**
 * Check if text is a command
 */
const isCommand = (text) => {
  return text && text.trim().startsWith('/');
};

/**
 * Get command category for routing purposes
 */
const getCommandCategory = (commandName) => {
  const categories = {
    // Broadcast commands
    broadcast: ['/broadcast', '/broadcast_now', '/broadcast_image', '/broadcast_image_now', '/broadcast_to_segment'],
    
    // Content management
    content: ['/add_faq', '/delete_faq', '/list_faqs', '/add_keyword', '/delete_keyword', '/list_keywords', '/add_qr', '/delete_qr', '/list_qr'],
    
    // Customer management
    customer: ['/customer_snapshot', '/history', '/remind', '/get_suggestion', '/view_segments'],
    
    // Drip campaigns
    drip: ['/create_drip', '/add_drip_message', '/subscribe_to_drip', '/list_drips', '/view_drip', '/delete_drip'],
    
    // Segmentation
    segments: ['/add_segment', '/delete_segment', '/list_segments'],
    
    // Settings
    settings: ['/personality', '/welcome', '/set_business_name', '/set_business_address', '/set_business_website', '/set_language', '/set_office_hours', '/set_timezone', '/set_auto_reply'],
    
    // Reports
    reports: ['/leads', '/export_leads', '/analytics', '/stats', '/feedback_report', '/sales_insights'],
    
    // System
    system: ['/status', '/login', '/activate', '/billing', '/support'],
    
    // Orders
    orders: ['/update_order_status'],
    
    // Cart settings
    cart: ['/set_abandoned_cart_delay', '/set_abandoned_cart_message'],
    
    // Referrals
    referrals: ['/my_referral_code', '/apply_referral_code'],
    
    // Summary
    summary: ['/toggle_summary']
  };
  
  for (const [category, commands] of Object.entries(categories)) {
    if (commands.includes(commandName)) {
      return category;
    }
  }
  
  return 'unknown';
};

/**
 * Universal command parser that routes to specific parsers
 */
const parseCommand = (text) => {
  if (!isCommand(text)) {
    return {
      isValid: false,
      error: 'Not a command (must start with /)'
    };
  }
  
  const commandName = extractCommandName(text);
  const category = getCommandCategory(commandName);
  
  // Route to specific parsers based on command
  switch (commandName) {
    case '/broadcast':
      return { ...parseBroadcastCommand(text), command: commandName, category };
      
    case '/broadcast_now':
      return { ...parseBroadcastNowCommand(text), command: commandName, category };
      
    case '/add_drip_message':
      return { ...parseDripMessageCommand(text), command: commandName, category };
      
    case '/add_faq':
    case '/delete_faq':
      return { ...parseFaqCommand(text), command: commandName, category };
      
    case '/add_keyword':
    case '/delete_keyword':
      return { ...parseKeywordCommand(text), command: commandName, category };
      
    case '/set_office_hours':
      return { ...parseOfficeHoursCommand(text), command: commandName, category };
      
    case '/support':
      return { ...parseSupportCommand(text), command: commandName, category };
      
    case '/remind':
      return { ...parseReminderCommand(text), command: commandName, category };
      
    case '/update_order_status':
      return { ...parseOrderStatusCommand(text), command: commandName, category };
      
    case '/broadcast_to_segment':
      return { ...parseSegmentBroadcastCommand(text), command: commandName, category };
      
    // Single argument commands
    case '/personality':
    case '/welcome':
    case '/set_business_name':
    case '/set_business_address':
    case '/set_business_website':
    case '/set_language':
    case '/set_auto_reply':
    case '/set_abandoned_cart_message':
      return { 
        ...parseSingleArgCommand(text, commandName, 'value'), 
        command: commandName, 
        category 
      };
      
    // Phone number commands
    case '/customer_snapshot':
    case '/history':
    case '/get_suggestion':
    case '/view_segments':
      return { 
        ...parsePhoneCommand(text, commandName), 
        command: commandName, 
        category 
      };
      
    // No-argument commands
    case '/status':
    case '/login':
    case '/billing':
    case '/leads':
    case '/export_leads':
    case '/analytics':
    case '/stats':
    case '/feedback_report':
    case '/sales_insights':
    case '/list_faqs':
    case '/list_keywords':
    case '/list_qr':
    case '/list_drips':
    case '/list_segments':
    case '/my_referral_code':
      return {
        isValid: true,
        command: commandName,
        category,
        requiresNoArgs: true
      };
      
    default:
      // Generic parsing for unknown commands
      const args = parseMixedArgs(text);
      return {
        isValid: true,
        command: commandName,
        category,
        args,
        rawText: text
      };
  }
};

module.exports = {
  parseQuotedArgs,
  parseSpaceArgs,
  parseMixedArgs,
  parseBroadcastCommand,
  parseBroadcastNowCommand,
  parseDripMessageCommand,
  parseFaqCommand,
  parseKeywordCommand,
  parseOfficeHoursCommand,
  parseSupportCommand,
  parseSingleArgCommand,
  parsePhoneCommand,
  parseReminderCommand,
  parseOrderStatusCommand,
  parseSegmentBroadcastCommand,
  extractCommandName,
  isCommand,
  getCommandCategory,
  parseCommand
};