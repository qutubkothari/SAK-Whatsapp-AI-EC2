/**
 * GSTService - Centralized GST Management
 * 
 * This service handles all GST-related operations:
 * 1. GST preference collection (with/without GST)
 * 2. GST number validation
 * 3. State management integration
 * 4. Pattern matching for natural language
 * 
 * @module services/core/GSTService
 */

const CustomerService = require('./CustomerService');
const StateManager = require('./ConversationStateManager');

/**
 * GST number validation regex
 * Format: 2 digits (state) + 10 chars (PAN) + 1 char + 1 char (checksum) + 1 char
 */
const GST_NUMBER_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;

/**
 * Patterns indicating "no GST" preference
 */
const NO_GST_PATTERNS = [
    /^no\s*gst$/i,
    /^without\s*gst$/i,
    /^no$/i, // When in GST context
    /^nahi$/i, // Hindi
    /^nai$/i, // Informal
    /^don'?t\s*have\s*gst$/i,
    /^i\s*don'?t\s*have\s*gst$/i,
    /^no\s*gst\s*number$/i,
    /^proceed\s*without\s*gst$/i
];

/**
 * Patterns indicating "with GST" preference
 */
const WITH_GST_PATTERNS = [
    /^with\s*gst$/i,
    /^yes$/i, // When in GST context
    /^han$/i, // Hindi
    /^haa$/i, // Hindi informal
    /^i\s*have\s*gst$/i,
    /^i'?ll\s*provide\s*gst$/i,
    /^provide\s*gst$/i
];

/**
 * Patterns for checkout confirmation when GST is pending
 */
const CHECKOUT_PATTERNS = [
    /^go\s*ahead$/i,
    /^proceed$/i,
    /^confirm$/i,
    /^place\s*order$/i,
    /^checkout$/i,
    /^order\s*now$/i,
    /^book$/i,
    /^done$/i,
    /^ok$/i
];

/**
 * Validate phone number
 * @private
 */
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        throw new Error('Phone number is required');
    }
    return true;
}

/**
 * Validate tenant ID
 * @private
 */
function validateTenantId(tenantId) {
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    return true;
}

/**
 * Validate GST number format
 * 
 * @param {string} gstNumber - GST number to validate
 * @returns {boolean} True if valid
 */
function isValidGSTNumber(gstNumber) {
    if (!gstNumber || typeof gstNumber !== 'string') {
        return false;
    }
    
    const cleaned = gstNumber.trim().toUpperCase();
    return GST_NUMBER_PATTERN.test(cleaned);
}

/**
 * Detect if message indicates "no GST" preference
 * 
 * @param {string} message - Customer message
 * @returns {boolean}
 */
