// services/automation/index.js
// Compatibility shim to expose expected automation APIs
const proactiveService = require('./proactiveMessagingService');
const proactiveLegacy = require('./proactiveMessaging');
const managerAlerts = require('./managerAlerts');

module.exports = {
  proactiveMessaging: {
    // Intelligence runner expects runDailyOverdueCheck
    runDailyOverdueCheck: async (tenantId) => {
      // Prefer new service API if available
      if (proactiveService && typeof proactiveService.scheduleProactiveMessages === 'function') {
        return await proactiveService.scheduleProactiveMessages(tenantId);
      }
      if (proactiveLegacy && typeof proactiveLegacy.sendProactiveReminders === 'function') {
        return await proactiveLegacy.sendProactiveReminders(tenantId);
      }
      console.warn('[AUTOMATION] No proactive messaging implementation found');
      return { messagesSent: 0 };
    },
    sendPending: async (tenantId) => {
      if (proactiveService && typeof proactiveService.sendPendingMessages === 'function') {
        return await proactiveService.sendPendingMessages(tenantId);
      }
      return { messagesSent: 0 };
    },
    markAsResponded: async (...args) => {
      if (proactiveService && typeof proactiveService.markMessageAsResponded === 'function') {
        return await proactiveService.markMessageAsResponded(...args);
      }
      return null;
    }
  },
  managerAlerts: managerAlerts
};
