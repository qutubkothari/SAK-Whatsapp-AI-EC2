const express = require('express');
const router = express.Router();
const { supabase } = require('../../services/config');
const { sendMessage, sendMessageWithImage } = require('../../services/whatsappService');

/**
 * POST /api/broadcast/send
 * Send or schedule a broadcast message to multiple recipients
 */
router.post('/send', async (req, res) => {
    try {
        const { 
            tenantId, 
            campaignName, 
            message, 
            recipients, 
            messageType, 
            scheduleType, 
            scheduleTime,
            imageBase64,
            batchSize = 10,
            messageDelay = 500,
            batchDelay = 2000
        } = req.body;

        console.log('[BROADCAST_API] Request:', { 
            tenantId, 
            campaignName, 
            recipientCount: recipients?.length, 
            messageType, 
            scheduleType,
            batchSize,
            messageDelay,
            batchDelay
        });

        // Validate required fields
        if (!tenantId || !campaignName || !message || !recipients || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: tenantId, campaignName, message, recipients'
            });
        }

        // Get tenant info
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id, business_name, phone_number')
            .eq('id', tenantId)
            .single();

        if (tenantError || !tenant) {
            console.error('[BROADCAST_API] Tenant not found:', tenantError);
            return res.status(404).json({
                success: false,
                error: 'Tenant not found',
                details: tenantError?.message
            });
        }

        // Use phone_number from tenant
        const phoneNumberId = tenant.phone_number;

        if (scheduleType === 'now') {
            // Use the broadcastService to schedule the messages
            const { scheduleBroadcast } = require('../../services/broadcastService');
            
            console.log('[BROADCAST_API] Scheduling broadcast via broadcastService');
            
            try {
                const result = await scheduleBroadcast(
                    tenantId,
                    campaignName,
                    message,
                    new Date().toISOString(), // Send now
                    recipients,
                    imageBase64 // Image URL/base64
                );
                
                // scheduleBroadcast returns a string message
                console.log('[BROADCAST_API] Broadcast scheduled:', result);
                
                // Check if it's an error message
                if (result.includes('error') || result.includes('failed') || result.includes('No valid')) {
                    return res.status(400).json({
                        success: false,
                        error: result
                    });
                }
                
                return res.json({
                    success: true,
                    message: `Broadcast queued! Processing ${recipients.length} recipients in background.`,
                    details: {
                        total: recipients.length,
                        status: 'queued',
                        result: result
                    }
                });
            } catch (err) {
                console.error('[BROADCAST_API] Failed to schedule broadcast:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to queue broadcast: ' + err.message
                });
            }
        } else {
            // Schedule for later (existing code)
            const scheduledTime = new Date(scheduleTime);


            
            if (isNaN(scheduledTime.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid schedule time format'
                });
            }

            // Store in broadcast_queue table for processing by scheduler
            const { error: insertError } = await supabase
                .from('broadcast_queue')
                .insert({
                    tenant_id: tenantId,
                    campaign_name: campaignName,
                    message_type: messageType,
                    message_content: message,
                    image_url: messageType === 'image' && imageBase64 ? imageBase64 : null,
                    recipients: recipients,
                    scheduled_at: scheduledTime.toISOString(),
                    status: 'scheduled',
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('[BROADCAST_API] Failed to schedule broadcast:', insertError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to schedule broadcast'
                });
            }

            console.log('[BROADCAST_API] Broadcast scheduled:', { campaignName, scheduledTime });

            return res.json({
                success: true,
                message: `Broadcast scheduled for ${scheduledTime.toLocaleString()}`,
                details: {
                    campaignName,
                    scheduledTime: scheduledTime.toISOString(),
                    recipientCount: recipients.length
                }
            });
        }

    } catch (error) {
        console.error('[BROADCAST_API] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

/**
 * GET /api/broadcast/history/:tenantId
 * Get broadcast history for a tenant
 */
router.get('/history/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;

        // Get broadcasts from bulk_schedules grouped by campaign
        const { data: campaigns, error } = await supabase
            .from('bulk_schedules')
            .select('campaign_id, campaign_name, message_text, image_url, scheduled_at, status, created_at')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[BROADCAST_API] Error fetching history:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch broadcast history'
            });
        }

        if (!campaigns || campaigns.length === 0) {
            return res.json({
                success: true,
                broadcasts: []
            });
        }

        // Group by campaign and aggregate stats
        const campaignMap = new Map();
        
        campaigns.forEach(item => {
            const key = item.campaign_id || `${item.campaign_name}_${item.created_at}`;
            
            if (!campaignMap.has(key)) {
                campaignMap.set(key, {
                    campaign_id: item.campaign_id,
                    campaign_name: item.campaign_name,
                    message_content: item.message_text,
                    image_url: item.image_url,
                    scheduled_at: item.scheduled_at,
                    created_at: item.created_at,
                    sent_at: item.created_at,
                    recipient_count: 0,
                    success_count: 0,
                    fail_count: 0,
                    status: 'pending'
                });
            }
            
            const campaign = campaignMap.get(key);
            campaign.recipient_count++;
            
            if (item.status === 'sent' || item.status === 'delivered') {
                campaign.success_count++;
            } else if (item.status === 'failed') {
                campaign.fail_count++;
            }
            
            // Determine overall status
            if (campaign.success_count + campaign.fail_count >= campaign.recipient_count) {
                campaign.status = 'completed';
            } else if (campaign.success_count > 0 || campaign.fail_count > 0) {
                campaign.status = 'processing';
            } else {
                campaign.status = 'pending';
            }
        });

        const broadcasts = Array.from(campaignMap.values())
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 20);

        return res.json({
            success: true,
            broadcasts
        });

    } catch (error) {
        console.error('[BROADCAST_API] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/broadcast/groups/save
 * Save a contact group for reuse
 */
router.post('/groups/save', async (req, res) => {
    try {
        const { tenantId, groupName, contacts } = req.body;

        if (!tenantId || !groupName || !contacts || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: tenantId, groupName, contacts'
            });
        }

        // Check if group name already exists for this tenant
        const { data: existing } = await supabase
            .from('contact_groups')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('group_name', groupName)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'A group with this name already exists. Please choose a different name.'
            });
        }

        // Save the group
        const { data: group, error } = await supabase
            .from('contact_groups')
            .insert({
                tenant_id: tenantId,
                group_name: groupName,
                contacts: contacts,
                contact_count: contacts.length
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            group: group
        });
    } catch (error) {
        console.error('[BROADCAST_API] Error saving contact group:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save contact group'
        });
    }
});

/**
 * GET /api/broadcast/groups/:tenantId
 * Get all contact groups for a tenant
 */
router.get('/groups/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;

        const { data: groups, error } = await supabase
            .from('contact_groups')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            groups: groups || []
        });
    } catch (error) {
        console.error('[BROADCAST_API] Error fetching contact groups:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch contact groups'
        });
    }
});

/**
 * DELETE /api/broadcast/groups/:groupId
 * Delete a contact group
 */
router.delete('/groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;

        const { error } = await supabase
            .from('contact_groups')
            .delete()
            .eq('id', groupId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Group deleted successfully'
        });
    } catch (error) {
        console.error('[BROADCAST_API] Error deleting contact group:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete contact group'
        });
    }
});

module.exports = router;
