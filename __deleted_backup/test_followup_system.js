// Test script for follow-up reminder system
const { 
    detectFollowUpRequest, 
    parseFollowUpTime,
    handleFollowUpRequest,
    processScheduledFollowUps
} = require('./services/followUpSchedulerService');
const { supabase } = require('./services/config');

// Test data
const testQueries = [
    "call me in 5 minutes",
    "remind me after 2 hours",
    "follow up tomorrow",
    "contact me tomorrow morning",
    "remind me tomorrow evening",
    "call me after 3 days",
    "follow up next week",
    "check back with me in 30 minutes",
    "call kar do kal subah",
    "follow up after 1 hour",
    "remind me at 3pm",
    "contact me later",
    "just show me price for 10x100", // Should NOT detect
    "how much for 8x100", // Should NOT detect
];

console.log('='.repeat(80));
console.log('FOLLOW-UP SYSTEM TEST');
console.log('='.repeat(80));

async function testPatternDetection() {
    console.log('\n📋 TEST 1: Pattern Detection');
    console.log('-'.repeat(80));
    
    for (const query of testQueries) {
        const detection = detectFollowUpRequest(query);
        console.log(`\n➤ Query: "${query}"`);
        console.log(`  Detected: ${detection.detected ? '✅ YES' : '❌ NO'}`);
        
        if (detection.detected) {
            console.log(`  Type: ${detection.type}`);
            console.log(`  Match: "${detection.match}"`);
            
            // Parse timing
            const timeData = parseFollowUpTime(detection);
            if (timeData.isValid) {
                console.log(`  Scheduled Time: ${timeData.scheduledTime}`);
                console.log(`  Description: ${timeData.description}`);
            } else {
                console.log(`  ⚠️  Invalid time data`);
            }
        }
    }
}

async function testDatabaseSchema() {
    console.log('\n\n📊 TEST 2: Database Schema Check');
    console.log('-'.repeat(80));
    
    try {
        // Try to query the table structure
        const { data, error } = await supabase
            .from('scheduled_followups')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ Error querying scheduled_followups:', error.message);
            console.log('   Code:', error.code);
            console.log('   Details:', error.details);
            
            if (error.code === '42P01') {
                console.log('\n⚠️  Table does not exist! Need to create it.');
                console.log('\nCREATE TABLE SQL:');
                console.log(`
CREATE TABLE scheduled_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    end_user_phone TEXT NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    description TEXT,
    original_request TEXT,
    conversation_context JSONB,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE INDEX idx_scheduled_followups_tenant ON scheduled_followups(tenant_id);
CREATE INDEX idx_scheduled_followups_phone ON scheduled_followups(end_user_phone);
CREATE INDEX idx_scheduled_followups_status ON scheduled_followups(status);
CREATE INDEX idx_scheduled_followups_time ON scheduled_followups(scheduled_time);
                `);
            }
        } else {
            console.log('✅ Table exists and is accessible');
            console.log('   Sample columns:', data && data.length > 0 ? Object.keys(data[0]).join(', ') : 'No data yet');
        }
    } catch (err) {
        console.log('❌ Exception:', err.message);
    }
}

async function testScheduling() {
    console.log('\n\n⏰ TEST 3: Schedule a Test Follow-Up');
    console.log('-'.repeat(80));
    
    const testTenantId = process.env.TEST_TENANT_ID || 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';
    const testPhone = '919106886259@c.us'; // Your test number
    const testQuery = 'remind me in 2 minutes';
    
    console.log(`Tenant ID: ${testTenantId}`);
    console.log(`Phone: ${testPhone}`);
    console.log(`Query: "${testQuery}"`);
    
    try {
        const result = await handleFollowUpRequest(testTenantId, testPhone, testQuery, 'english');
        
        if (result.handled) {
            console.log('✅ Follow-up scheduled successfully!');
            console.log('   ID:', result.followUpId);
            console.log('   Scheduled Time:', result.scheduledTime);
            console.log('   Response:', result.response);
        } else {
            console.log('❌ Not handled as follow-up request');
        }
    } catch (err) {
        console.log('❌ Error scheduling:', err.message);
        console.log('   Stack:', err.stack);
    }
}

async function testCronExecution() {
    console.log('\n\n⚙️  TEST 4: Manual Cron Execution');
    console.log('-'.repeat(80));
    
    try {
        console.log('Running processScheduledFollowUps...');
        const result = await processScheduledFollowUps();
        console.log('✅ Cron execution completed');
        console.log('   Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.log('❌ Error in cron execution:', err.message);
        console.log('   Stack:', err.stack);
    }
}

async function checkPendingFollowUps() {
    console.log('\n\n📋 TEST 5: Check Pending Follow-Ups');
    console.log('-'.repeat(80));
    
    try {
        const { data, error } = await supabase
            .from('scheduled_followups')
            .select('*')
            .eq('status', 'scheduled')
            .order('scheduled_time', { ascending: true });
        
        if (error) {
            console.log('❌ Error querying:', error.message);
        } else {
            console.log(`Found ${data ? data.length : 0} pending follow-ups`);
            
            if (data && data.length > 0) {
                const now = new Date();
                data.forEach((followUp, i) => {
                    const scheduledTime = new Date(followUp.scheduled_time);
                    const isPast = scheduledTime < now;
                    const timeUntil = Math.round((scheduledTime - now) / 1000 / 60);
                    
                    console.log(`\n${i + 1}. ${isPast ? '⚠️  OVERDUE' : '⏳ UPCOMING'}`);
                    console.log(`   ID: ${followUp.id}`);
                    console.log(`   Phone: ${followUp.end_user_phone}`);
                    console.log(`   Scheduled: ${scheduledTime.toLocaleString()}`);
                    console.log(`   Time: ${isPast ? `${-timeUntil} mins ago` : `in ${timeUntil} mins`}`);
                    console.log(`   Description: ${followUp.description}`);
                });
            }
        }
    } catch (err) {
        console.log('❌ Exception:', err.message);
    }
}

// Run all tests
async function runAllTests() {
    await testPatternDetection();
    await testDatabaseSchema();
    await testScheduling();
    await checkPendingFollowUps();
    await testCronExecution();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(80));
    
    process.exit(0);
}

// Run tests
runAllTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
