const whatsappService = require('../services/whatsappService');
let leadService; try { leadService = require('../services/leadService'); } catch { leadService = null; }


exports.handle = async ({ tenant, from }) => {
try {
if (!leadService || typeof leadService.exportLeadsToExcel !== 'function') {
await whatsappService.sendText(from, 'Export not available yet.');
return { ok:false, cmd:'export_leads' };
}
const url = await leadService.exportLeadsToExcel({ tenantId: tenant.id });
await whatsappService.sendText(from, `📤 Leads export: ${url}`);
return { ok:true, cmd:'export_leads' };
} catch (e) {
console.error('[cmd/export_leads]', e);
await whatsappService.sendText(from, 'Could not export leads.');
return { ok:false, cmd:'export_leads' };
}
};