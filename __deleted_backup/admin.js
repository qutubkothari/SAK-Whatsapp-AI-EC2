/**
 * @title Admin Utility Script
 * @description A command-line tool for the SaaS administrator to perform management tasks.
 *
 * @usage node admin.js dashboard
 * @usage node admin.js set_tier <phone> <pro|standard>
 */
const { supabase } = require('./services/config');
const crypto = require('crypto');
const { sendMessage } = require('./services/whatsappService');
const { scheduleBroadcast } = require('./services/broadcastService');
const { listOpenTickets, getTicketDetails, closeTicket } = require('./services/supportTicketService');
const { getPlatformDashboard } = require('./services/platformAnalyticsService');
const { getPrunableDataSummary, pruneOldData } = require('./services/maintenanceService');
const { runHealthChecks } = require('./services/healthCheckService');

/**
 * Generates a unique, random activation key.
 * @returns {string} A unique activation key.
 */
const generateUniqueKey = () => {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
};

/**
 * Creates one or more activation keys and saves them to the database.
 * @param {number} durationDays - The number of days the subscription will be active for.
 * @param {number} [count=1] - The number of keys to generate.
 */
const createActivationKey = async (durationDays, count = 1) => {
    if (isNaN(durationDays) || durationDays <= 0) {
        console.error('Error: Please provide a valid number of days for the duration.');
        return;
    }
    if (isNaN(count) || count <= 0) {
        console.error('Error: Please provide a valid number of keys to generate.');
        return;
    }

    console.log(`Generating ${count} activation key(s) with a duration of ${durationDays} days...`);

    const keysToInsert = [];
    for (let i = 0; i < count; i++) {
        keysToInsert.push({
            key: generateUniqueKey(),
            duration_days: durationDays,
        });
    }

    try {
        const { data, error } = await supabase
            .from('activation_keys')
            .insert(keysToInsert)
            .select();

        if (error) throw error;

        console.log('Successfully generated and saved the following keys:');
        data.forEach(item => {
            console.log(`- ${item.key}`);
        });

    } catch (error) {
        console.error('Error saving keys to the database:', error.message);
    }
};

/**
 * Fetches and displays a list of all tenants from the database.
 */
const listTenants = async () => {
    console.log('Fetching all tenants...');
    try {
        const { data, error } = await supabase
            .from('tenants')
            .select('phone_number, subscription_status, subscription_tier, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data.length === 0) {
            console.log('No tenants found.');
            return;
        }

        console.log('--- Tenant List ---');
        data.forEach(tenant => {
            const createdDate = new Date(tenant.created_at).toLocaleDateString();
            console.log(`- Phone: ${tenant.phone_number} | Status: ${tenant.subscription_status} | Tier: ${tenant.subscription_tier} | Registered: ${createdDate}`);
        });
        console.log('-------------------');

    } catch (error) {
        console.error('Error fetching tenants:', error.message);
    }
};

/**
 * Fetches and displays all unused activation keys.
 */
const listKeys = async () => {
    console.log('Fetching all unused activation keys...');
    try {
        const { data, error } = await supabase
            .from('activation_keys')
            .select('key, duration_days')
            .eq('is_used', false);

        if (error) throw error;

        if (data.length === 0) {
            console.log('No unused keys found.');
            return;
        }

        console.log('--- Unused Activation Keys ---');
        data.forEach(item => {
            console.log(`- Key: ${item.key} | Duration: ${item.duration_days} days`);
        });
        console.log('----------------------------');

    } catch (error) {
        console.error('Error fetching keys:', error.message);
    }
};

/**
 * Extends a tenant's subscription by a certain number of days.
 * @param {string} phoneNumber The phone number of the tenant.
 * @param {number} days The number of days to extend the subscription by.
 */
const extendSubscription = async (phoneNumber, days) => {
    if (!phoneNumber || isNaN(days) || days <= 0) {
        console.error('Error: Please provide a valid phone number and number of days.');
        console.log('Usage: node admin.js extendSubscription <phone_number> <days>');
        return;
    }

    try {
        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, subscription_end_date')
            .eq('phone_number', phoneNumber)
            .single();

        if (error || !tenant) {
            return console.error(`Error: No tenant found with the phone number ${phoneNumber}.`);
        }

        const currentEndDate = new Date(tenant.subscription_end_date || Date.now());
        const newEndDate = new Date(currentEndDate.setDate(currentEndDate.getDate() + days));

        await supabase
            .from('tenants')
            .update({ subscription_end_date: newEndDate.toISOString(), subscription_status: 'active' })
            .eq('id', tenant.id);

        console.log(`Successfully extended subscription for ${phoneNumber}. New end date: ${newEndDate.toLocaleDateString()}`);

    } catch (error) {
        console.error('An error occurred while extending the subscription:', error.message);
    }
};

