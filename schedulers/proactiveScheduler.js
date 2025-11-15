/**
 * PROACTIVE MESSAGING SCHEDULER
 * Runs daily at 9 AM to send reorder reminders
 * Also checks hourly for pending messages to send
 */

const cron = require('node-cron');
const { scheduleProactiveMessages, sendPendingMessages } = require('./services/automation/proactiveMessagingService');

// Your tenant ID (get from database)
const TENANT_ID = process.env.TENANT_ID || 'a10aa26a-b5f9-4afe-87cc-70bfb4d1f6e6';

/**
 * Daily Job: Analyze customers and schedule messages
 * Runs at 9:00 AM every day
 */
const dailyScheduler = cron.schedule('0 9 * * *', async () => {
  console.log('🔄 [SCHEDULER] Running daily proactive messaging analysis...');
  
  try {
    const stats = await scheduleProactiveMessages(TENANT_ID);
    console.log('✅ [SCHEDULER] Daily run complete:', stats);
  } catch (error) {
    console.error('❌ [SCHEDULER] Error in daily run:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

/**
 * Hourly Job: Send pending messages
 * Runs every hour to check for scheduled messages
 */
const hourlyScheduler = cron.schedule('0 * * * *', async () => {
  console.log('📤 [SCHEDULER] Checking for pending messages...');
  
  try {
    await sendPendingMessages(TENANT_ID);
    console.log('✅ [SCHEDULER] Pending messages processed');
  } catch (error) {
    console.error('❌ [SCHEDULER] Error sending messages:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

/**
 * Start the schedulers
 */
function startProactiveMessagingScheduler() {
  console.log('🚀 Starting Proactive Messaging Scheduler...');
  console.log('📅 Daily analysis: 9:00 AM IST');
  console.log('⏰ Hourly message send: Every hour');
  
  dailyScheduler.start();
  hourlyScheduler.start();
  
  console.log('✅ Schedulers started successfully');
}

/**
 * Stop the schedulers
 */
function stopProactiveMessagingScheduler() {
  console.log('🛑 Stopping Proactive Messaging Scheduler...');
  dailyScheduler.stop();
  hourlyScheduler.stop();
  console.log('✅ Schedulers stopped');
}

/**
 * Run analysis immediately (for testing)
 */
async function runImmediately() {
  console.log('🧪 Running proactive messaging analysis NOW (test mode)...');
  
  try {
    const stats = await scheduleProactiveMessages(TENANT_ID);
    console.log('✅ Test run complete:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error in test run:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  startProactiveMessagingScheduler,
  stopProactiveMessagingScheduler,
  runImmediately
};

// If running directly, start the scheduler
if (require.main === module) {
  startProactiveMessagingScheduler();
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, stopping schedulers...');
    stopProactiveMessagingScheduler();
    process.exit(0);
  });
}