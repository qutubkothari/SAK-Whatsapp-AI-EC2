const discountService = require('../services/discountNegotiationService');

(async () => {
  try {
    const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
    const phone = '96567709452@c.us';
    const message = 'discount';
    const conversationContext = {
      id: null,
      quotedProducts: [
        { productCode: '8x80', quantity: 8, price: 2505, unitsPerCarton: 1500 },
        { productCode: '8x100', quantity: 8, price: 2340, unitsPerCarton: 1500 },
        { productCode: '10x100', quantity: 4, price: 2408, unitsPerCarton: 1500 }
      ],
      state: 'idle',
      recentMessages: []
    };

    const res = await discountService.handleDiscountNegotiationV2(tenantId, phone, message, conversationContext);
    console.log('SIMULATION RESULT:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('SIM ERROR:', err);
  }
})();