/**
 * Revokes a tenant's subscription immediately.
 * @param {string} phoneNumber The phone number of the tenant.
 */
const revokeSubscription = async (phoneNumber) => {
    if (!phoneNumber) {
        console.error('Error: Please provide a phone number.');
        console.log('Usage: node admin.js revokeSubscription <phone_number>');
        return;
    }
    try {
        const { data, error } = await supabase
            .from('tenants')
            .update({ subscription_status: 'expired' })
            .eq('phone_number', phoneNumber)
            .select();

        if (error) throw error;
        if (data && data.length > 0) {
            console.log(`Successfully revoked subscription for ${phoneNumber}.`);
        } else {
            console.error(`Error: No tenant found with the phone number ${phoneNumber}.`);
        }
    } catch (error) {
        console.error('An error occurred while revoking the subscription:', error.message);
    }
};

/**
 * Sets the billing URL for a specific tenant.
 * @param {string} phoneNumber The phone number of the tenant to update.
 * @param {string} url The new billing URL to set.
 */
const setBillingUrl = async (phoneNumber, url) => {
    if (!phoneNumber || !url) {
        console.error('Error: Please provide both a phone number and a URL.');
        console.log('Usage: node admin.js setBillingUrl <phone_number> <url>');
        return;
    }
    try {
        const { data, error } = await supabase
            .from('tenants')
            .update({ billing_url: url })
            .eq('phone_number', phoneNumber)
            .select();

        if (error) throw error;
        if (data && data.length > 0) {
            console.log(`Successfully updated the billing URL for ${phoneNumber}.`);
        } else {
            console.error(`Error: No tenant found with the phone number ${phoneNumber}.`);
        }
    } catch (error) {
        console.error('An error occurred while setting the billing URL:', error.message);
    }
};

/**
 * Sets the subscription tier for a specific tenant.
 * @param {string} phoneNumber The phone number of the tenant.
 * @param {string} tier The tier to set ('standard' or 'pro').
 */
const setTenantTier = async (phoneNumber, tier) => {
    if (!phoneNumber || !['standard', 'pro'].includes(tier)) {
        console.error('Usage: node admin.js set_tier <phone_number> <standard|pro>');
        return;
    }
    try {
        const { data, error } = await supabase
            .from('tenants')
            .update({ subscription_tier: tier })
            .eq('phone_number', phoneNumber)
            .select();

        if (error) throw error;
        if (data && data.length > 0) {
            console.log(`Successfully set tier for ${phoneNumber} to "${tier}".`);
        } else {
            console.error(`Error: No tenant found with the phone number ${phoneNumber}.`);
        }
    } catch (error) {
        console.error('An error occurred while setting the tier:', error.message);
    }
};

/**
 * Sends a broadcast message to all tenants.
 * @param {string} message The message to send.
 */
const broadcastToTenants = async (message) => {
    if (!message) {
        console.error('Error: Please provide a message to broadcast.');
        console.log('Usage: node admin.js broadcast "Your message here"');
        return;
    }
    try {
        console.log('Fetching all tenants for broadcast...');
        const { data: tenants, error } = await supabase.from('tenants').select('phone_number');
        if (error) throw error;

        if (!tenants || tenants.length === 0) {
            return console.log('No tenants to broadcast to.');
        }

        console.log(`Sending broadcast to ${tenants.length} tenant(s)...`);
        for (const tenant of tenants) {
            await sendMessage(tenant.phone_number, `📢 [Admin Broadcast]\n\n${message}`);
        }
        console.log('Broadcast complete.');

    } catch (error) {
        console.error('An error occurred during the broadcast:', error.message);
    }
};

/**
 * Adds a new onboarding message to the database.
 * @param {number} delayHours The delay in hours after signup to send the message.
 * @param {string} message The content of the tip message.
 */
const addOnboardingMessage = async (delayHours, message) => {
    if (isNaN(delayHours) || delayHours <= 0 || !message) {
        console.error('Usage: node admin.js add_tip <delay_hours> "<message>"');
        return;
    }
    try {
        await supabase.from('onboarding_messages').insert({ delay_hours: delayHours, message_body: message });
        console.log(`Onboarding tip for ${delayHours} hours has been added successfully.`);
    } catch (error) {
        console.error('Error adding onboarding message:', error.message);
        if (error.code === '23505') console.error('A tip for this hour already exists.');
    }
};

/**
 * Lists all configured onboarding messages.
 */
const listOnboardingMessages = async () => {
    try {
        const { data, error } = await supabase.from('onboarding_messages').select('*').order('delay_hours');
        if (error) throw error;
        if (!data.length) return console.log('No onboarding messages found.');

        console.log('--- Onboarding Tips ---');
        data.forEach(tip => {
            console.log(`- After ${tip.delay_hours} hours, send: "${tip.message_body}"`);
        });
        console.log('-----------------------');
    } catch (error) {
        console.error('Error listing onboarding messages:', error.message);
    }
};