function isNoGSTResponse(message) {
    if (!message) return false;
    
    const normalized = message.trim();
    return NO_GST_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Detect if message indicates "with GST" preference
 * 
 * @param {string} message - Customer message
 * @returns {boolean}
 */
function isWithGSTResponse(message) {
    if (!message) return false;
    
    const normalized = message.trim();
    return WITH_GST_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Detect if message is checkout confirmation
 * 
 * @param {string} message - Customer message
 * @returns {boolean}
 */
function isCheckoutConfirmation(message) {
    if (!message) return false;
    
    const normalized = message.trim();
    return CHECKOUT_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Extract GST number from message
 * 
 * @param {string} message - Customer message
 * @returns {string|null} GST number if found, null otherwise
 */
function extractGSTNumber(message) {
    if (!message) return null;
    
    const words = message.trim().toUpperCase().split(/\s+/);
    
    for (const word of words) {
        if (isValidGSTNumber(word)) {
            return word;
        }
    }
    
    // Try without spaces
    const combined = message.replace(/\s/g, '').toUpperCase();
    if (isValidGSTNumber(combined)) {
        return combined;
    }
    
    return null;
}

/**
 * Request GST preference from customer
 * Sets state and returns message to send
 * 
 * @param {string} tenantId - Tenant UUID
 * @param {string} phoneNumber - Customer phone
 * @returns {Promise<{message: string}>}
 */
async function requestGSTPreference(tenantId, phoneNumber) {
    try {
        validateTenantId(tenantId);
        validatePhone(phoneNumber);
        
        console.log(`[GSTService] Requesting GST preference for: ${phoneNumber}`);
        
        // Transition to awaiting GST state
        await StateManager.transitionToAwaitingGST(tenantId, phoneNumber);
        
        const message = `Do you have a GST number for this order?\n\n` +
                       `Please reply with:\n` +
                       `• Your 15-digit GST number (e.g., 22AAAAA0000A1Z5)\n` +
                       `• "No GST" if you don't have one\n\n` +
                       `We'll proceed accordingly.`;
        
        return { message };
        
    } catch (error) {
        console.error('[GSTService] requestGSTPreference failed:', error.message);
        throw error;
    }
}

/**
 * Handle GST preference response from customer
 * Uses pattern matching BEFORE AI for reliability
 * 
 * @param {string} tenantId - Tenant UUID
 * @param {string} phoneNumber - Customer phone
 * @param {string} messageText - Customer's response
 * @returns {Promise<{
 *   handled: boolean,
 *   preference: 'with_gst'|'no_gst'|null,
 *   gstNumber: string|null,
 *   message: string|null
 * }>}
 */
async function handleGSTResponse(tenantId, phoneNumber, messageText) {
    try {
        validateTenantId(tenantId);
        validatePhone(phoneNumber);
        
        console.log(`[GSTService] Processing GST response: "${messageText}"`);
        
        // Check if in awaiting GST state
        const inGSTState = await StateManager.isInState(
            tenantId,
            phoneNumber,
            StateManager.STATES.AWAITING_GST
        );
        
        if (!inGSTState) {
            console.log('[GSTService] Not in awaiting GST state, skipping');
            return { handled: false, preference: null, gstNumber: null, message: null };
        }
        
        // Pattern 1: Check for "no GST"
        if (isNoGSTResponse(messageText)) {
            console.log('[GSTService] Detected "no GST" preference');
            
            await CustomerService.saveGSTPreference(tenantId, phoneNumber, 'no_gst', null);
            await StateManager.transitionToCheckoutReady(tenantId, phoneNumber);
            
            return {
                handled: true,
                preference: 'no_gst',
                gstNumber: null,
                message: '✓ Noted - proceeding without GST. Your order is ready for checkout!'
            };
        }
        
        // Pattern 2: Check for GST number
        const gstNumber = extractGSTNumber(messageText);
        if (gstNumber) {
            console.log(`[GSTService] Valid GST number detected: ${gstNumber}`);
            
            await CustomerService.saveGSTPreference(tenantId, phoneNumber, 'with_gst', gstNumber);
            await StateManager.transitionToCheckoutReady(tenantId, phoneNumber);
            
            return {
                handled: true,
                preference: 'with_gst',
                gstNumber: gstNumber,
                message: `✓ GST number saved: ${gstNumber}\nYour order is ready for checkout!`
            };
        }
        
        // Pattern 3: Check for "with GST" (but no number yet)
        if (isWithGSTResponse(messageText)) {
            console.log('[GSTService] Detected "with GST" but no number');
            
            return {
                handled: true,
                preference: null,
                gstNumber: null,
                message: 'Please provide your 15-digit GST number.\n\nFormat: 22AAAAA0000A1Z5'
            };
        }
        
        // Pattern 4: Invalid format
        console.log('[GSTService] Invalid GST response format');
        
        return {
            handled: true,
            preference: null,
            gstNumber: null,
            message: 'I didn\'t understand that. Please reply with:\n\n' +
                    '• Your 15-digit GST number (e.g., 22AAAAA0000A1Z5)\n' +
                    '• "No GST" if you don\'t have one'
        };
        
    } catch (error) {
        console.error('[GSTService] handleGSTResponse failed:', error.message);
        throw error;
    }
}

/**
 * Get GST preference for customer
 * 
 * @param {string} tenantId - Tenant UUID
 * @param {string} phoneNumber - Customer phone
 * @returns {Promise<{preference: string|null, gstNumber: string|null}>}
 */
async function getGSTPreference(tenantId, phoneNumber) {
    try {
        return await CustomerService.getGSTPreference(tenantId, phoneNumber);
    } catch (error) {
        console.error('[GSTService] getGSTPreference failed:', error.message);
        return { preference: null, gstNumber: null };
    }
}

/**
 * Check if GST collection is needed for checkout
 * Returns true if we should ask for GST
 * 
 * @param {string} tenantId - Tenant UUID
 * @param {string} phoneNumber - Customer phone
 * @returns {Promise<boolean>}
 */
async function needsGSTCollection(tenantId, phoneNumber) {
    try {
        const { preference } = await getGSTPreference(tenantId, phoneNumber);
        
        // If preference is already set (with_gst or no_gst), we don't need to ask
        if (preference && (preference === 'with_gst' || preference === 'no_gst')) {
            console.log(`[GSTService] GST preference already set: ${preference}`);
            return false;
        }
        
        console.log('[GSTService] GST preference not set, collection needed');
        return true;
        
    } catch (error) {
        console.error('[GSTService] needsGSTCollection check failed:', error.message);
        return true; // Default to asking for GST on error
    }
}

/**
 * Format GST details for order confirmation/invoice
 * 
 * @param {string} tenantId - Tenant UUID
 * @param {string} phoneNumber - Customer phone
 * @returns {Promise<string>} Formatted GST text for display
 */
async function formatGSTForDisplay(tenantId, phoneNumber) {
    try {
        const { preference, gstNumber } = await getGSTPreference(tenantId, phoneNumber);
        
        if (preference === 'with_gst' && gstNumber) {
            return `\n📋 *GST Details:*\nGST Number: ${gstNumber}`;
        }
        
        if (preference === 'no_gst') {
            return '\n📋 *GST:* Not applicable';
        }
        
        return ''; // No GST info
        
    } catch (error) {
        console.error('[GSTService] formatGSTForDisplay failed:', error.message);
        return '';
    }
}

module.exports = {
    // Validation
    isValidGSTNumber,
    
    // Pattern detection
    isNoGSTResponse,
    isWithGSTResponse,
    isCheckoutConfirmation,
    extractGSTNumber,
    
    // Core operations
    requestGSTPreference,
    handleGSTResponse,
    getGSTPreference,
    needsGSTCollection,
    formatGSTForDisplay
};
