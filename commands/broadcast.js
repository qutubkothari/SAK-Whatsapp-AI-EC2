// commands/broadcast.js
const whatsappService = require('../services/whatsappService');
const { scheduleBroadcast } = require('../services/broadcastService');
const chrono = require('chrono-node');

// Parse quoted arguments for text broadcast
function parseQuoted(raw) {
  // expects: /broadcast "Campaign" "Time" "Message"
  const m = raw.match(/^\/broadcast\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"\s*$/i);
  return m ? { name: m[1], time: m[2], text: m[3] } : null;
}

// Parse quoted arguments for image broadcast
function parseImageQuoted(raw) {
  // expects: /broadcast_image "Campaign" "Time" "Message"
  const m = raw.match(/^\/broadcast_image\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"\s*$/i);
  return m ? { name: m[1], time: m[2], text: m[3] } : null;
}

// Parse immediate broadcast
function parseNow(raw) {
  // expects: /broadcast_now "Campaign" "Message"
  const m = raw.match(/^\/broadcast_now\s+"([^"]+)"\s+"([^"]+)"\s*$/i);
  return m ? { name: m[1], text: m[2], time: 'now' } : null;
}

// Parse immediate image broadcast
function parseImageNow(raw) {
  // expects: /broadcast_image_now "Campaign" "Message"
  const m = raw.match(/^\/broadcast_image_now\s+"([^"]+)"\s+"([^"]+)"\s*$/i);
  return m ? { name: m[1], text: m[2], time: 'now' } : null;
}

// Store pending campaigns in memory (use Redis in production)
const pendingCampaigns = new Map();

// Clean up old campaigns periodically
const cleanupOldCampaigns = () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [id, campaign] of pendingCampaigns.entries()) {
    if (campaign.created < oneHourAgo) {
      pendingCampaigns.delete(id);
      console.log(`[BROADCAST] Cleaned up expired campaign: ${id}`);
    }
  }
};

// Auto cleanup every 5 minutes
setInterval(cleanupOldCampaigns, 5 * 60 * 1000);

// Parse time string into ISO date
const parseScheduleTime = (timeString) => {
  if (timeString === 'now') {
    return new Date().toISOString();
  }
  
  const parsed = chrono.parseDate(timeString, new Date(), { forwardDate: true });
  if (!parsed) {
    throw new Error(`Could not parse time: "${timeString}". Try formats like "tomorrow 10am", "in 2 hours", or "now"`);
  }
  
  return parsed.toISOString();
};

// Handle text broadcast
const handle = async ({ from, raw, tenantId }) => {
  const args = parseQuoted(raw);
  if (!args) {
    await whatsappService.sendMessage(from, 
      'Usage:\n/broadcast "Campaign Name" "tomorrow 10am" "Your message text"'
    );
    return { ok: false, cmd: 'broadcast', reason: 'bad-args' };
  }
  
  const campaignId = `${from}_${Date.now()}`;
  pendingCampaigns.set(campaignId, {
    from,
    tenantId,
    name: args.name,
    time: args.time,
    text: args.text,
    type: 'text',
    step: 'awaiting_contacts',
    created: new Date()
  });
  
  await whatsappService.sendMessage(from, 
    `📣 Text Campaign "${args.name}" scheduled for ${args.time}\n\n` +
    `Message: "${args.text}"\n\n` +
    `Now send the contacts Excel file to queue this broadcast.`
  );
  
  return { ok: true, cmd: 'broadcast', pending: 'contacts-upload', campaignId };
};

// Handle image broadcast
const handleImageBroadcast = async ({ from, raw, tenantId }) => {
  const args = parseImageQuoted(raw);
  if (!args) {
    await whatsappService.sendMessage(from, 
      'Usage:\n/broadcast_image "Campaign Name" "tomorrow 10am" "Your message text"'
    );
    return { ok: false, cmd: 'broadcast_image', reason: 'bad-args' };
  }
  
  const campaignId = `${from}_${Date.now()}`;
  pendingCampaigns.set(campaignId, {
    from,
    tenantId,
    name: args.name,
    time: args.time,
    text: args.text,
    type: 'image',
    step: 'awaiting_image',
    created: new Date()
  });
  
  await whatsappService.sendMessage(from, 
    `🖼️ Image Campaign "${args.name}" scheduled for ${args.time}\n\n` +
    `Message: "${args.text}"\n\n` +
    `STEP 1: Send the image you want to broadcast\n` +
    `STEP 2: Then send the contacts Excel file\n\n` +
    `Please send the image now...`
  );
  
  return { ok: true, cmd: 'broadcast_image', pending: 'image-upload', campaignId };
};

