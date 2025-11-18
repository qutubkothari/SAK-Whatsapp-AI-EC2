/**
 * WhatsApp Web Service using whatsapp-web.js
 * Standalone broadcast system with QR code authentication
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { supabase } = require('./config');
const fs = require('fs');
const path = require('path');

// Store active WhatsApp clients per tenant
const clients = new Map();
const qrCodes = new Map();
const clientStatus = new Map();

/**
 * Initialize WhatsApp Web client for a tenant
 */
async function initializeClient(tenantId) {
    console.log(`[WA_WEB] Initializing client for tenant: ${tenantId}`);
    
    // Check if client already exists and is ready
    if (clients.has(tenantId)) {
        const existingClient = clients.get(tenantId);
        if (clientStatus.get(tenantId) === 'ready') {
            console.log(`[WA_WEB] Client already initialized and ready for tenant: ${tenantId}`);
            return { success: true, status: 'ready' };
        }
    }

    try {
        console.log(`[WA_WEB] Creating client WITH persistent auth (LocalAuth)`);

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: tenantId,
                dataPath: path.join(process.cwd(), '.wwebjs_auth')
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        // QR Code event
        client.on('qr', async (qr) => {
            console.log(`[WA_WEB] QR Code generated for tenant: ${tenantId}`);
            try {
                const qrDataUrl = await qrcode.toDataURL(qr);
                qrCodes.set(tenantId, qrDataUrl);
                clientStatus.set(tenantId, 'qr_ready');
                
                // Save QR code to database
                await supabase
                    .from('whatsapp_connections')
                    .upsert({
                        tenant_id: tenantId,
                        qr_code: qrDataUrl,
                        status: 'awaiting_scan',
                        updated_at: new Date().toISOString()
                    });
            } catch (err) {
                console.error(`[WA_WEB] QR Code generation error for tenant ${tenantId}:`, err);
            }
        });

        // Ready event
        client.on('ready', async () => {
            console.log(`[WA_WEB] Client ready for tenant: ${tenantId}`);
            clientStatus.set(tenantId, 'ready');
            qrCodes.delete(tenantId);
            
            try {
                // Get connected phone number
                const info = client.info;
                console.log(`[WA_WEB] Phone info:`, info.wid.user);
                
                // Update database - use update instead of upsert to avoid conflict
                const { data, error } = await supabase
                    .from('whatsapp_connections')
                    .update({
                        phone_number: info.wid.user,
                        status: 'connected',
                        qr_code: null,
                        connected_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('tenant_id', tenantId);
                
                if (error) {
                    console.error(`[WA_WEB] Database update error for tenant ${tenantId}:`, error);
                } else {
                    console.log(`[WA_WEB] Database updated successfully for tenant ${tenantId}`);
                }
            } catch (err) {
                console.error(`[WA_WEB] Error in ready handler for tenant ${tenantId}:`, err);
            }
        });

        // Authenticated event
        client.on('authenticated', () => {
            console.log(`[WA_WEB] Client authenticated for tenant: ${tenantId}`);
            clientStatus.set(tenantId, 'authenticated');
        });

        // Disconnected event
        client.on('disconnected', async (reason) => {
            console.log(`[WA_WEB] Client disconnected for tenant ${tenantId}:`, reason);
            clientStatus.set(tenantId, 'disconnected');
            clients.delete(tenantId);
            qrCodes.delete(tenantId);
            
            // Update database
            await supabase
                .from('whatsapp_connections')
                .update({
                    status: 'disconnected',
                    updated_at: new Date().toISOString()
                })
                .eq('tenant_id', tenantId);
        });

        // Authentication failure event
        client.on('auth_failure', async (msg) => {
            console.error(`[WA_WEB] Authentication failure for tenant ${tenantId}:`, msg);
            clientStatus.set(tenantId, 'auth_failed');
            
            // Update database
            await supabase
                .from('whatsapp_connections')
                .update({
                    status: 'auth_failed',
                    updated_at: new Date().toISOString()
                })
                .eq('tenant_id', tenantId);
        });

        // Store client
        clients.set(tenantId, client);
        clientStatus.set(tenantId, 'initializing');

        // Initialize client with timeout to prevent hanging
        const initTimeout = setTimeout(() => {
            console.error(`[WA_WEB] Initialization timeout for tenant ${tenantId}`);
            clientStatus.set(tenantId, 'timeout');
        }, 30000); // 30 second timeout

        try {
            // Initialize in background - don't await to prevent API timeout
            client.initialize().then(() => {
                clearTimeout(initTimeout);
                console.log(`[WA_WEB] Client initialization complete for tenant ${tenantId}`);
            }).catch((err) => {
                clearTimeout(initTimeout);
                console.error(`[WA_WEB] Client initialization failed for tenant ${tenantId}:`, err);
                clientStatus.set(tenantId, 'error');
            });
        } catch (err) {
            clearTimeout(initTimeout);
            throw err;
        }

        return { success: true, status: 'initializing' };

    } catch (error) {
        console.error(`[WA_WEB] Error initializing client for tenant ${tenantId}:`, error);
        clientStatus.set(tenantId, 'error');
        return { success: false, error: error.message };
    }
}

/**
 * Get QR code for tenant
 */
function getQRCode(tenantId) {
    const qr = qrCodes.get(tenantId);
    const status = clientStatus.get(tenantId) || 'not_initialized';
    
    return {
        qrCode: qr || null,
        status: status
    };
}

/**
 * Get client status
 */
function getClientStatus(tenantId) {
    return {
        status: clientStatus.get(tenantId) || 'not_initialized',
        hasClient: clients.has(tenantId)
    };
}

/**
 * Disconnect client
 */
async function disconnectClient(tenantId) {
    console.log(`[WA_WEB] Disconnecting client for tenant: ${tenantId}`);
    
    try {
        const client = clients.get(tenantId);
        if (client) {
            await client.destroy();
            clients.delete(tenantId);
            clientStatus.delete(tenantId);
            qrCodes.delete(tenantId);
        }

        // Update database
        await supabase
            .from('whatsapp_connections')
            .update({
                status: 'disconnected',
                updated_at: new Date().toISOString()
            })
            .eq('tenant_id', tenantId);

        return { success: true };
    } catch (error) {
        console.error(`[WA_WEB] Error disconnecting client for tenant ${tenantId}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send text message via WhatsApp Web
 */
async function sendWebMessage(tenantId, phoneNumber, message) {
    const client = clients.get(tenantId);
    
    if (!client) {
        throw new Error('WhatsApp client not initialized. Please connect via QR code first.');
    }

    const status = clientStatus.get(tenantId);
    if (status !== 'ready') {
        throw new Error(`WhatsApp client not ready. Current status: ${status}`);
    }

    try {
        // Format phone number for WhatsApp (add @c.us suffix)
        const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
        
        // Send message
        const sentMessage = await client.sendMessage(chatId, message);
        
        console.log(`[WA_WEB] Message sent to ${phoneNumber} via tenant ${tenantId}`);
        
        return {
            success: true,
            messageId: sentMessage.id.id
        };

    } catch (error) {
        console.error(`[WA_WEB] Error sending message to ${phoneNumber}:`, error);
        throw error;
    }
}

/**
 * Send image message via WhatsApp Web
 */
async function sendWebImageMessage(tenantId, phoneNumber, caption, imageBase64OrUrl) {
    const client = clients.get(tenantId);
    
    if (!client) {
        throw new Error('WhatsApp client not initialized. Please connect via QR code first.');
    }

    const status = clientStatus.get(tenantId);
    if (status !== 'ready') {
        throw new Error(`WhatsApp client not ready. Current status: ${status}`);
    }

    try {
        // Format phone number
        const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
        
        // Create media from base64 or URL
        let media;
        if (imageBase64OrUrl.startsWith('data:')) {
            // Base64 image
            media = new MessageMedia(
                'image/jpeg',
                imageBase64OrUrl.split(',')[1],
                'broadcast_image.jpg'
            );
        } else if (imageBase64OrUrl.startsWith('http')) {
            // URL image
            media = await MessageMedia.fromUrl(imageBase64OrUrl);
        } else {
            // Assume it's base64 without data URI prefix
            media = new MessageMedia('image/jpeg', imageBase64OrUrl, 'broadcast_image.jpg');
        }
        
        // Send message with media
        const sentMessage = await client.sendMessage(chatId, media, { caption: caption });
        
        console.log(`[WA_WEB] Image message sent to ${phoneNumber} via tenant ${tenantId}`);
        
        return {
            success: true,
            messageId: sentMessage.id.id
        };

    } catch (error) {
        console.error(`[WA_WEB] Error sending image to ${phoneNumber}:`, error);
        throw error;
    }
}

/**
 * Check if number is registered on WhatsApp
 */
async function isRegisteredUser(tenantId, phoneNumber) {
    const client = clients.get(tenantId);
    
    if (!client || clientStatus.get(tenantId) !== 'ready') {
        return false;
    }

    try {
        const chatId = phoneNumber.includes('@c.us') ? phoneNumber.replace('@c.us', '') : phoneNumber;
        const isRegistered = await client.isRegisteredUser(`${chatId}@c.us`);
        return isRegistered;
    } catch (error) {
        console.error(`[WA_WEB] Error checking registration for ${phoneNumber}:`, error);
        return false;
    }
}

/**
 * Get all active connections
 */
function getAllConnections() {
    const connections = [];
    for (const [tenantId, client] of clients.entries()) {
        connections.push({
            tenantId,
            status: clientStatus.get(tenantId),
            hasQR: qrCodes.has(tenantId)
        });
    }
    return connections;
}

/**
 * Auto-initialize clients for tenants with connected status on server startup
 */
async function autoInitializeConnectedClients() {
    try {
        console.log('[WA_WEB] Auto-initializing connected clients on server startup...');
        
        const { data: connections, error } = await supabase
            .from('whatsapp_connections')
            .select('tenant_id, status')
            .eq('status', 'connected');
        
        if (error) {
            console.error('[WA_WEB] Error fetching connected clients:', error);
            return;
        }
        
        if (!connections || connections.length === 0) {
            console.log('[WA_WEB] No connected clients to auto-initialize');
            return;
        }
        
        console.log(`[WA_WEB] Found ${connections.length} connected client(s), initializing...`);
        
        // Initialize each connected tenant's client
        for (const conn of connections) {
            console.log(`[WA_WEB] Auto-initializing client for tenant: ${conn.tenant_id}`);
            try {
                await initializeClient(conn.tenant_id);
            } catch (error) {
                console.error(`[WA_WEB] Failed to auto-initialize tenant ${conn.tenant_id}:`, error.message);
            }
        }
        
        console.log('[WA_WEB] Auto-initialization complete');
    } catch (error) {
        console.error('[WA_WEB] Error in autoInitializeConnectedClients:', error);
    }
}

module.exports = {
    initializeClient,
    getQRCode,
    getClientStatus,
    disconnectClient,
    sendWebMessage,
    sendWebImageMessage,
    sendWebMessageWithMedia: sendWebImageMessage, // Alias for broadcast compatibility
    isRegisteredUser,
    getAllConnections,
    autoInitializeConnectedClients
};
