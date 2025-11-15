const express = require('express');
const router = express.Router();
const { getProductCustomerPrices } = require('../services/personalizedPricingService');

// Get all customer prices for a product
router.get('/api/admin/product/:productId/customer-prices', async (req, res) => {
    const { productId } = req.params;
    const tenantId = req.tenant.id; // From auth middleware

    const prices = await getProductCustomerPrices(tenantId, productId);

    res.json({
        success: true,
        product_id: productId,
        customer_prices: prices
    });
});

module.exports = router;
