// schedulers/followUpCron.js
const cron = require('node-cron');
const { processScheduledFollowUps } = require('../services/followUpSchedulerService');

/**
 * Initialize follow-up scheduler
 * Runs every 5 minutes to check for due follow-ups
 */
const initializeFollowUpScheduler = () => {
    console.log('[FOLLOWUP_CRON] Initializing follow-up scheduler...');
    
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('[FOLLOWUP_CRON] Running scheduled follow-up check...');
        try {
            await processScheduledFollowUps();
            console.log('[FOLLOWUP_CRON] Follow-up check completed successfully');
        } catch (error) {
            console.error('[FOLLOWUP_CRON] Error in scheduled follow-up check:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    
    console.log('[FOLLOWUP_CRON] Follow-up scheduler initialized - running every 5 minutes');
};

/**
 * Manual trigger for testing
 */
const triggerManualFollowUpCheck = async () => {
    console.log('[FOLLOWUP_CRON] Manual follow-up check triggered');
    try {
        await processScheduledFollowUps();
        console.log('[FOLLOWUP_CRON] Manual follow-up check completed');
        return { success: true, message: 'Follow-up check completed' };
    } catch (error) {
        console.error('[FOLLOWUP_CRON] Error in manual follow-up check:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    initializeFollowUpScheduler,
    triggerManualFollowUpCheck
};