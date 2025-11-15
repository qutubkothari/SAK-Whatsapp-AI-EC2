const whatsappService = require('../services/whatsappService');


const HELP = `Commands (admin):\n
/status — subscription status\n/login — magic link\n/products — import products (send Excel)\n/broadcast "Camp" "Time" "Msg"\n/broadcast_to_segment "Seg" "Camp" "Time" "Msg"\n/segments — list standard segments\n/add_keyword "word" "response"\n/delete_keyword "word"\n/list_keywords\n/export_leads\n/customer_snapshot <phone>\n/history <phone>\n/update_order_status <phone> <status>\n`;


exports.handle = async ({ from }) => {
await whatsappService.sendText(from, HELP);
return { ok:true, cmd:'help' };
};