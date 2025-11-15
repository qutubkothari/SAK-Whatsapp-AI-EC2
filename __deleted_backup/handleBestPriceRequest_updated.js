async function handleBestPriceRequest(tenantId, phoneNumber, conversationContext) {
    try {
        const totalCartons = conversationContext?.totalCartons || 0;
        const isReturningCustomer = conversationContext?.isReturningCustomer || false;
        const products = conversationContext?.products || [];
        
        // Helper to format product discount breakdown
        const formatProductDiscounts = (products, discountPercent) => {
            if (!products || products.length === 0) return null;
            
            // Single product - simple format
            if (products.length === 1) {
                const product = products[0];
                const discountedCartonPrice = product.price * (1 - discountPercent / 100);
                if (product.unitsPerCarton && product.unitsPerCarton > 0) {
                    const pricePerPiece = (discountedCartonPrice / product.unitsPerCarton).toFixed(2);
                    return `₹${pricePerPiece}/pc`;
                }
                return null;
            }
            
            // Multiple products - show breakdown
            const breakdown = products.map(product => {
                const discountedCartonPrice = product.price * (1 - discountPercent / 100);
                if (product.unitsPerCarton && product.unitsPerCarton > 0) {
                    const pricePerPiece = (discountedCartonPrice / product.unitsPerCarton).toFixed(2);
                    const originalPrice = (product.price / product.unitsPerCarton).toFixed(2);
                    return `${product.productCode}: ₹${pricePerPiece}/pc (was ₹${originalPrice}/pc)`;
                }
                return null;
            }).filter(Boolean);
            
            return breakdown.length > 0 ? '\n' + breakdown.join('\n') : null;
        };
        
        let response = "";
        
        if (isReturningCustomer) {
            const discountOffer = 1.5;
            const productBreakdown = formatProductDiscounts(products, discountOffer);
            
            // Natural, appreciative response for loyal customers
            if (productBreakdown) {
                const responses = [
                    `Alright, my absolute best for you:${productBreakdown}\n\nYou're already on personalized pricing, PLUS 1.5% extra off ✨\n\nThat's genuinely the best I can do - deal?`,
                    `Okay, here's what I can offer:\n✨ Your personalized rate + 1.5% discount:${productBreakdown}\n✨ I'll prioritize your order\n\nThat's my final offer for a valued customer like you! 🤝`,
                    `Let me be straight with you - you're already getting great pricing!\n\nBut I can add 1.5% more off:${productBreakdown}\n\nThat's genuinely my max. Sound good?`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            } else {
                const responses = [
                    `Alright, my absolute best for you:\n\nYou're already on personalized pricing, PLUS I'll throw in an extra 1.5% off this order ✨\n\nThat's genuinely the best I can do - deal?`,
                    `Okay, here's what I can offer:\n\n✨ Your personalized rate + 1.5% discount\n✨ I'll prioritize your order\n\nThat's my final offer for a valued customer like you! 🤝`,
                    `Let me be straight with you - you're already getting great pricing!\n\nBut I can add 1.5% more off just for you. That's genuinely my max. Sound good?`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            
            return {
                response,
                approved: true,
                discountPercent: 1.5,
                needsFollowup: false
            };
        }
        
        // For new customers, offer max discount for their slab
        if (totalCartons > 0) {
            const slab = getDiscountSlab(totalCartons);
            const productBreakdown = formatProductDiscounts(products, slab.maxDiscount);
            
            if (productBreakdown) {
                const responses = [
                    `Alright, straight talk - for ${totalCartons} cartons, I can do ${slab.maxDiscount}% off:${productBreakdown}\n\nFair price, good quality. Deal? 👍`,
                    `Here's my best: ${slab.maxDiscount}% discount on ${totalCartons} cartons:${productBreakdown}\n\nThat's the most I can offer at this quantity. Shall we go ahead?`,
                    `Okay, ${totalCartons} cartons - I'll give you ${slab.maxDiscount}% off:${productBreakdown}\n\nThat's genuinely the best rate I can do. Ready to order?`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            } else {
                const responses = [
                    `Alright, straight talk - for ${totalCartons} cartons, I can do ${slab.maxDiscount}% off. That's my max.\n\nFair price, good quality. Deal? 👍`,
                    `Here's my best: ${slab.maxDiscount}% discount on ${totalCartons} cartons.\n\nThat's the most I can offer at this quantity. Shall we go ahead?`,
                    `Okay, ${totalCartons} cartons - I'll give you ${slab.maxDiscount}% off.\n\nThat's genuinely the best rate I can do. Ready to order?`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            
            return {
                response,
                approved: true,
                discountPercent: slab.maxDiscount,
                needsFollowup: false
            };
        }
        
        // No context - ask naturally
        const responses = [
            "I'd love to give you the best price! Just tell me what products and how many cartons - then I can give you my final offer 😊",
            "Sure! What are you looking to order and how much? That way I can work out the absolute best rate for you.",
            "Happy to! Which products and what quantity? Let me know and I'll give you my best pricing 👍"
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
        
        return {
            response,
            approved: false,
            needsFollowup: true
        };
        
    } catch (error) {
        console.error('[DISCOUNT_NEG] Error in best price:', error);
        return {
            response: "Let me know your requirements and I'll give you my best offer!",
            needsFollowup: true
        };
    }
}
