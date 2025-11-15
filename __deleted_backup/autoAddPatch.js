// Enhanced autoAddDiscussedProductToCart replacement
const autoAddDiscussedProductToCart = async (tenantId, endUserPhone, conversation) => {
  try {
    console.log('[AUTO_ADD] Checking if auto-add is needed');

    // If cart already has items -> skip auto-add
    const cartCheck = await checkCartBeforeCheckout(tenantId, endUserPhone);
    if (cartCheck.hasItems) {
      console.log('[AUTO_ADD] Cart already has items, skipping auto-add');
      return { success: true, skipAutoAdd: true };
    }

    // Try to obtain quoted products first (preferred)
    let quotedProducts = null;
    try {
      // attempt to fetch last quoted_products structured message (fallback path used in your logs)
      const { data: structuredMsg } = await supabase
        .from('messages')
        .select('id, payload_json')
        .eq('conversation_id', conversation.id)
        .eq('type', 'quoted_products')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (structuredMsg && structuredMsg.payload_json) {
        quotedProducts = structuredMsg.payload_json.quotedProducts || structuredMsg.payload_json;
      }
    } catch (err) {
      console.warn('[AUTO_ADD] No structured quoted_products message found (ok):', err?.message || err);
      quotedProducts = null;
    }

    // If no structured quotedProducts, try conversation.last_product_discussed fallback (single product)
    if (!quotedProducts && conversation?.last_product_discussed) {
      // convert comma-separated list into simple array of product strings
      const tokens = conversation.last_product_discussed.split(/\s*[,\n]\s*/).map(s => s.trim()).filter(Boolean);
      // create simple objects with product string and default qty=1
      quotedProducts = tokens.map(t => ({ productName: t, quantity: 1, unit: 'cartons', isPieces: false }));
    }

    if (!quotedProducts || quotedProducts.length === 0) {
      console.log('[AUTO_ADD] No quoted products in context');
      return { success: false, message: 'Please specify which product you want to order' };
    }

    console.log('[AUTO_ADD] Auto-adding quotedProducts count:', quotedProducts.length);

    // Use the existing product lookup and cart helpers:
    // findProductByNameOrCode is provided from smartOrderExtractionService
    const { findProductByNameOrCode } = require('./smartOrderExtractionService'); // reliable product lookup
    const { convertPiecesToCartons, addOrUpdateCartItem } = require('./orderProcessingService'); // carton conversion + cart item helper
    const { getConversationId } = require('./historyService');

    const conversationId = await getConversationId(tenantId, endUserPhone);
    if (!conversationId) return { success: false, message: 'No conversation id; cannot add to cart.' };

    // Get or create cart row
    let { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (!cart) {
      const { data: newCart, error: createErr } = await supabase
        .from('carts')
        .insert({ conversation_id: conversationId })
        .select('*')
        .single();
      if (createErr || !newCart) {
        console.error('[AUTO_ADD] Could not create cart:', createErr);
        return { success: false, message: 'Could not create cart.' };
      }
      cart = newCart;
    }

    // Iterate and add each quoted product properly
    for (const qp of quotedProducts) {
      // normalise fields: qp may be {productCode, productName, quantity, isPieces}
      const lookupKey = qp.productCode || qp.productName || qp.product;
      if (!lookupKey) {
        console.warn('[AUTO_ADD] skipping malformed quotedProduct:', qp);
        continue;
      }

      const product = await findProductByNameOrCode(tenantId, lookupKey);
      if (!product) {
        console.warn('[AUTO_ADD] product not found for:', lookupKey);
        continue;
      }

      // Determine final cartons to add
      let finalCartons = 0;
      if (qp.isPieces === true) {
        // convert pieces to cartons (returns finalQuantity in cartons)
        const conv = await convertPiecesToCartons(product, qp.quantity); // expects product and pieces
        finalCartons = conv.finalQuantity;
      } else {
        finalCartons = qp.quantity || 1;
      }

      if (finalCartons <= 0) continue;

      // Add or update cart item (uses provided helper which updates if exists)
      const addResult = await addOrUpdateCartItem(cart.id, product.id, finalCartons);
      if (!addResult || !addResult.success) {
        console.warn('[AUTO_ADD] failed to add item to cart:', product.name, addResult);
      } else {
        console.log('[AUTO_ADD] added to cart:', product.name, 'qty(cartons)=', finalCartons);
      }
    }

    // re-check cart to confirm items were added
    const recheck = await checkCartBeforeCheckout(tenantId, endUserPhone);
    if (!recheck.hasItems) {
      return { success: false, message: 'Auto-add failed — cart still empty' };
    }

    return { success: true, message: 'Auto-added discussed products to cart' };

  } catch (error) {
    console.error('[AUTO_ADD] Error auto-adding discussed product to cart:', error.message);
    return { success: false, message: 'Error adding product to cart automatically' };
  }
};
