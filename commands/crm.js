const whatsappService = require('../services/whatsappService');
let crmService; try { crmService = require('../services/crmService'); } catch { crmService = null; }


exports.snapshot = async ({ tenant, from, raw }) => {
const m = raw.match(/^\/customer_snapshot\s+(\S+)\s*$/i);
if (!m) { await whatsappService.sendText(from, 'Usage:\n/customer_snapshot <phone>'); return { ok:false, cmd:'customer_snapshot' }; }
if (!crmService || typeof crmService.getCustomerSnapshot !== 'function') { await whatsappService.sendText(from, 'CRM not enabled.'); return { ok:false }; }
const r = await crmService.getCustomerSnapshot({ tenantId: tenant.id, phone: m[1] });
await whatsappService.sendText(from, r?.text || 'No data.');
return { ok:true, cmd:'customer_snapshot' };
};


exports.history = async ({ tenant, from, raw }) => {
const m = raw.match(/^\/history\s+(\S+)\s*$/i);
if (!m) { await whatsappService.sendText(from, 'Usage:\n/history <phone>'); return { ok:false, cmd:'history' }; }
if (!crmService || typeof crmService.getConversationHistory !== 'function') { await whatsappService.sendText(from, 'CRM not enabled.'); return { ok:false }; }
const r = await crmService.getConversationHistory({ tenantId: tenant.id, phone: m[1] });
await whatsappService.sendText(from, r?.text || 'No history.');
return { ok:true, cmd:'history' };
};


exports.updateOrder = async ({ tenant, from, raw }) => {
const m = raw.match(/^\/update_order_status\s+(\S+)\s+(\S+)\s*$/i);
if (!m) { await whatsappService.sendText(from, 'Usage:\n/update_order_status <phone> <status>'); return { ok:false, cmd:'update_order_status' }; }
if (!crmService || typeof crmService.updateOrderStatus !== 'function') { await whatsappService.sendText(from, 'CRM not enabled.'); return { ok:false }; }
await crmService.updateOrderStatus({ tenantId: tenant.id, phone: m[1], status: m[2] });
await whatsappService.sendText(from, '✅ Order status updated.');
return { ok:true, cmd:'update_order_status' };
};