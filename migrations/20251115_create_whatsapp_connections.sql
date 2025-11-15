-- Migration: Create WhatsApp Web Connections Table
-- Date: 2025-11-15
-- Description: Table to store WhatsApp Web connection status per tenant (standalone system)

CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id SERIAL PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected',
    qr_code TEXT,
    connected_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster tenant lookup
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_tenant_id ON whatsapp_connections(tenant_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);

-- Comment
COMMENT ON TABLE whatsapp_connections IS 'Stores WhatsApp Web connection status for standalone broadcast system (separate from Maytapi)';
COMMENT ON COLUMN whatsapp_connections.status IS 'Connection status: disconnected, initializing, qr_ready, authenticated, ready, auth_failed, error';
COMMENT ON COLUMN whatsapp_connections.qr_code IS 'Base64 QR code data URL for scanning';
COMMENT ON COLUMN whatsapp_connections.phone_number IS 'Connected WhatsApp phone number (populated after authentication)';
