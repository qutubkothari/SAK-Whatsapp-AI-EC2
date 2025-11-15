// =============================================
// FILE: utils/phoneUtils.js
// Centralized phone normalization to prevent duplicates
// =============================================

/**
 * Normalize phone number for database operations
 * Removes WhatsApp suffixes (@c.us, @s.whatsapp.net) and non-digits
 * 
 * @param {string} phoneNumber - Raw phone from WhatsApp
 * @returns {string} - Normalized phone: 919106886259
 */
function normalizePhone(phoneNumber) {
    if (!phoneNumber) return '';
    
    return phoneNumber
        .toString()
        .replace(/@.*$/, '')        // Remove @c.us, @s.whatsapp.net
        .replace(/\D/g, '')         // Remove all non-digits
        .trim();
}

/**
 * Get WhatsApp format (with @c.us suffix)
 * 
 * @param {string} phoneNumber - Any phone format
 * @returns {string} - WhatsApp format: 919106886259@c.us
 */
function toWhatsAppFormat(phoneNumber) {
    const normalized = normalizePhone(phoneNumber);
    if (!normalized) return '';
    
    // Only add @c.us if not already present
    return normalized.includes('@') ? normalized : `${normalized}@c.us`;
}

/**
 * Check if two phone numbers are the same
 * 
 * @param {string} phone1 
 * @param {string} phone2 
 * @returns {boolean}
 */
function phonesMatch(phone1, phone2) {
    return normalizePhone(phone1) === normalizePhone(phone2);
}

// Legacy aliases for backward compatibility
const normalizePhoneForDB = normalizePhone;
const formatPhoneForDisplay = (phoneNumber) => {
    if (!phoneNumber) return phoneNumber;
    
    const normalized = normalizePhone(phoneNumber);
    if (normalized.startsWith('91') && normalized.length === 12) {
        const number = normalized.substring(2);
        return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
    }
    
    return phoneNumber;
};

module.exports = {
    normalizePhone,
    toWhatsAppFormat,
    phonesMatch,
    // Legacy exports
    normalizePhoneForDB,
    formatPhoneForDisplay
};