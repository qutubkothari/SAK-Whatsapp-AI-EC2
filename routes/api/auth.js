const express = require('express');
const router = express.Router();
const { supabase } = require('../../services/config');
const crypto = require('crypto');

/**
 * POST /api/auth/login
 * Login with phone number and password
 */
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and password are required'
            });
        }

        // Clean phone number (remove spaces, dashes, etc.)
        let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Remove @c.us if user includes it
        cleanPhone = cleanPhone.replace(/@c\.us$/i, '');

        console.log('[AUTH] Login attempt for phone:', cleanPhone);

        // Try multiple phone number formats to find tenant
        // Format 1: Just the number (e.g., 919537653927)
        // Format 2: With @c.us suffix (e.g., 919537653927@c.us)
        const phoneFormats = [
            cleanPhone,
            `${cleanPhone}@c.us`
        ];

        let tenant = null;
        let tenantError = null;

        // Try each phone format
        for (const phoneFormat of phoneFormats) {
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('phone_number', phoneFormat)
                .single();
            
            if (data && !error) {
                tenant = data;
                break;
            }
            tenantError = error;
        }

        // Also try owner_whatsapp_number field
        if (!tenant) {
            for (const phoneFormat of phoneFormats) {
                const { data, error } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('owner_whatsapp_number', phoneFormat)
                    .single();
                
                if (data && !error) {
                    tenant = data;
                    break;
                }
            }
        }

        if (!tenant) {
            console.log('[AUTH] Tenant not found for any format:', phoneFormats);
            return res.status(401).json({
                success: false,
                error: 'Invalid phone number or password'
            });
        }

        // Check if password field exists, if not, check for default password
        const storedPassword = tenant.password || tenant.business_name; // Default to business name if no password set
        
        // Simple password comparison (you can enhance this with bcrypt later)
        if (password !== storedPassword) {
            console.log('[AUTH] Invalid password for:', cleanPhone);
            return res.status(401).json({
                success: false,
                error: 'Invalid phone number or password'
            });
        }

        console.log('[AUTH] Login successful for:', tenant.business_name);

        // Create session object
        const session = {
            tenantId: tenant.id,
            businessName: tenant.business_name,
            phoneNumber: tenant.phone_number,
            loginTime: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Login successful',
            session: session
        });

    } catch (error) {
        console.error('[AUTH] Login error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred during login'
        });
    }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', async (req, res) => {
    try {
        const { tenantId, currentPassword, newPassword } = req.body;

        if (!tenantId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Get tenant
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

        if (tenantError || !tenant) {
            return res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
        }

        // Verify current password
        const storedPassword = tenant.password || tenant.business_name;
        if (currentPassword !== storedPassword) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Update password
        const { error: updateError } = await supabase
            .from('tenants')
            .update({ password: newPassword })
            .eq('id', tenantId);

        if (updateError) {
            throw updateError;
        }

        console.log('[AUTH] Password changed for tenant:', tenantId);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('[AUTH] Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while changing password'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout (client-side will clear localStorage)
 */
router.post('/logout', async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
