// Test phone normalization utilities
const { normalizePhone, toWhatsAppFormat, phonesMatch } = require('../utils/phoneUtils');

console.log('=== Phone Normalization Tests ===\n');

// Test cases
const testCases = [
    {
        input: '919106886259@c.us',
        expectedNormalized: '919106886259',
        expectedWhatsApp: '919106886259@c.us'
    },
    {
        input: '919106886259@s.whatsapp.net',
        expectedNormalized: '919106886259',
        expectedWhatsApp: '919106886259@c.us'
    },
    {
        input: '919106886259',
        expectedNormalized: '919106886259',
        expectedWhatsApp: '919106886259@c.us'
    },
    {
        input: '+91 9106886259',
        expectedNormalized: '919106886259',
        expectedWhatsApp: '919106886259@c.us'
    },
    {
        input: '91-910-6886-259',
        expectedNormalized: '919106886259',
        expectedWhatsApp: '919106886259@c.us'
    }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    console.log(`\nTest ${index + 1}: "${test.input}"`);
    
    const normalized = normalizePhone(test.input);
    const whatsapp = toWhatsAppFormat(test.input);
    
    const normalizedPass = normalized === test.expectedNormalized;
    const whatsappPass = whatsapp === test.expectedWhatsApp;
    
    console.log(`  Normalized: ${normalized} ${normalizedPass ? '✅' : '❌ Expected: ' + test.expectedNormalized}`);
    console.log(`  WhatsApp:   ${whatsapp} ${whatsappPass ? '✅' : '❌ Expected: ' + test.expectedWhatsApp}`);
    
    if (normalizedPass && whatsappPass) {
        passed++;
    } else {
        failed++;
    }
});

// Test phonesMatch
console.log('\n\n=== Phone Matching Tests ===\n');

const matchTests = [
    ['919106886259@c.us', '919106886259', true],
    ['919106886259@s.whatsapp.net', '919106886259@c.us', true],
    ['+91 9106886259', '919106886259', true],
    ['919106886259', '918484830021', false]
];

matchTests.forEach((test, index) => {
    const [phone1, phone2, expected] = test;
    const result = phonesMatch(phone1, phone2);
    const pass = result === expected;
    
    console.log(`Test ${index + 1}: phonesMatch("${phone1}", "${phone2}")`);
    console.log(`  Result: ${result} ${pass ? '✅' : '❌ Expected: ' + expected}\n`);
    
    if (pass) {
        passed++;
    } else {
        failed++;
    }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);

process.exit(failed > 0 ? 1 : 0);
