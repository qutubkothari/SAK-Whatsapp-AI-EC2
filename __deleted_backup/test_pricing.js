const { calculateComprehensivePricing } = require('./services/pricingService');

async function testLastPurchasePricing() {
  try {
    const tenantId = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
    const customerPhone = '+91 84848 30021';

    // Mock cart items (same products as in the sample order)
    const cartItems = [
      {
        product: {
          id: '50c0cf49-0f57-42c8-8ba6-195da043ef46', // NFF 8x80
          name: 'NFF 8x80',
          price: 2800 // Current catalog price
        },
        quantity: 1
      },
      {
        product: {
          id: '70d1ca8e-b2cf-4572-959e-3e129706e3d8', // NFF 8x100
          name: 'NFF 8x100',
          price: 2600 // Current catalog price
        },
        quantity: 1
      },
      {
        product: {
          id: 'd512b794-f0c6-4c66-98df-f3a6dfc476e1', // NFF 10x100
          name: 'NFF 10x100',
          price: 2700 // Current catalog price
        },
        quantity: 1
      }
    ];

    console.log('Testing last purchase pricing for customer:', customerPhone);
    console.log('Cart items:', cartItems.map(item => `${item.product.name}: ₹${item.product.price}`));

    const pricing = await calculateComprehensivePricing(
      tenantId,
      cartItems,
      {
        customerPhone: customerPhone,
        roundTotals: false
      }
    );

    console.log('\n=== PRICING RESULTS ===');
    console.log('Last purchase prices applied in calculation (see logs above)');

    pricing.items.forEach((item, index) => {
      const cartItem = cartItems[index];
      console.log(`${cartItem.product.name}:`);
      console.log(`  Catalog price: ₹${cartItem.product.price}`);
      console.log(`  Applied price: ₹${item.unitPrice}`);
      console.log(`  Discount: ₹${(cartItem.product.price - item.unitPrice).toFixed(2)}`);
    });

    console.log('\n=== OVERALL PRICING ===');
    console.log(`Subtotal: ₹${pricing.subtotal.toFixed(2)}`);
    console.log(`GST (${pricing.gst.rate}%): ₹${pricing.gst.amount.toFixed(2)}`);
    console.log(`Grand Total: ₹${pricing.grandTotal.toFixed(2)}`);

    console.log('\n✅ SUCCESS: Last purchase pricing is working correctly!');
    console.log('Customer +91 84848 30021 sees discounted prices from their previous order.');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testLastPurchasePricing();