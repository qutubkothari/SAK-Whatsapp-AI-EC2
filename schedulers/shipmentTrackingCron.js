const cron = require('node-cron');
const { checkShipmentsForUpdates } = require('../services/vrlTrackingService');
const { sendMessage } = require('../services/whatsappService');

/**
 * Periodic shipment tracking checker
 * Runs every 6 hours to check active shipments
 */
class ShipmentTrackingCron {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the cron job
   */
  start() {
    if (this.cronJob) {
      console.log('[SHIPMENT_CRON] Cron job already running');
      return;
    }

    // Run daily at 9 AM: 0 9 * * *
    // For testing, you can use: */10 * * * * (every 10 minutes)
    this.cronJob = cron.schedule('0 9 * * *', async () => {
      await this.checkShipments();
    });

    console.log('[SHIPMENT_CRON] Started - will check shipments daily at 9 AM');
    
    // Run immediately on startup (optional)
    // this.checkShipments();
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[SHIPMENT_CRON] Stopped');
    }
  }

  /**
   * Check all active shipments
   */
  async checkShipments() {
    if (this.isRunning) {
      console.log('[SHIPMENT_CRON] Check already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('[SHIPMENT_CRON] Starting shipment checks...');
      const startTime = Date.now();
      
      const summary = await checkShipmentsForUpdates(sendMessage);
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      console.log(`[SHIPMENT_CRON] Completed in ${duration}s:`, {
        total: summary.total,
        updated: summary.updated,
        notified: summary.notified,
        errors: summary.errors
      });
      
      // Log to admin if there were significant updates
      if (summary.notified > 0) {
        console.log(`[SHIPMENT_CRON] 📬 Sent ${summary.notified} notifications to customers`);
      }
      
    } catch (error) {
      console.error('[SHIPMENT_CRON] Error during shipment checks:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: !!this.cronJob,
      schedule: '0 9 * * * (daily at 9 AM)'
    };
  }
}

// Create singleton instance
const shipmentTrackingCron = new ShipmentTrackingCron();

module.exports = shipmentTrackingCron;
