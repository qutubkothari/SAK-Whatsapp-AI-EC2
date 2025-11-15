// commands/segments.js
const whatsappService = require('../services/whatsappService');
// const { scheduleBroadcastToSegment } = require('../services/broadcastService');
// const segmentationService = require('../services/segmentationService');

exports.list = async ({ from }) => {
  // Minimal: tell user where to view or how to trigger matching
  await whatsappService.sendText(from, 'Segments:\n- High Intent (lead_score ≥ 80)\n- Warm leads (≥ 50)\n- Cold leads (< 50)\n- Follow-up 24h (next_followup_at ≤ now())');
  return { ok: true, cmd: 'segments:list' };
};

exports.broadcastToSegment = async ({ from, raw }) => {
  // /broadcast_to_segment "Segment Name" "Campaign" "Time" "Message"
  const m = raw.match(/^\/broadcast_to_segment\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"\s*$/i);
  if (!m) {
    await whatsappService.sendText(from, 'Usage:\n/broadcast_to_segment "Segment" "Campaign" "Time" "Message"');
    return { ok:false, cmd:'segments:broadcast', reason:'bad-args' };
  }
  const [, segment, campaign, time, text] = m;
  await whatsappService.sendText(from, `📣 Segment broadcast:\nSegment: *${segment}*\nCampaign: *${campaign}*\nTime: *${time}*\nMessage: "${text}"\n\n(When broadcastService is wired, this will schedule automatically.)`);
  return { ok:true, cmd:'segments:broadcast' };
};
