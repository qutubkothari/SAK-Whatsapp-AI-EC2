/**
 * Test "give me final price" pattern matching
 */

const testPatterns = [
    "give me final price for 8x80 100 ctns",
    "give me best price for 8x80 100 ctns",
    "give me your price for 10x100 50 cartons",
    "final price for 8x80 100 ctns",
    "give me price for 8x80",
    "give me prices for 8x80, 8x100"
];

const explicitPricePatterns = [
    /^how\s+much\s+for\s+(.+)$/i,
    /^i\s+need\s+prices?\s+for\s+(.+)$/i,
    /^need\s+prices?\s+for\s+(.+)$/i,
    /^i\s+want\s+prices?\s+for\s+(.+)$/i,
    /^want\s+prices?\s+for\s+(.+)$/i,
    /^prices?\s+for\s+(.+)$/i,
    /^give\s+me\s+(?:final|best|your)?\s*prices?\s+for\s+(.+)$/i,  // NEW
    /^tell\s+me\s+prices?\s+for\s+(.+)$/i,
    /^what\s+is\s+prices?\s+for\s+(.+)$/i,
    /^what\s+are\s+prices?\s+for\s+(.+)$/i,
    /^best\s+prices?\s+for\s+(.+)$/i,
    /^final\s+prices?\s+for\s+(.+)$/i,  // NEW
    /^(.+)\s+ki\s+prices?\s+chahiye$/i,
    /^(.+)\s+ka\s+rate\s+batao$/i,
];

console.log('Testing Price Pattern Matching\n');
console.log('='.repeat(60));

testPatterns.forEach(query => {
    console.log(`\nQuery: "${query}"`);
    
    let matched = false;
    for (const pattern of explicitPricePatterns) {
        const match = query.match(pattern);
        if (match && match[1]) {
            console.log(`  ✅ MATCHED: ${pattern}`);
            console.log(`  Captured: "${match[1]}"`);
            
            // Extract product code and quantity
            const productCode = match[1].match(/(\d+[x*]\d+)/i);
            const quantity = match[1].match(/(\d+)\s*(?:cartons?|ctns?)/i);
            
            if (productCode) {
                console.log(`  Product Code: ${productCode[1]}`);
            }
            if (quantity) {
                console.log(`  Quantity: ${quantity[1]} cartons`);
            }
            
            matched = true;
            break;
        }
    }
    
    if (!matched) {
        console.log(`  ❌ NO MATCH`);
    }
});

console.log('\n' + '='.repeat(60));
console.log('\nExpected Results:');
console.log('✅ All queries should match');
console.log('✅ Product codes should be extracted');
console.log('✅ Quantities should be extracted when present');
