-- ====================================
-- DISCOUNT MANAGEMENT SYSTEM
-- Database Schema Migration
-- ====================================

-- Step 1: Create discount_rules table
CREATE TABLE IF NOT EXISTS discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL, 
    -- Types: 'volume', 'customer', 'product', 'category', 'coupon', 'time_based', 'first_order', 'loyalty'
    
    -- Discount Value
    discount_value_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed_amount'
    discount_value DECIMAL(10, 2) NOT NULL,
    max_discount_amount DECIMAL(10, 2), -- Cap for percentage discounts
    
    -- Applicability Rules (Minimum thresholds)
    min_order_value DECIMAL(10, 2),
    min_quantity INTEGER,
    max_quantity INTEGER,
    
    -- Specific Applicability (JSON arrays for flexibility)
    applicable_product_ids TEXT[], -- Array of product IDs (converted to text for Postgres)
    applicable_category_ids TEXT[], -- Array of category names
    applicable_customer_ids TEXT[], -- Array of customer profile IDs
    applicable_customer_tiers TEXT[], -- ['vip', 'regular', 'new', 'wholesale', 'retail']
    
    -- Coupon Code (if discount_type = 'coupon')
    coupon_code VARCHAR(50) UNIQUE,
    coupon_usage_limit INTEGER,
    coupon_used_count INTEGER DEFAULT 0,
    
    -- Time-based Rules
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    active_days_of_week INTEGER[], -- [0=Sunday, 1=Monday, ..., 6=Saturday]
    active_hours_start TIME,
    active_hours_end TIME,
    
    -- Priority & Stacking
    priority INTEGER DEFAULT 0, -- Higher priority applied first
    can_stack_with_other_discounts BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255), -- Admin username or ID
    
    -- Analytics
    times_applied INTEGER DEFAULT 0,
    total_discount_given DECIMAL(12, 2) DEFAULT 0,
    
    -- Constraints
    CONSTRAINT valid_discount_type CHECK (discount_type IN (
        'volume', 'customer', 'product', 'category', 'coupon', 
        'time_based', 'first_order', 'loyalty', 'wholesale', 'retail'
    )),
    CONSTRAINT valid_discount_value_type CHECK (discount_value_type IN ('percentage', 'fixed_amount')),
    CONSTRAINT valid_discount_value CHECK (discount_value >= 0),
    CONSTRAINT valid_max_discount CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
    CONSTRAINT valid_priority CHECK (priority >= 0)
);

-- Step 2: Create discount_applications table (audit log)
CREATE TABLE IF NOT EXISTS discount_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    discount_rule_id UUID REFERENCES discount_rules(id) ON DELETE SET NULL,
    
    -- Order & Customer Info
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20),
    customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
    
    -- Discount Details
    discount_name VARCHAR(255) NOT NULL,
    discount_type VARCHAR(50),
    discount_amount DECIMAL(10, 2) NOT NULL,
    coupon_code VARCHAR(50),
    
    -- Order Values
    order_value_before_discount DECIMAL(10, 2) NOT NULL,
    order_value_after_discount DECIMAL(10, 2) NOT NULL,
    quantity INTEGER,
    
    -- Metadata
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    applied_by VARCHAR(50) DEFAULT 'system' -- 'system', 'manual', 'ai_negotiation'
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discount_rules_tenant ON discount_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_type ON discount_rules(discount_type);
CREATE INDEX IF NOT EXISTS idx_discount_rules_active ON discount_rules(is_active, tenant_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_dates ON discount_rules(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_discount_rules_coupon ON discount_rules(coupon_code) WHERE coupon_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_discount_applications_tenant ON discount_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_discount_applications_order ON discount_applications(order_id);
CREATE INDEX IF NOT EXISTS idx_discount_applications_rule ON discount_applications(discount_rule_id);
CREATE INDEX IF NOT EXISTS idx_discount_applications_date ON discount_applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_discount_applications_customer ON discount_applications(customer_profile_id);

-- Step 4: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discount_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discount_rules_timestamp
    BEFORE UPDATE ON discount_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_discount_rules_updated_at();

-- Step 5: Insert sample discount rules for testing (optional)
-- Uncomment to add sample data for your tenant

/*
-- Volume Discount Example
INSERT INTO discount_rules (
    tenant_id, 
    name, 
    description, 
    discount_type, 
    discount_value_type, 
    discount_value,
    min_quantity,
    is_active,
    priority
) VALUES (
    'YOUR_TENANT_ID_HERE',
    'Bulk Order Discount',
    '5% off on orders of 50+ units',
    'volume',
    'percentage',
    5.00,
    50,
    true,
    10
);

-- VIP Customer Discount Example
INSERT INTO discount_rules (
    tenant_id,
    name,
    description,
    discount_type,
    discount_value_type,
    discount_value,
    applicable_customer_tiers,
    is_active,
    priority
) VALUES (
    'YOUR_TENANT_ID_HERE',
    'VIP Customer Discount',
    '10% discount for VIP customers',
    'customer',
    'percentage',
    10.00,
    ARRAY['vip'],
    true,
    20
);

-- Coupon Code Example
INSERT INTO discount_rules (
    tenant_id,
    name,
    description,
    discount_type,
    discount_value_type,
    discount_value,
    max_discount_amount,
    min_order_value,
    coupon_code,
    coupon_usage_limit,
    valid_from,
    valid_to,
    is_active,
    priority
) VALUES (
    'YOUR_TENANT_ID_HERE',
    'WELCOME10',
    'Welcome offer - 10% off on first order',
    'coupon',
    'percentage',
    10.00,
    1000.00,
    5000.00,
    'WELCOME10',
    100,
    NOW(),
    NOW() + INTERVAL '30 days',
    true,
    15
);
*/

-- Step 6: Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON discount_rules TO your_app_user;
-- GRANT SELECT, INSERT ON discount_applications TO your_app_user;

-- ====================================
-- VERIFICATION QUERIES
-- ====================================

-- Check if tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('discount_rules', 'discount_applications');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('discount_rules', 'discount_applications');

-- Count discount rules by type
SELECT discount_type, COUNT(*) 
FROM discount_rules 
GROUP BY discount_type;
