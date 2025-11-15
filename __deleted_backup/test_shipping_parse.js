const { parseShippingInfo } = require('../services/shippingInfoService');

// Test the exact format from the user
const testMessage = `Shipping Address :
B177 ,Pushparaj Estate , Ahmedabad 380001
Transporter Details 
ACPL Tranport
Transporter Contact 
919106886259`;

console.log('Testing shipping info parsing...\n');
console.log('Input message:');
console.log(testMessage);
console.log('\n---\n');

const result = parseShippingInfo(testMessage);

console.log('Parsed result:');
console.log(JSON.stringify(result, null, 2));
console.log('\n---\n');

console.log('Expected:');
console.log({
  shippingAddress: 'B177 ,Pushparaj Estate , Ahmedabad 380001',
  transporterName: 'ACPL Tranport',
  transporterContact: '919106886259'
});
