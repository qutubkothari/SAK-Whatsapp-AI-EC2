require('dotenv').config();
const axios = require('axios');

/**
 * Test Zoho Integration with New Organization
 */

async function testZohoIntegration() {
  console.log('\n🔍 Testing Zoho Integration...\n');
  
  const config = {
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    refreshToken: process.env.ZOHO_REFRESH_TOKEN,
    accessToken: process.env.ZOHO_ACCESS_TOKEN,
    orgId: process.env.ZOHO_ORG_ID,
    accountsUrl: process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in',
    apiUrl: process.env.ZOHO_API_URL || 'https://www.zohoapis.in'
  };

  console.log('Configuration:');
  console.log(`  Client ID: ${config.clientId ? config.clientId.substring(0, 20) + '...' : 'NOT SET'}`);
  console.log(`  Client Secret: ${config.clientSecret ? '***' + config.clientSecret.slice(-4) : 'NOT SET'}`);
  console.log(`  Refresh Token: ${config.refreshToken ? '***' + config.refreshToken.slice(-4) : 'NOT SET'}`);
  console.log(`  Access Token: ${config.accessToken ? '***' + config.accessToken.slice(-4) : 'NOT SET'}`);
  console.log(`  Org ID: ${config.orgId}`);
  console.log(`  Accounts URL: ${config.accountsUrl}`);
  console.log(`  API URL: ${config.apiUrl}\n`);

  // Test 1: Refresh Access Token
  console.log('📝 Test 1: Refreshing Access Token...');
  try {
    const tokenResponse = await axios.post(`${config.accountsUrl}/oauth/v2/token`, null, {
      params: {
        refresh_token: config.refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'refresh_token'
      }
    });

    const newAccessToken = tokenResponse.data.access_token;
    console.log(`✅ Token refreshed successfully`);
    console.log(`   New Access Token: ***${newAccessToken.slice(-8)}`);
    console.log(`   Expires in: ${tokenResponse.data.expires_in} seconds\n`);

    // Use the new token for subsequent tests
    config.accessToken = newAccessToken;
  } catch (error) {
    console.error('❌ Failed to refresh token:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    console.error(`   Details: ${JSON.stringify(error.response?.data, null, 2)}\n`);
    return;
  }

  // Test 2: Get Organization Info
  console.log('📝 Test 2: Fetching Organization Info...');
  try {
    const orgResponse = await axios.get(`${config.apiUrl}/crm/v2/org`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${config.accessToken}`
      }
    });

    const orgInfo = orgResponse.data.org[0];
    console.log('✅ Organization info retrieved:');
    console.log(`   Company Name: ${orgInfo.company_name}`);
    console.log(`   Org ID: ${orgInfo.zgid}`);
    console.log(`   Time Zone: ${orgInfo.time_zone}`);
    console.log(`   Currency: ${orgInfo.currency_symbol} (${orgInfo.currency_locale})`);
    console.log(`   Country: ${orgInfo.country}\n`);
  } catch (error) {
    console.error('❌ Failed to fetch organization info:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    console.error(`   Details: ${JSON.stringify(error.response?.data, null, 2)}\n`);
  }

  // Test 3: List Products
  console.log('📝 Test 3: Fetching Products from CRM...');
  try {
    const productsResponse = await axios.get(`${config.apiUrl}/crm/v2/Products`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${config.accessToken}`
      },
      params: {
        page: 1,
        per_page: 5
      }
    });

    const products = productsResponse.data.data;
    console.log(`✅ Retrieved ${products?.length || 0} products (showing first 5):`);
    if (products && products.length > 0) {
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.Product_Name} (${product.Product_Code || 'No Code'})`);
        console.log(`      Price: ${product.Unit_Price || 'N/A'}`);
        console.log(`      Stock: ${product.Qty_in_Stock || 'N/A'}`);
      });
    } else {
      console.log('   No products found in CRM');
    }
    console.log();
  } catch (error) {
    console.error('❌ Failed to fetch products:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    console.error(`   Details: ${JSON.stringify(error.response?.data, null, 2)}\n`);
  }

  // Test 4: List Contacts
  console.log('📝 Test 4: Fetching Contacts from CRM...');
  try {
    const contactsResponse = await axios.get(`${config.apiUrl}/crm/v2/Contacts`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${config.accessToken}`
      },
      params: {
        page: 1,
        per_page: 3
      }
    });

    const contacts = contactsResponse.data.data;
    console.log(`✅ Retrieved ${contacts?.length || 0} contacts (showing first 3):`);
    if (contacts && contacts.length > 0) {
      contacts.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.Full_Name || contact.Last_Name}`);
        console.log(`      Email: ${contact.Email || 'N/A'}`);
        console.log(`      Phone: ${contact.Phone || contact.Mobile || 'N/A'}`);
      });
    } else {
      console.log('   No contacts found in CRM');
    }
    console.log();
  } catch (error) {
    console.error('❌ Failed to fetch contacts:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    console.error(`   Details: ${JSON.stringify(error.response?.data, null, 2)}\n`);
  }

  // Test 5: Check User Info
  console.log('📝 Test 5: Fetching Current User Info...');
  try {
    const userResponse = await axios.get(`${config.apiUrl}/crm/v2/users?type=CurrentUser`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${config.accessToken}`
      }
    });

    const user = userResponse.data.users[0];
    console.log('✅ Current user info:');
    console.log(`   Name: ${user.full_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role?.name || 'N/A'}`);
    console.log(`   Status: ${user.status}\n`);
  } catch (error) {
    console.error('❌ Failed to fetch user info:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    console.error(`   Details: ${JSON.stringify(error.response?.data, null, 2)}\n`);
  }

  console.log('✅ Zoho integration test completed!\n');
}

testZohoIntegration().catch(error => {
  console.error('Fatal error during test:', error);
  process.exit(1);
});
