-- ====================================
-- PRODUCT CATEGORIES SYSTEM
-- Database Schema Migration
-- ====================================

-- Step 1: Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique category names per tenant
    CONSTRAINT unique_category_per_tenant UNIQUE (tenant_id, name)
);

-- Step 2: Add category_id to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Step 4: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_categories_timestamp
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- Step 5: Insert sample categories (optional - uncomment to use)
/*
INSERT INTO categories (tenant_id, name, description) VALUES
    ('YOUR_TENANT_ID_HERE', 'NFF', 'NFF Category Products'),
    ('YOUR_TENANT_ID_HERE', 'Electronics', 'Electronic Products'),
    ('YOUR_TENANT_ID_HERE', 'Hardware', 'Hardware Products');
*/

-- ====================================
-- VERIFICATION QUERIES
-- ====================================

-- Check if tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('categories');

-- Check if column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'category_id';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('categories', 'products')
AND indexname LIKE '%category%';
