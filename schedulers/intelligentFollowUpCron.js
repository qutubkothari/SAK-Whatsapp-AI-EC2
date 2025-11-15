// schedulers/intelligentFollowUpCron.js
/**
 * Cron Scheduler for Intelligent Follow-ups
 * Runs daily to check for conversations that need follow-up based on behavior
 */

const cron = require('node-cron');
const { processIntelligentFollowUps } = require('../services/intelligentFollowUpService');

let cronJob = null;

/**
 * Initialize the intelligent follow-up cron scheduler
 * Runs daily at 9 AM IST to analyze conversations and create follow-ups
 */
function initializeIntelligentFollowUpScheduler() {
    // Stop existing job if any
    if (cronJob) {
        cronJob.stop();
    }

    // Schedule: Every day at 9:00 AM IST
    // Cron format: minute hour day month weekday
    // '0 9 * * *' = 9:00 AM every day
    cronJob = cron.schedule('0 9 * * *', async () => {
        console.log('[INTELLIGENT-FOLLOWUP-CRON] Starting daily intelligent follow-up analysis...');
        try {
            await processIntelligentFollowUps();
            console.log('[INTELLIGENT-FOLLOWUP-CRON] Daily intelligent follow-up analysis completed');
        } catch (error) {
            console.error('[INTELLIGENT-FOLLOWUP-CRON] Error in intelligent follow-up analysis:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    console.log('[INTELLIGENT-FOLLOWUP-CRON] Intelligent follow-up scheduler initialized (runs daily at 9 AM IST)');
}

/**
 * Manually trigger intelligent follow-up processing (for testing)
 */
async function triggerManualIntelligentFollowUpCheck() {
    console.log('[INTELLIGENT-FOLLOWUP-CRON] Manual trigger: Running intelligent follow-up analysis...');
    try {
        await processIntelligentFollowUps();
        console.log('[INTELLIGENT-FOLLOWUP-CRON] Manual intelligent follow-up analysis completed');
        return { success: true, message: 'Intelligent follow-up analysis completed' };
    } catch (error) {
        console.error('[INTELLIGENT-FOLLOWUP-CRON] Error in manual trigger:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Stop the cron scheduler
 */
function stopIntelligentFollowUpScheduler() {
    if (cronJob) {
        cronJob.stop();
        console.log('[INTELLIGENT-FOLLOWUP-CRON] Intelligent follow-up scheduler stopped');
    }
}

module.exports = {
    initializeIntelligentFollowUpScheduler,
    triggerManualIntelligentFollowUpCheck,
    stopIntelligentFollowUpScheduler
};
