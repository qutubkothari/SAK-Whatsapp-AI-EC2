const whatsappService = require('../services/whatsappService');
let keywordService; try { keywordService = require('../services/keywordService'); } catch { keywordService = null; }


exports.add = async ({ tenant, from, raw }) => {
const m = raw.match(/^\/add_keyword\s+"([^"]+)"\s+"([^"]+)"\s*$/i);
if (!m) { await whatsappService.sendText(from, 'Usage:\n/add_keyword "word" "response"'); return { ok:false, cmd:'add_keyword' }; }
if (!keywordService || typeof keywordService.addKeyword !== 'function') {
await whatsappService.sendText(from, 'Keyword service not enabled.');
return { ok:false, cmd:'add_keyword' };
}
await keywordService.addKeyword({ tenantId: tenant.id, word: m[1], response: m[2] });
await whatsappService.sendText(from, `✅ Added keyword: "${m[1]}"`);
return { ok:true, cmd:'add_keyword' };
};


exports.del = async ({ tenant, from, raw }) => {
const m = raw.match(/^\/delete_keyword\s+"([^"]+)"\s*$/i);
if (!m) { await whatsappService.sendText(from, 'Usage:\n/delete_keyword "word"'); return { ok:false, cmd:'delete_keyword' }; }
if (!keywordService || typeof keywordService.deleteKeyword !== 'function') {
await whatsappService.sendText(from, 'Keyword service not enabled.');
return { ok:false, cmd:'delete_keyword' };
}
await keywordService.deleteKeyword({ tenantId: tenant.id, word: m[1] });
await whatsappService.sendText(from, `🗑️ Deleted keyword: "${m[1]}"`);
return { ok:true, cmd:'delete_keyword' };
};


exports.list = async ({ tenant, from }) => {
if (!keywordService || typeof keywordService.listKeywords !== 'function') {
await whatsappService.sendText(from, 'Keyword service not enabled.');
return { ok:false, cmd:'list_keywords' };
}
const items = await keywordService.listKeywords({ tenantId: tenant.id });
const lines = (items || []).map(k => `• ${k.word} → ${k.response}`).join('\n') || '(none)';
await whatsappService.sendText(from, `Keywords:\n${lines}`);
return { ok:true, cmd:'list_keywords' };
};