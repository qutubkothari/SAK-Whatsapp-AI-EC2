// Test discount pattern detection
const testMessages = [
  'any discount?',
  'koi discount?',
  'some discount?',
  'can i get a discount?',
  'give me discount',
  'best price?',
  'discount milega?',
  '5% discount'
];

const hasDiscountRequest = (messageText) => {
  return /\b(?:give|can|discount|reduce|lower|best|final|last|kam|any)\s*(?:me|you|us|i|we)?\s*(?:get|have|give)?\s*(?:some|a|any)?\s*(?:discount|price|rate|better\s+price)/i.test(messageText) ||
         /^discount\??$/i.test(messageText) ||
         /\d+\s*(?:%|percent|percentage)/i.test(messageText) ||
         /^(?:give\s*me\s*)?more$/i.test(messageText) ||
         /^(?:aur|zyada)$/i.test(messageText) ||
         /(?:give|make|can you do|do)\s*(?:me|it|for)?\s*(?:at|for|@)?\s*(?:₹|rs\.?)?\s*\d+(?:\.\d+)?/i.test(messageText) ||
         /\d+(?:\.\d+)?\s*(?:₹|rs\.?|rupees?)/i.test(messageText) ||
         /can\s+(?:i|we|you)\s+(?:get|have|give\s+me)\s+(?:a|any|some)?\s*discount/i.test(messageText) ||
         /\b(?:any|koi|some)\s+discount/i.test(messageText);
};

console.log('Testing Discount Pattern Detection:\n');
testMessages.forEach(msg => {
  const result = hasDiscountRequest(msg);
  console.log(`'${msg}' -> ${result ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
});
