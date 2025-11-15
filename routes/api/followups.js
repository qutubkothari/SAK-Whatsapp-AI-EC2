// routes/api/followups.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../../services/config');
const { scheduleFollowUp, generateFollowUpConfirmation } = require('../../services/followUpSchedulerService');
const { sendMessage } = require('../../services/whatsappService');

/**
 * GET /api/followups/:tenantId
 * Get all follow-ups for a tenant
 */
router.get('/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { status, customer_phone, limit = 100 } = req.query;

        let query = supabase
            .from('scheduled_followups')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('scheduled_time', { ascending: true })
            .limit(parseInt(limit));

        if (status) {
            query = query.eq('status', status);
        }

        if (customer_phone) {
            query = query.eq('end_user_phone', customer_phone);
        }

        const { data: followups, error } = await query;

        if (error) throw error;

        // Manually fetch customer profiles for each follow-up
        const followupsWithCustomers = await Promise.all(
            (followups || []).map(async (followup) => {
                const { data: customer } = await supabase
                    .from('customer_profiles')
                    .select('phone, name, business_name')
                    .eq('phone', followup.end_user_phone)
                    .eq('tenant_id', tenantId)
                    .single();
                
                return {
                    ...followup,
                    customer: customer || null
                };
            })
        );

        res.json({
            success: true,
            followups: followupsWithCustomers || [],
            total: followupsWithCustomers?.length || 0
        });

    } catch (error) {
        console.error('[API] Error fetching follow-ups:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/followups/:tenantId/stats
 * Get follow-up statistics
 */
router.get('/:tenantId/stats', async (req, res) => {
    try {
        const { tenantId } = req.params;

        // Get counts by status
        const { data: stats, error } = await supabase
            .from('scheduled_followups')
            .select('status')
            .eq('tenant_id', tenantId);

        if (error) throw error;

        const statusCounts = {
            scheduled: 0,
            completed: 0,
            failed: 0,
            cancelled: 0
        };

        stats.forEach(item => {
            if (statusCounts.hasOwnProperty(item.status)) {
                statusCounts[item.status]++;
            }
        });

        // Get upcoming count (next 24 hours)
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const { data: upcoming, error: upcomingError } = await supabase
            .from('scheduled_followups')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('status', 'scheduled')
            .gte('scheduled_time', now.toISOString())
            .lte('scheduled_time', tomorrow.toISOString());

        if (upcomingError) throw upcomingError;

        res.json({
            success: true,
            stats: {
                ...statusCounts,
                total: stats.length,
                upcoming24h: upcoming?.length || 0
            }
        });

    } catch (error) {
        console.error('[API] Error fetching follow-up stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/followups/:tenantId
 * Create a new follow-up
 */
router.post('/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const {
            customer_phone,
            scheduled_time,
            description,
            note,
            created_by
        } = req.body;

        if (!customer_phone || !scheduled_time) {
            return res.status(400).json({
                success: false,
                error: 'customer_phone and scheduled_time are required'
            });
        }

        // Create follow-up
        const { data: followUp, error } = await supabase
            .from('scheduled_followups')
            .insert({
                tenant_id: tenantId,
                end_user_phone: customer_phone,
                scheduled_time: new Date(scheduled_time).toISOString(),
                description: description || 'Manual follow-up',
                original_request: note || 'Created from dashboard',
                conversation_context: {
                    created_from: 'dashboard',
                    created_by: created_by || 'admin',
                    note: note
                },
                status: 'scheduled',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            followup: followUp,
            message: 'Follow-up scheduled successfully'
        });

    } catch (error) {
        console.error('[API] Error creating follow-up:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/followups/:tenantId/:followupId
 * Update a follow-up
 */
router.put('/:tenantId/:followupId', async (req, res) => {
    try {
        const { tenantId, followupId } = req.params;
        const { scheduled_time, description, status } = req.body;

        const updates = {};
        if (scheduled_time) updates.scheduled_time = new Date(scheduled_time).toISOString();
        if (description) updates.description = description;
        if (status) updates.status = status;

        const { data: followUp, error } = await supabase
            .from('scheduled_followups')
            .update(updates)
            .eq('id', followupId)
            .eq('tenant_id', tenantId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            followup: followUp,
            message: 'Follow-up updated successfully'
        });

    } catch (error) {
        console.error('[API] Error updating follow-up:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/followups/:tenantId/:followupId
 * Cancel/delete a follow-up
 */
router.delete('/:tenantId/:followupId', async (req, res) => {
    try {
        const { tenantId, followupId } = req.params;

        const { error } = await supabase
            .from('scheduled_followups')
            .update({ status: 'cancelled' })
            .eq('id', followupId)
            .eq('tenant_id', tenantId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Follow-up cancelled successfully'
        });

    } catch (error) {
        console.error('[API] Error cancelling follow-up:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/followups/:tenantId/:followupId/send-now
 * Manually trigger a follow-up immediately
 */
router.post('/:tenantId/:followupId/send-now', async (req, res) => {
    try {
        const { tenantId, followupId } = req.params;

        // Get the follow-up
        const { data: followUp, error: fetchError } = await supabase
            .from('scheduled_followups')
            .select('*')
            .eq('id', followupId)
            .eq('tenant_id', tenantId)
            .single();

        if (fetchError || !followUp) {
            return res.status(404).json({
                success: false,
                error: 'Follow-up not found'
            });
        }

        // Process the follow-up
        const { processIndividualFollowUp } = require('../../services/followUpSchedulerService');
        await processIndividualFollowUp(followUp);

        res.json({
            success: true,
            message: 'Follow-up sent successfully'
        });

    } catch (error) {
        console.error('[API] Error sending follow-up:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/followups/:tenantId/suggestions
 * Get AI-generated follow-up suggestions based on customer behavior
 */
router.get('/:tenantId/suggestions', async (req, res) => {
    try {
        const { tenantId } = req.params;

        // Get customers who need follow-up
        // 1. Customers with abandoned carts (no order in last 3 days)
        // 2. Customers with pending quotes (quoted but not ordered in 7 days)
        // 3. Regular customers who haven't ordered in 30 days

        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const suggestions = [];

        // Abandoned carts
        const { data: abandonedCarts } = await supabase
            .from('carts')
            .select(`
                conversation_id,
                updated_at,
                conversations!inner(
                    end_user_phone,
                    tenant_id,
                    customer:customer_profiles(phone, name, business_name)
                )
            `)
            .eq('conversations.tenant_id', tenantId)
            .lt('updated_at', threeDaysAgo)
            .limit(10);

        if (abandonedCarts) {
            abandonedCarts.forEach(cart => {
                suggestions.push({
                    type: 'abandoned_cart',
                    priority: 'high',
                    customer_phone: cart.conversations.end_user_phone,
                    customer_name: cart.conversations.customer?.business_name || cart.conversations.customer?.name,
                    reason: 'Cart abandoned for 3+ days',
                    suggested_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                    message_template: '👋 Hi! I noticed you left some items in your cart. Would you like to complete your order?'
                });
            });
        }

        res.json({
            success: true,
            suggestions,
            total: suggestions.length
        });

    } catch (error) {
        console.error('[API] Error getting follow-up suggestions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/followups/:tenantId/trigger-intelligent
 * Manually trigger intelligent follow-up analysis (for testing)
 */
router.post('/:tenantId/trigger-intelligent', async (req, res) => {
    try {
        const { tenantId } = req.params;
        
        const { processIntelligentFollowUps } = require('../../services/intelligentFollowUpService');
        await processIntelligentFollowUps();
        
        res.json({
            success: true,
            message: 'Intelligent follow-up analysis completed. Check the follow-ups list for new entries.'
        });
        
    } catch (error) {
        console.error('[API] Error triggering intelligent follow-ups:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
