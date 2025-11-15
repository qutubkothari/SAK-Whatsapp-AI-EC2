-- Migration: Add customer_name, customer_mobile, shipping_address, zoho_invoice_id to orders
ALTER TABLE orders
ADD COLUMN customer_name VARCHAR(255),
ADD COLUMN customer_mobile VARCHAR(32),
ADD COLUMN shipping_address TEXT,
ADD COLUMN zoho_invoice_id VARCHAR(64);

-- Optional: Add comments for clarity
COMMENT ON COLUMN orders.customer_name IS 'Contact name from Zoho or WhatsApp';
COMMENT ON COLUMN orders.customer_mobile IS 'Mobile number of the customer';
COMMENT ON COLUMN orders.shipping_address IS 'Shipping address from Zoho';
COMMENT ON COLUMN orders.zoho_invoice_id IS 'Zoho Invoice Number (if available)';
