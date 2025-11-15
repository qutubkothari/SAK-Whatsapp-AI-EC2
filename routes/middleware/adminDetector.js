// routes/middleware/adminDetector.js

/**
 * Middleware to detect if the message sender is an admin/tenant owner
 * This replaces the inline admin detection logic from your original webhook
 */
const adminDetector = (req, res, next) => {
  const { message, tenant } = req;
  
  if (!message || !tenant) {
    req.isAdmin = false;
    return next();
  }

  try {
    const senderRaw = String(message.from || '').toLowerCase();
    const senderDigits = senderRaw.replace(/\D/g, '');

    // Get owner phone number
    const owner = String(tenant.owner_whatsapp_number || '').toLowerCase();
    const ownerDigits = owner.replace(/\D/g, '');
    
    // Get admin phone numbers
    const admins = Array.isArray(tenant.admin_phones) ? tenant.admin_phones : [];

    // Create set of all valid admin identifiers
    const adminSet = new Set(
      admins
        .map(a => String(a || '').toLowerCase())
        .concat(admins.map(a => String(a || '').replace(/\D/g, '')))
        .concat([owner, ownerDigits])
        .filter(Boolean) // Remove empty strings
    );

    // Check if sender matches any admin identifier
    req.isAdmin = adminSet.has(senderRaw) || adminSet.has(senderDigits);
    
    console.log('[ADMIN_DETECTOR]', {
      sender: senderDigits,
      isAdmin: req.isAdmin,
      tenantId: tenant.id
    });

  } catch (e) {
    console.warn('[ADMIN_DETECTOR] Error:', e?.message || e);
    req.isAdmin = false;
  }

  next();
};

module.exports = adminDetector;