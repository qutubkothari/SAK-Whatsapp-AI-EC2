// commands/products.js
const whatsappService = require('../services/whatsappService');
// const productService = require('../services/productService');

exports.handle = async ({ from }) => {
  // prompt-driven WhatsApp flow
  await whatsappService.sendText(from,
    '📦 Send me your products Excel file here to import.\n(Format: name, description, price, sku, etc.)');
  return { ok: true, cmd: 'products' };
};
