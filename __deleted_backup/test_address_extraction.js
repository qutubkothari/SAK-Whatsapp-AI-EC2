// Test address extraction logic
const { supabase } = require('../config/database');

/**
 * Extract city, state, and pincode from address string
 */
function extractAddressComponents(address) {
  if (!address) {
    return { city: null, state: null, pincode: null };
  }

  let city = null;
  let state = null;
  let pincode = null;

  // Extract 6-digit pincode
  const pincodeMatch = address.match(/\b\d{6}\b/);
  if (pincodeMatch) {
    pincode = pincodeMatch[0];
  }

  // Common Indian states (partial list)
  const states = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat',
    'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Madhya Pradesh',
    'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana',
    'Bihar', 'Odisha', 'Assam', 'Jharkhand', 'Chhattisgarh', 'Goa'
  ];

  // Try to find state name
  for (const stateName of states) {
    const regex = new RegExp(`\\b${stateName}\\b`, 'i');
    if (regex.test(address)) {
      state = stateName;
      break;
    }
  }

  // Extract city - look for word before state or pincode
  const cityPatterns = [
    // "Pune, Maharashtra" or "Pune Maharashtra"
    new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s*,?\\s*${state}`, 'i'),
    // "Pune 411060" or "Pune - 411060"
    new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s*[-,]?\\s*${pincode}`, 'i'),
    // Fallback: Last word before pincode/state
    /,\s*([A-Za-z\s]+?)\s*[-,]?\s*\d{6}/,
    /,\s*([A-Za-z\s]+?)\s*$/
  ];

  for (const pattern of cityPatterns) {
    const match = address.match(pattern);
    if (match && match[1]) {
      city = match[1].trim();
      break;
    }
  }

  return { city, state, pincode };
}

// Test cases
const testAddresses = [
  {
    input: "D903 , Elina Living ,NIBM ,Pune 411060",
    expected: { city: "Pune", state: null, pincode: "411060" }
  },
  {
    input: "123 Main Street, Mumbai, Maharashtra - 400001",
    expected: { city: "Mumbai", state: "Maharashtra", pincode: "400001" }
  },
  {
    input: "Flat 5B, Brigade Road, Bangalore, Karnataka 560001",
    expected: { city: "Bangalore", state: "Karnataka", pincode: "560001" }
  },
  {
    input: "of Principal Place of, Business, SURVEY NO. 32, GODOWN NO. 547/1, NEAR KONDHWA PISOLI, ROAD, PUNE, Pune, Maharashtra, 411048",
    expected: { city: "Pune", state: "Maharashtra", pincode: "411048" }
  },
  {
    input: "456 Park Avenue, Delhi 110001",
    expected: { city: "Delhi", state: "Delhi", pincode: "110001" }
  },
  {
    input: "789 Lake View, Hyderabad, Telangana - 500032",
    expected: { city: "Hyderabad", state: "Telangana", pincode: "500032" }
  }
];

console.log('=== Address Extraction Tests ===\n');

let passed = 0;
let failed = 0;

testAddresses.forEach((test, index) => {
  console.log(`\nTest ${index + 1}:`);
  console.log(`Input: "${test.input}"`);
  
  const result = extractAddressComponents(test.input);
  
  console.log(`Result:`, result);
  console.log(`Expected:`, test.expected);
  
  const cityMatch = result.city === test.expected.city || 
                    (result.city && test.expected.city && result.city.toLowerCase().includes(test.expected.city.toLowerCase()));
  const stateMatch = result.state === test.expected.state;
  const pincodeMatch = result.pincode === test.expected.pincode;
  
  if (cityMatch && stateMatch && pincodeMatch) {
    console.log('✅ PASS');
    passed++;
  } else {
    console.log('❌ FAIL');
    if (!cityMatch) console.log(`  City mismatch: got "${result.city}", expected "${test.expected.city}"`);
    if (!stateMatch) console.log(`  State mismatch: got "${result.state}", expected "${test.expected.state}"`);
    if (!pincodeMatch) console.log(`  Pincode mismatch: got "${result.pincode}", expected "${test.expected.pincode}"`);
    failed++;
  }
});

console.log('\n=== Test Summary ===');
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);

process.exit(failed > 0 ? 1 : 0);
