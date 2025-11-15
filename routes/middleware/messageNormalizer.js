// routes/middleware/messageNormalizer.js
const debug = require('../../services/debug');

/**
 * Normalizes incoming Maytapi webhooks into a consistent format
 */
const messageNormalizer = (req, res, next) => {
  // Skip processing for ACK/delivery receipts
  if (req.body.type === 'ack') {
    return res.status(200).json({ status: 'ack_received' });
  }
  // Immediately respond to ACK type messages
  if (req.body.type === 'ack') {
    return res.status(200).json({ status: 'ack_received' });
  }
  console.log('[NORMALIZER_ENTRY] ===== ENTERING messageNormalizer =====');
  const rid = req._rid;
  debug.trace(rid, 'normalizer.start');

  if (process.env.DEBUG_WEBHOOK === '1') {
    console.log('[WEBHOOK_IN]', JSON.stringify(req.body).slice(0, 2000));
  }

  const b = req.body || {};
  console.log('[NORMALIZER] Request body type:', b.message?.type, 'from:', b.message?.from);
  let normalized = b;

  // Handle nested message structure and always set from/to if missing
  if (b.message) {
    const m = b.message || {};
    const rawText = typeof m.text === 'string'
      ? m.text
      : (m.text && typeof m.text.body === 'string' ? m.text.body : '');

    // Extract WhatsApp profile name if available
    let waProfileName = null;
    if (m.profile && m.profile.name) {
      waProfileName = m.profile.name;
    } else if (b.profile && b.profile.name) {
      waProfileName = b.profile.name;
    }

    // Robust fallback for 'from' and 'to'
    let from = b.from || m.from || b.user?.id || b.conversation || b.profile?.id || m.profile?.id || null;
    let to = b.to || m.to || b.receiver || b.profile?.receiver || m.profile?.receiver || null;
    // If still missing, try to extract from nested objects
    if (!from && typeof b === 'object') {
      from = b.user?.id || b.conversation || b.phone_id || null;
    }
    if (!to && typeof b === 'object') {
      to = b.receiver || b.phone_id || null;
    }

    normalized = {
      from,
      to,
      type: m.type || (rawText ? 'text' : m.type),
      text: rawText ? { body: rawText } : (m.text || b.text || null),

      // Preserve document/image metadata
      document: (m.type === 'document')
        ? { url: m.url, mime: m.mime, filename: m.filename, caption: m.caption }
        : (b.document || undefined),

      image: (m.type === 'image' || m.type === 'media')
        ? { url: m.url, mime: m.mime, filename: m.filename }
        : (b.image || undefined),

      // Keep useful upstream fields
      product_id: b.product_id,
      phone_id: b.phone_id,
      reply: b.reply,
      timestamp: b.timestamp,

      // WhatsApp profile name for human-like greeting
      wa_profile_name: waProfileName,

      // Store original for debugging
      _original: b
    };
  }

  // Ensure text has proper structure
  if (normalized?.type === 'text' && normalized.text && typeof normalized.text.body !== 'string') {
    normalized.text = { body: String(normalized.text.body || '') };
  }

  // Basic validation
  // Only enforce from/to validation for customer messages
  const customerTypes = ['text', 'image', 'document', 'media', 'audio', 'video'];
  if (customerTypes.includes(normalized.type)) {
    if (!normalized.from || !normalized.to) {
      console.log('[NORMALIZER] Validation failed - missing from/to:', { from: normalized.from, to: normalized.to });
      console.log('[NORMALIZER] Full incoming payload:', JSON.stringify(req.body, null, 2));
      debug.trace(rid, 'normalizer.invalid', { from: normalized.from, to: normalized.to });
      return res.status(200).json({ ok: false, error: 'invalid-format' });
    }
  }

  // Store normalized message
  req.body = normalized;
  req.message = normalized;

  debug.trace(rid, 'normalizer.done', {
    from: normalized.from,
    to: normalized.to,
    type: normalized.type,
    hasText: !!(normalized.text && normalized.text.body),
    hasImage: !!normalized.image,
    hasDoc: !!(normalized.document && normalized.document.url)
  });

  console.log('[NORMALIZER_EXIT] ===== CALLING next() =====', { type: normalized.type });
  next();
};

module.exports = messageNormalizer;