/**
 * Test script to verify "2ctns each" pattern matching
 * Run with: node test-pattern-match.js
 */

const testCases = [
    "2ctns each",
    "2 ctns each",
    "each 2 ctns",
    "3 cartons each",
    "5ctns per",
    "give me prices for 8x80, 8x100" // Should NOT match
];

const patterns = [
    { name: 'Pattern 1', regex: /\bmujhe\s+each\s+(\d{1,6})\s*(?:ctns?|cartons?)\s+chahiye\b/i },
    { name: 'Pattern 2', regex: /\b(?:each|har(?:\s*ek)?)\s+(\d{1,6})\s*(?:ctns?|cartons?|pcs|pieces)(?!\s+ki\s+prices?)/i },
    { name: 'Pattern 3', regex: /(\d{1,6})\s*(?:ctns?|cartons?|pcs?|pieces?)\s+(?:each|per)(?!\s+ki\s+prices?)/i },
    { name: 'Pattern 4', regex: /(\d{1,6})\s*(?:ctns?|cartons?)\s*(?:each|per)(?!\s+ki\s+prices?)/i }, // Should match "2ctns each"
    { name: 'Pattern 5', regex: /har(?:\s*product)?\s*(?:ke)?\s*(\d{1,6})\s*(?:ctns?|cartons?|pcs|pieces)(?!\s+ki\s+prices?)/i }
];

console.log('='.repeat(80));
console.log('PATTERN MATCHING TEST FOR "2ctns each"');
console.log('='.repeat(80));

testCases.forEach(testCase => {
    console.log(`\nTesting: "${testCase}"`);
    console.log('-'.repeat(80));
    
    let matched = false;
    patterns.forEach(({ name, regex }) => {
        const match = testCase.match(regex);
        if (match) {
            console.log(`  ✅ ${name} MATCHED!`);
            console.log(`     Full match: "${match[0]}"`);
            console.log(`     Quantity: ${match[1]}`);
            matched = true;
        }
    });
    
    if (!matched) {
        console.log(`  ❌ NO PATTERNS MATCHED`);
    }
});

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));

// Test the specific case
console.log('\n🎯 SPECIFIC TEST: "2ctns each"');
const testQuery = "2ctns each";
const pattern4 = /(\d{1,6})\s*(?:ctns?|cartons?)\s*(?:each|per)(?!\s+ki\s+prices?)/i;
const result = testQuery.match(pattern4);

if (result) {
    console.log('✅ Pattern 4 MATCHES "2ctns each"');
    console.log('   Captured quantity:', result[1]);
} else {
    console.log('❌ Pattern 4 DOES NOT MATCH "2ctns each"');
}
