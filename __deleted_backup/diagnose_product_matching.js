/**
 * DIAGNOSTIC SCRIPT: Product Matching Issue
 * 
 * This script will help identify why "price for 8x80, 8x100, 10x100" 
 * returns "No matching products found"
 * 
 * Run this with: node diagnose_product_matching.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TENANT_ID = 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6'; // Your tenant ID from chat history

async function diagnoseProductMatching() {
  console.log('\n🔍 DIAGNOSTIC: Product Matching Issue\n');
  console.log('=' .repeat(60));
  
  // Step 1: Check if products table has data
  console.log('\n📊 STEP 1: Checking products table...\n');
  
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('id, name, sku, description, price, tenant_id')
    .eq('tenant_id', TENANT_ID)
    .limit(10);
  
  if (allError) {
    console.error('❌ ERROR querying products:', allError.message);
    return;
  }
  
  if (!allProducts || allProducts.length === 0) {
    console.error('❌ NO PRODUCTS FOUND for tenant:', TENANT_ID);
    console.log('\n💡 Solution: Add products to your database first!');
    return;
  }
  
  console.log(`✅ Found ${allProducts.length} products (showing first 10):`);
  allProducts.forEach(p => {
    console.log(`   - ID: ${p.id}`);
    console.log(`     Name: "${p.name}"`);
    console.log(`     SKU: "${p.sku || 'N/A'}"`);
    console.log(`     Price: ₹${p.price}`);
    console.log('');
  });
  
  // Step 2: Test different search patterns
  console.log('\n🔎 STEP 2: Testing search patterns for "8x80"...\n');
  
  const searchTerms = ['8x80', '8X80', '8 x 80', '8*80', '80'];
  
  for (const term of searchTerms) {
    console.log(`\n   Testing: "${term}"`);
    
    // Test exact match on name
    const { data: exactName } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('tenant_id', TENANT_ID)
      .eq('name', term);
    
    if (exactName && exactName.length > 0) {
      console.log(`   ✅ EXACT NAME MATCH: Found ${exactName.length} products`);
      exactName.forEach(p => console.log(`      - "${p.name}" (₹${p.price})`));
    }
    
    // Test exact match on SKU
    const { data: exactSKU } = await supabase
      .from('products')
      .select('id, name, sku, price')
      .eq('tenant_id', TENANT_ID)
      .eq('sku', term);
    
    if (exactSKU && exactSKU.length > 0) {
      console.log(`   ✅ EXACT SKU MATCH: Found ${exactSKU.length} products`);
      exactSKU.forEach(p => console.log(`      - "${p.name}" [${p.sku}] (₹${p.price})`));
    }
    
    // Test partial match using LIKE
    const { data: likeName } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('tenant_id', TENANT_ID)
      .ilike('name', `%${term}%`);
    
    if (likeName && likeName.length > 0) {
      console.log(`   ✅ PARTIAL NAME MATCH: Found ${likeName.length} products`);
      likeName.forEach(p => console.log(`      - "${p.name}" (₹${p.price})`));
    }
    
    // Test partial match on SKU
    const { data: likeSKU } = await supabase
      .from('products')
      .select('id, name, sku, price')
      .eq('tenant_id', TENANT_ID)
      .ilike('sku', `%${term}%`);
    
    if (likeSKU && likeSKU.length > 0) {
      console.log(`   ✅ PARTIAL SKU MATCH: Found ${likeSKU.length} products`);
      likeSKU.forEach(p => console.log(`      - "${p.name}" [${p.sku}] (₹${p.price})`));
    }
  }
  
  // Step 3: Show the query your code should use
  console.log('\n\n📋 STEP 3: Recommended Query Pattern\n');
  console.log('=' .repeat(60));
  
  const testQuery = `
SELECT id, name, sku, description, price, packaging_unit, units_per_carton
FROM products
WHERE tenant_id = '${TENANT_ID}'
  AND (
    name ILIKE '%8x80%' 
    OR sku ILIKE '%8x80%'
    OR description ILIKE '%8x80%'
  );
`;
  
  console.log('Use this query pattern in smartResponseRouter.js:');
  console.log(testQuery);
  
  // Step 4: Test the actual query
  console.log('\n🧪 STEP 4: Testing recommended query...\n');
  
  const testTerms = ['8x80', '8x100', '10x100'];
  
  for (const term of testTerms) {
    const { data: results } = await supabase
      .from('products')
      .select('id, name, sku, price, packaging_unit, units_per_carton')
      .eq('tenant_id', TENANT_ID)
      .or(`name.ilike.%${term}%,sku.ilike.%${term}%,description.ilike.%${term}%`);
    
    if (results && results.length > 0) {
      console.log(`✅ Found ${results.length} product(s) for "${term}":`);
      results.forEach(p => {
        const displayName = p.name || p.sku || 'Unknown';
        console.log(`   - ${displayName} = ₹${p.price}/${p.packaging_unit || 'unit'}`);
      });
    } else {
      console.log(`❌ No products found for "${term}"`);
    }
  }
  
  // Step 5: Check what smartResponseRouter might be doing wrong
  console.log('\n\n🔧 STEP 5: Common Issues in smartResponseRouter.js\n');
  console.log('=' .repeat(60));
  console.log(`
Common problems that cause "No matching products found":

1. ❌ Missing tenant_id filter
   Fix: Always include .eq('tenant_id', '${TENANT_ID}')

2. ❌ Exact match instead of partial match
   Wrong: .eq('name', '8x80')
   Right: .ilike('name', '%8x80%')

3. ❌ Only searching 'name' column
   Fix: Search name, sku, AND description using OR

4. ❌ Case-sensitive search
   Wrong: .like('name', '%8x80%')
   Right: .ilike('name', '%8x80%')  // 'i' = case-insensitive

5. ❌ Not handling multiple products in one query
   Message: "price for 8x80, 8x100, 10x100"
   Should extract: ['8x80', '8x100', '10x100']
   And search for each term separately
`);
  
  console.log('\n✅ DIAGNOSTIC COMPLETE\n');
  console.log('=' .repeat(60));
}

// Run diagnostics
diagnoseProductMatching()
  .then(() => {
    console.log('\n✅ Diagnostic complete! Check the output above.\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Diagnostic failed:', err.message);
    process.exit(1);
  });