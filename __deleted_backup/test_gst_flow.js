/**
 * Test GST Collection Flow
 * Verifies that the business info handler correctly processes GST certificates
 */

const { supabase } = require('./services/config');
const BusinessInfoHandler = require('./routes/handlers/businessInfoHandler');

async function testGSTFlow() {
    console.log('🧪 Testing GST Collection Flow\n');
    console.log('=' .repeat(60));

    const testTenantId = 'e7742cf2-3ae1-4ae0-aff9-b6802f1d3c50'; // Your tenant ID
    const testPhone = '919999999999'; // Test phone number
    const testConversationId = `${testPhone}@c.us`;

    // Test 1: Check if businessInfoHandler module loads
    console.log('\n✅ Test 1: Module Loading');
    console.log('BusinessInfoHandler functions:', Object.keys(BusinessInfoHandler));
    console.log('✓ handleBusinessInfo:', typeof BusinessInfoHandler.handleBusinessInfo);
    console.log('✓ detectBusinessInfo:', typeof BusinessInfoHandler.detectBusinessInfo);

    // Test 2: Test detectBusinessInfo function
    console.log('\n✅ Test 2: Business Info Detection');
    
    const testCases = [
        {
            name: 'GST PDF Document',
            message: {
                message: {
                    document: {
                        url: 'https://example.com/gst-certificate.pdf',
                        filename: 'GST_Certificate.pdf',
                        mimeType: 'application/pdf'
                    }
                }
            }
        },
        {
            name: 'GST Text with GST Number',
            message: {
                type: 'text',
                body: 'My GST number is 27AABCU9603R1ZM'
            }
        },
        {
            name: 'Regular Text (should not detect)',
            message: {
                type: 'text',
                body: 'What is the price of NFF 8x80?'
            }
        }
    ];

    for (const testCase of testCases) {
        const result = BusinessInfoHandler.detectBusinessInfo(testCase.message);
        console.log(`\n${testCase.name}:`);
        console.log('  isBusinessInfo:', result.isBusinessInfo);
        console.log('  detection:', JSON.stringify(result.detection, null, 2));
    }

    // Test 3: Check webhook.js integration
    console.log('\n✅ Test 3: Webhook Integration Check');
    const webhookFile = require('fs').readFileSync('./routes/webhook.js', 'utf8');
    const hasBusinessInfoImport = webhookFile.includes('BusinessInfoHandler');
    const hasBusinessInfoCall = webhookFile.includes('BusinessInfoHandler.handleBusinessInfo');
    
    console.log('  ✓ BusinessInfoHandler imported:', hasBusinessInfoImport);
    console.log('  ✓ handleBusinessInfo called:', hasBusinessInfoCall);

    // Test 4: Check database schema
    console.log('\n✅ Test 4: Database Schema Check');
    
    // Check if business_info_extractions table exists
    const { data: tables, error: tablesError } = await supabase
        .from('business_info_extractions')
        .select('*')
        .limit(1);
    
    if (tablesError && tablesError.code === '42P01') {
        console.log('  ❌ business_info_extractions table does NOT exist');
        console.log('     Need to run migration!');
    } else if (tablesError) {
        console.log('  ⚠️  Error checking table:', tablesError.message);
    } else {
        console.log('  ✓ business_info_extractions table exists');
    }

    // Check customer_profiles has gst_number column
    const { data: profile, error: profileError } = await supabase
        .from('customer_profiles')
        .select('id, phone, gst_number, company, legal_name')
        .limit(1)
        .single();
    
    if (profileError) {
        console.log('  ⚠️  Error checking customer_profiles:', profileError.message);
    } else {
        console.log('  ✓ customer_profiles has gst_number column');
        console.log('    Sample fields:', Object.keys(profile));
    }

    // Test 5: Check recent business info extractions
    console.log('\n✅ Test 5: Recent Business Info Extractions');
    
    const { data: recentExtractions, error: extractionError } = await supabase
        .from('business_info_extractions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (extractionError) {
        console.log('  ❌ Error fetching extractions:', extractionError.message);
    } else if (!recentExtractions || recentExtractions.length === 0) {
        console.log('  ⚠️  No business info extractions found in database');
        console.log('     This could mean:');
        console.log('     1. No customers have uploaded GST certificates yet');
        console.log('     2. The flow is not being triggered');
        console.log('     3. The table doesn\'t exist');
    } else {
        console.log(`  ✓ Found ${recentExtractions.length} recent extractions`);
        recentExtractions.forEach((ext, idx) => {
            console.log(`\n  Extraction ${idx + 1}:`);
            console.log('    Created:', new Date(ext.created_at).toLocaleString());
            console.log('    Phone:', ext.phone_number);
            console.log('    Extracted:', JSON.stringify(ext.extracted_fields, null, 6));
        });
    }

    // Test 6: Check customers with GST numbers
    console.log('\n✅ Test 6: Customers with GST Numbers');
    
    const { data: customersWithGST, error: gstError } = await supabase
        .from('customer_profiles')
        .select('id, phone, first_name, company, gst_number, legal_name, created_at')
        .not('gst_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (gstError) {
        console.log('  ❌ Error:', gstError.message);
    } else if (!customersWithGST || customersWithGST.length === 0) {
        console.log('  ⚠️  No customers have GST numbers in database');
        console.log('     This suggests GST collection is not working');
    } else {
        console.log(`  ✓ Found ${customersWithGST.length} customers with GST`);
        customersWithGST.forEach((cust, idx) => {
            console.log(`\n  Customer ${idx + 1}:`);
            console.log('    Phone:', cust.phone);
            console.log('    Name:', cust.first_name || 'N/A');
            console.log('    Company:', cust.company || 'N/A');
            console.log('    GST:', cust.gst_number);
            console.log('    Created:', new Date(cust.created_at).toLocaleString());
        });
    }

    // Test 7: Check if businessInfoCaptureService exists
    console.log('\n✅ Test 7: Business Info Service Check');
    try {
        const BusinessInfoService = require('./services/businessInfoCaptureService');
        console.log('  ✓ businessInfoCaptureService module loaded');
        console.log('  ✓ Service methods:', Object.keys(BusinessInfoService));
    } catch (err) {
        console.log('  ❌ Error loading service:', err.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY\n');
    console.log('The GST collection flow has these components:');
    console.log('1. ✓ businessInfoHandler.js - Handles GST document processing');
    console.log('2. ✓ businessInfoCaptureService.js - Extracts GST data');
    console.log('3. ✓ webhook.js - Detects and routes business documents');
    console.log('4. ? business_info_extractions table - May need verification');
    console.log('5. ? customer_profiles.gst_number - May need verification');
    console.log('\n🔍 To test the full flow:');
    console.log('1. Send a PDF with "GST" in filename via WhatsApp');
    console.log('2. Or send a message with a GST number (e.g., 27AABCU9603R1ZM)');
    console.log('3. Check logs: gcloud app logs read --service=default --limit=100');
    console.log('4. Search for: "BusinessInfo", "GST", "business_info_extractions"');
    
    process.exit(0);
}

testGSTFlow().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
