// commands/status.js
const whatsappService = require('../services/whatsappService');
const { checkSubscriptionStatus } = require('../services/subscriptionService');

exports.handle = async ({ tenant, from }) => {
  try {
    const r = await checkSubscriptionStatus(tenant.id);
    await whatsappService.sendText(from, r.message || 'Status unavailable.');
    return { ok: true, cmd: 'status' };
  } catch (e) {
    console.error('[cmd/status]', e);
    await whatsappService.sendText(from, 'Could not fetch status right now.');
    return { ok: false, cmd: 'status' };
  }
};
