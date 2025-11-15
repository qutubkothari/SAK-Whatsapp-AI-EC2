// Stub analytics module - features moved to other services
module.exports = {
    analyzeCustomerPatterns: async (tenantId) => {
        console.log('[Analytics] Pattern analysis disabled (use intelligence services)');
        return { success: true, patterns: [] };
    },
  
    detectAnomalies: async (tenantId) => {
        console.log('[Analytics] Anomaly detection disabled (use intelligence/anomalyDetector)');
        return { success: true, anomalies: [] };
    },
  
    sendProactiveMessages: async (tenantId) => {
        console.log('[Analytics] Proactive messaging disabled (use automation/proactiveMessaging)');
        return { success: true, sent: 0 };
    }
};