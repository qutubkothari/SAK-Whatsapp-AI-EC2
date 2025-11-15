// controllers/userController.js
const whatsappService = require('../services/whatsappService');
// const aiService = require('../services/aiService'); // if you want AI fallback

exports.handle = async (tenant, message) => {
  const from = message.from;
  const raw = (message.text?.body || '').trim();

  // Simple end-user fallback (you can replace with AI or FAQ routing later)
  await whatsappService.sendText(from, `Thanks! Our team will get back to you.\n(You sent: "${raw}")`);
  return { ok: true, handled: 'user-fallback' };
};
