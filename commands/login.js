// commands/login.js
const whatsappService = require('../services/whatsappService');
const webAuth = require('../services/webAuthService');

exports.handle = async ({ tenant, from }) => {
  console.log('[LOGIN_CMD] /login command received', { tenantId: tenant && tenant.id, from });
  try {
    // Use the real magic login link generator
    const message = await webAuth.generateLoginLink(tenant.id);
    console.log('[LOGIN_CMD] Generated login message:', message);
    await whatsappService.sendText(from, message);
    console.log('[LOGIN_CMD] Login message sent to WhatsApp:', from);
    return { ok: true, cmd: 'login' };
  } catch (e) {
    console.error('[LOGIN_CMD] Error in /login handler:', e);
    await whatsappService.sendText(from, 'Could not generate a login link right now.');
    return { ok: false, cmd: 'login', error: e && e.message };
  }
};