/**
 * Deletes an onboarding message by its delay time.
 * @param {number} delayHours The delay in hours of the message to delete.
 */
const deleteOnboardingMessage = async (delayHours) => {
    if (isNaN(delayHours)) {
        console.error('Usage: node admin.js delete_tip <delay_hours>');
        return;
    }
    try {
        await supabase.from('onboarding_messages').delete().eq('delay_hours', delayHours);
        console.log(`Onboarding tip for ${delayHours} hours has been deleted.`);
    } catch (error) {
        console.error('Error deleting onboarding message:', error.message);
    }
};


// --- Command Line Interface Logic ---
const command = process.argv[2];
const args = process.argv.slice(3);

const run = async () => {
    switch (command) {
        case 'generateKey':
            const duration = parseInt(args[0], 10);
            const number = args[1] ? parseInt(args[1], 10) : 1;
            await createActivationKey(duration, number);
            break;
        case 'listTenants':
            await listTenants();
            break;
        case 'listKeys':
            await listKeys();
            break;
        case 'extendSubscription':
            const phoneExt = args[0];
            const days = parseInt(args[1], 10);
            await extendSubscription(phoneExt, days);
            break;
        case 'revokeSubscription':
            const phoneRev = args[0];
            await revokeSubscription(phoneRev);
            break;
        case 'setBillingUrl':
            const phoneBill = args[0];
            const billingUrl = args[1];
            await setBillingUrl(phoneBill, billingUrl);
            break;
        case 'set_tier':
            const phoneTier = args[0];
            const tier = args[1];
            await setTenantTier(phoneTier, tier);
            break;
        case 'broadcast':
            const message = args[0];
            await broadcastToTenants(message);
            break;
        case 'schedule_broadcast':
            const timeString = args[0];
            const broadcastMessage = args.slice(1).join(' ');
            const result = await scheduleBroadcast(broadcastMessage, timeString);
            console.log(result.message);
            break;
        case 'list_tickets':
            const report = await listOpenTickets();
            console.log(report);
            break;
        case 'view_ticket':
            const ticketId = args[0];
            const details = await getTicketDetails(ticketId);
            console.log(details);
            break;
        case 'close_ticket':
            const ticketToClose = args[0];
            const closeResult = await closeTicket(ticketToClose);
            console.log(closeResult);
            break;
        case 'add_tip':
            const delay = parseInt(args[0], 10);
            const tipMessage = args.slice(1).join(' ');
            await addOnboardingMessage(delay, tipMessage);
            break;
        case 'list_tips':
            await listOnboardingMessages();
            break;
        case 'delete_tip':
            const delayToDelete = parseInt(args[0], 10);
            await deleteOnboardingMessage(delayToDelete);
            break;
        case 'dashboard':
            const dashboardReport = await getPlatformDashboard();
            console.log(dashboardReport);
            break;
        case 'view_prunable_data':
            const daysOldView = parseInt(args[0], 10) || 90;
            const summary = await getPrunableDataSummary(daysOldView);
            console.log(summary);
            break;
        case 'prune_data':
            const daysOldPrune = parseInt(args[0], 10);
            const confirm = args[1];
            if (isNaN(daysOldPrune) || confirm !== 'CONFIRM') {
                console.error('Usage: node admin.js prune_data <days> CONFIRM');
                console.error('This is a destructive action. You must type CONFIRM to proceed.');
                return;
            }
            const pruneResult = await pruneOldData(daysOldPrune);
            console.log(pruneResult);
            break;
        case 'health_check':
            const healthReport = await runHealthChecks();
            console.log(healthReport);
            break;
        default:
            console.log('Unknown command. Available commands:');
            console.log('  - dashboard');
            console.log('  - health_check');
            console.log('  - generateKey <duration> [count]');
            console.log('  - listTenants');
            console.log('  - listKeys');
            console.log('  - extendSubscription <phone> <days>');
            console.log('  - revokeSubscription <phone>');
            console.log('  - setBillingUrl <phone> <url>');
            console.log('  - set_tier <phone> <pro|standard>');
            console.log('  - broadcast "<message>"');
            console.log('  - schedule_broadcast "<time>" "<message>"');
            console.log('  - list_tickets');
            console.log('  - view_ticket <id>');
            console.log('  - close_ticket <id>');
            console.log('  - add_tip <delay_hours> "<message>"');
            console.log('  - list_tips');
            console.log('  - delete_tip <delay_hours>');
            console.log('  - view_prunable_data [days]');
            console.log('  - prune_data <days> CONFIRM');
    }
};

run();