// Handle immediate text broadcast
const handleTextNow = async ({ from, raw, tenantId }) => {
  const args = parseNow(raw);
  if (!args) {
    await whatsappService.sendMessage(from, 
      'Usage:\n/broadcast_now "Campaign Name" "Your message text"'
    );
    return { ok: false, cmd: 'broadcast_now', reason: 'bad-args' };
  }
  
  const campaignId = `${from}_${Date.now()}`;
  pendingCampaigns.set(campaignId, {
    from,
    tenantId,
    name: args.name,
    time: 'now',
    text: args.text,
    type: 'text',
    step: 'awaiting_contacts',
    created: new Date()
  });
  
  await whatsappService.sendMessage(from, 
    `⚡ Immediate Text Broadcast "${args.name}"\n\n` +
    `Message: "${args.text}"\n\n` +
    `Send the contacts Excel file to start broadcasting immediately.`
  );
  
  return { ok: true, cmd: 'broadcast_now', pending: 'contacts-upload', campaignId };
};

// Handle immediate image broadcast
const handleImageNow = async ({ from, raw, tenantId }) => {
  const args = parseImageNow(raw);
  if (!args) {
    await whatsappService.sendMessage(from, 
      'Usage:\n/broadcast_image_now "Campaign Name" "Your message text"'
    );
    return { ok: false, cmd: 'broadcast_image_now', reason: 'bad-args' };
  }
  
  const campaignId = `${from}_${Date.now()}`;
  pendingCampaigns.set(campaignId, {
    from,
    tenantId,
    name: args.name,
    time: 'now',
    text: args.text,
    type: 'image',
    step: 'awaiting_image',
    created: new Date()
  });
  
  await whatsappService.sendMessage(from, 
    `⚡🖼️ Immediate Image Broadcast "${args.name}"\n\n` +
    `Message: "${args.text}"\n\n` +
    `STEP 1: Send the image now\n` +
    `STEP 2: Then send contacts Excel\n\n` +
    `Broadcasting will start immediately after Excel upload. Send image now...`
  );
  
  return { ok: true, cmd: 'broadcast_image_now', pending: 'image-upload', campaignId };
};

// Handle image uploads
const handleImageUpload = async (from, imageUrl) => {
  // Find pending campaign waiting for image
  let campaignId = null;
  let campaign = null;
  
  for (const [id, camp] of pendingCampaigns.entries()) {
    if (camp.from === from && camp.step === 'awaiting_image' && camp.type === 'image') {
      campaignId = id;
      campaign = camp;
      break;
    }
  }
  
  if (!campaign) {
    await whatsappService.sendMessage(from, 
      'No pending image campaign found. Please start with /broadcast_image or /broadcast_image_now first.'
    );
    return { ok: false, reason: 'no_pending_campaign' };
  }
  
  // Validate image URL
  if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
    await whatsappService.sendMessage(from, 
      'Invalid image URL. Please send a valid image file.'
    );
    return { ok: false, reason: 'invalid_image_url' };
  }
  
  // Store image URL and move to next step
  campaign.imageUrl = imageUrl;
  campaign.step = 'awaiting_contacts';
  pendingCampaigns.set(campaignId, campaign);
  
  const timeText = campaign.time === 'now' ? 'immediately' : `at ${campaign.time}`;
  
  await whatsappService.sendMessage(from, 
    `✅ Image received for campaign "${campaign.name}"\n\n` +
    `Will broadcast ${timeText}\n\n` +
    `STEP 2: Now send the contacts Excel file to start the broadcast.`
  );
  
  return { ok: true, step: 'image_uploaded', campaignId };
};

