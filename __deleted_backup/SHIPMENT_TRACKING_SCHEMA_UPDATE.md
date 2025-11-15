# Shipment Tracking Schema Update

## Changes Made

Updated shipment tracking integration to work with your existing database schema:

### Database Schema Changes

**Before:**
- Referenced non-existent `customers` table
- Used integer `customer_id`

**After:**
- References existing `customer_profiles` table
- Uses UUID `customer_profile_id`
- Added `tenant_id` UUID column for multi-tenant support

### Updated Table Structure

```sql
CREATE TABLE shipment_tracking (
  id SERIAL PRIMARY KEY,
  tracking_number VARCHAR(100) NOT NULL,
  carrier VARCHAR(50) NOT NULL DEFAULT 'VRL',
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  tenant_id UUID,  -- Links to tenants table
  phone_number VARCHAR(50),
  customer_name VARCHAR(255),
  status VARCHAR(255),
  origin VARCHAR(255),
  destination VARCHAR(255),
  current_location VARCHAR(255),
  latest_update TEXT,
  tracking_data JSONB,
  last_checked TIMESTAMP DEFAULT NOW(),
  last_notified TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### New Indexes

```sql
CREATE INDEX idx_shipment_tracking_number ON shipment_tracking(tracking_number);
CREATE INDEX idx_shipment_phone ON shipment_tracking(phone_number);
CREATE INDEX idx_shipment_tenant ON shipment_tracking(tenant_id);  -- NEW
CREATE INDEX idx_shipment_customer_profile ON shipment_tracking(customer_profile_id);  -- NEW
CREATE INDEX idx_shipment_active ON shipment_tracking(is_active) WHERE is_active = true;
CREATE INDEX idx_shipment_last_checked ON shipment_tracking(last_checked);
```

## Code Updates

### 1. vrlTrackingService.js

**Function Signature Changed:**
```javascript
// Before
async function saveShipmentTracking(lrNumber, phoneNumber, trackingData, customerId = null)

// After
async function saveShipmentTracking(lrNumber, phoneNumber, trackingData, customerProfileId = null, tenantId = null)
```

**Database Record Updated:**
```javascript
const trackingRecord = {
  // ...
  customer_profile_id: customerProfileId,  // Changed from customer_id
  tenant_id: tenantId,  // NEW
  // ...
};
```

### 2. shipmentTrackingHandler.js

**Customer Lookup Changed:**
```javascript
// Before
const { data: customer } = await supabase
  .from('customers')
  .select('id')
  .eq('phone_number', from)
  .single();

// After
const { data: customerProfile } = await supabase
  .from('customer_profiles')
  .select('id, tenant_id')
  .eq('phone', from)
  .single();
```

**Function Call Updated:**
```javascript
// Before
await saveShipmentTracking(lrNumber, from, result.tracking, customer?.id);

// After
await saveShipmentTracking(
  lrNumber, 
  from, 
  result.tracking, 
  customerProfile?.id,
  customerProfile?.tenant_id
);
```

## Deployment Instructions

### Step 1: Apply Database Migration

Run the updated migration file in Supabase SQL Editor:

```bash
database_migrations/fix_shipment_tracking_table.sql
```

This will:
1. Drop existing tables (if any)
2. Create `shipment_tracking` table with correct schema
3. Create `shipment_tracking_history` table
4. Create all indexes
5. Create triggers
6. Add documentation comments

### Step 2: Verify Tables Created

Run in Supabase SQL Editor:

```sql
-- Check shipment_tracking table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'shipment_tracking'
ORDER BY ordinal_position;

-- Verify foreign key to customer_profiles
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'shipment_tracking'
  AND tc.constraint_type = 'FOREIGN KEY';
```

### Step 3: Test Integration

**Test customer lookup:**
```sql
-- See if you have customer profiles
SELECT id, tenant_id, phone, first_name, last_name
FROM customer_profiles
LIMIT 5;
```

**Test tracking insert:**
```sql
-- This should work now (replace with real values)
INSERT INTO shipment_tracking (
  tracking_number,
  carrier,
  phone_number,
  customer_profile_id,
  tenant_id,
  status,
  is_active
) VALUES (
  '1099492944',
  'VRL',
  '919876543210',
  (SELECT id FROM customer_profiles LIMIT 1),
  (SELECT tenant_id FROM customer_profiles LIMIT 1),
  'In Transit',
  true
) RETURNING *;
```

## Benefits of Updated Schema

1. **Multi-tenant Support**: Each shipment is now linked to a tenant
2. **Proper Foreign Keys**: Links to existing `customer_profiles` table
3. **UUID Support**: Compatible with Supabase's UUID primary keys
4. **Better Indexing**: Added indexes for tenant_id and customer_profile_id
5. **Cascade Handling**: `ON DELETE SET NULL` prevents orphaned records

## Query Examples

### Get shipments for a specific tenant
```sql
SELECT * 
FROM shipment_tracking 
WHERE tenant_id = 'your-tenant-uuid'
  AND is_active = true
ORDER BY created_at DESC;
```

### Get shipments for a customer profile
```sql
SELECT 
  st.*,
  cp.first_name,
  cp.last_name,
  cp.email
FROM shipment_tracking st
JOIN customer_profiles cp ON st.customer_profile_id = cp.id
WHERE cp.phone = '919876543210'
ORDER BY st.created_at DESC;
```

### Get active shipments with customer details
```sql
SELECT 
  st.tracking_number,
  st.status,
  st.current_location,
  st.last_checked,
  cp.first_name || ' ' || cp.last_name AS customer_name,
  cp.phone,
  cp.company
FROM shipment_tracking st
LEFT JOIN customer_profiles cp ON st.customer_profile_id = cp.id
WHERE st.is_active = true
  AND st.tenant_id = 'your-tenant-uuid'
ORDER BY st.last_checked ASC;
```

## Files Modified

1. ✅ `database_migrations/fix_shipment_tracking_table.sql` - Updated schema
2. ✅ `services/vrlTrackingService.js` - Updated function signature and database fields
3. ✅ `handlers/shipmentTrackingHandler.js` - Updated customer lookup query

## Next Steps

1. Apply the migration using `fix_shipment_tracking_table.sql`
2. Verify tables were created successfully
3. Test with a real WhatsApp message containing an LR number
4. Monitor logs for any errors
5. Proceed with full deployment as per `DEPLOYMENT_CHECKLIST.md`

## Rollback (If Needed)

```sql
DROP TABLE IF EXISTS shipment_tracking_history CASCADE;
DROP TABLE IF EXISTS shipment_tracking CASCADE;
DROP FUNCTION IF EXISTS update_shipment_tracking_updated_at() CASCADE;
```

---

**Status**: ✅ Ready to deploy with correct schema
**Compatibility**: Works with existing `customer_profiles` and `tenants` tables
