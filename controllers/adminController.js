const { route } = require('../commands');
const whatsappService = require('../services/whatsappService');

const registry = new Map();
// status
registry.set('/status', async ({ tenant, from }) => {
  const { checkSubscriptionStatus } = require('../services/subscriptionService');
  const r = await checkSubscriptionStatus(tenant.id);
  return send(from, r.message);
});
// login
registry.set('/login', async ({ tenant, from }) => {
  const { generateLoginLink } = require('../services/webAuthService');
  const msg = await generateLoginLink(tenant.id);
  return send(from, msg);
});
// products, broadcast, … add compact handlers per file or inline.

module.exports.handle = async (tenant, message) => {
  const from = message.from;
  const raw = (message.text?.body || '').trim();
  const key = raw.split(/\s+/)[0].toLowerCase();
  const handler = registry.get(key);
  if (handler) return handler({ tenant, from, message, raw });

  const res = await route({ tenant, message });
  if (res) return res;

  // default admin fallback
  await whatsappService.sendText(message.from, 'Unknown command. Try /status, /login, /products, /broadcast.');
  return { ok:true, fallback:'admin' };
};
