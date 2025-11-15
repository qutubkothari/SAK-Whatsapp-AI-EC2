// commands/index.js
const status = require('./status');
const login = require('./login');
const products = require('./products');
const broadcast = require('./broadcast');
const segments = require('./segments');

// Quick Zoho sync handler for testing
const syncZoho = {
  handle: async ({ tenant, from }) => {
    try {
      const { scheduleZohoOrderSync } = require('../services/zohoOrderSyncService');
      console.log('[ADMIN_CMD] /sync-zoho triggered by:', from);
      
      await scheduleZohoOrderSync();
      
      return {
        response: '✅ Zoho order sync completed!\n\nCheck server logs for details.\nThen test: "price for 8x100"',
        shouldReturn: true
      };
    } catch (error) {
      console.error('[ADMIN_CMD] Sync error:', error.message);
      return {
        response: `❌ Sync failed: ${error.message}`,
        shouldReturn: true
      };
    }
  }
};

const REGISTRY = new Map([
  ['/status', status.handle],
  ['/login', login.handle],
  ['/products', products.handle],
  ['/broadcast', broadcast.handle],
  ['/broadcast_to_segment', segments.broadcastToSegment],
  ['/segments', segments.list],
  ['/sync-zoho', syncZoho.handle],
]);

exports.route = async ({ tenant, message }) => {
  const from = message.from;
  const raw = (message.text?.body || '').trim();
  const key = raw.split(/\s+/)[0].toLowerCase();

  const handler = REGISTRY.get(key);
  if (!handler) return null; // controller will run fallback

  // Patch: Pass tenantId for broadcast commands
  if ([
    '/broadcast',
    '/broadcast_now',
    '/broadcast_image',
    '/broadcast_image_now'
  ].includes(key)) {
    return handler({ tenant, message, raw, from, key, tenantId: tenant.id });
  }

  return handler({ tenant, message, raw, from, key });
};