// Handle Excel uploads  
const handleExcelUpload = async (from, phoneNumbers) => {
  // Find pending campaign waiting for contacts
  let campaignId = null;
  let campaign = null;
  
  for (const [id, camp] of pendingCampaigns.entries()) {
    if (camp.from === from && camp.step === 'awaiting_contacts') {
      campaignId = id;
      campaign = camp;
      break;
    }
  }
  
  if (!campaign) {
    await whatsappService.sendMessage(from, 
      'No pending campaign found. Please start with a broadcast command first.'
    );
    return { ok: false, reason: 'no_pending_campaign' };
  }
  
  if (!phoneNumbers || phoneNumbers.length === 0) {
    await whatsappService.sendMessage(from, 
      'No valid phone numbers found in the Excel file. Please check the format and try again.'
    );
    return { ok: false, reason: 'no_phone_numbers' };
  }
  
  try {
    // Parse schedule time
    const sendTime = parseScheduleTime(campaign.time);
    
    // Schedule the broadcast
    console.log(`[BROADCAST] Scheduling ${campaign.type} broadcast:`, {
      campaignId,
      name: campaign.name,
      contacts: phoneNumbers.length,
      hasImage: !!campaign.imageUrl,
      sendTime
    });
    
    const result = await scheduleBroadcast(
      campaign.tenantId,
      campaign.name,
      campaign.text,
      sendTime,
      phoneNumbers,
      campaign.imageUrl || null
    );
    
    // Clean up pending campaign
    pendingCampaigns.delete(campaignId);
    
    const broadcastType = campaign.type === 'image' ? 'Image Broadcast' : 'Text Broadcast';
    const timeText = campaign.time === 'now' ? 'starting now' : `scheduled for ${campaign.time}`;
    
    await whatsappService.sendMessage(from, 
      `🚀 ${broadcastType} "${campaign.name}" launched!\n\n` +
      `📞 Recipients: ${phoneNumbers.length} contacts\n` +
      `📅 Status: ${timeText}\n` +
      `${campaign.imageUrl ? '🖼️ With image\n' : ''}` +
      `\nResult: ${result}`
    );
    
    return { 
      ok: true, 
      step: 'campaign_launched', 
      result,
      campaign: {
        name: campaign.name,
        type: campaign.type,
        contacts: phoneNumbers.length,
        hasImage: !!campaign.imageUrl
      }
    };
    
  } catch (error) {
    console.error('[BROADCAST] Error launching campaign:', error);
    
    await whatsappService.sendMessage(from, 
      `❌ Error launching campaign: ${error.message}\n\n` +
      `Please try again or contact support if the issue persists.`
    );
    
    return { ok: false, error: error.message };
  }
};

// Get campaign status
const getCampaignStatus = (from) => {
  const userCampaigns = [];
  for (const [id, campaign] of pendingCampaigns.entries()) {
    if (campaign.from === from) {
      userCampaigns.push({
        id: id.split('_')[1], // timestamp part
        name: campaign.name,
        type: campaign.type,
        step: campaign.step,
        created: campaign.created
      });
    }
  }
  return userCampaigns;
};

// Cancel pending campaign
const cancelCampaign = async (from) => {
  let cancelled = 0;
  for (const [id, campaign] of pendingCampaigns.entries()) {
    if (campaign.from === from) {
      pendingCampaigns.delete(id);
      cancelled++;
    }
  }
  
  if (cancelled > 0) {
    await whatsappService.sendMessage(from, 
      `✅ Cancelled ${cancelled} pending campaign${cancelled > 1 ? 's' : ''}.`
    );
  } else {
    await whatsappService.sendMessage(from, 
      'No pending campaigns to cancel.'
    );
  }
  
  return { ok: true, cancelled };
};

// Main export with all handlers
module.exports = {
  // Command handlers
  handle,                               // /broadcast
  handleImage: handleImageBroadcast,    // /broadcast_image  
  handleNow: handleTextNow,             // /broadcast_now
  handleImageNow: handleImageNow,       // /broadcast_image_now
  
  // Upload handlers
  handleImageUpload,
  handleExcelUpload,
  
  // Utility functions
  getPendingCampaigns: () => pendingCampaigns,
  getCampaignStatus,
  cancelCampaign,
  cleanupOldCampaigns,
  
  // For debugging
  debugInfo: () => ({
    pendingCount: pendingCampaigns.size,
    campaigns: Array.from(pendingCampaigns.entries()).map(([id, camp]) => ({
      id,
      name: camp.name,
      type: camp.type,
      step: camp.step,
      age: Date.now() - camp.created.getTime()
    }))
  })
};