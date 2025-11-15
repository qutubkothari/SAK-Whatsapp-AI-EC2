-- Verify proactive_messages table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'proactive_messages'
ORDER BY ordinal_position;

-- Check if we have any existing records
SELECT COUNT(*) as total_records FROM proactive_messages;

-- Check if tenant_id is populated
SELECT 
  COUNT(*) as total,
  COUNT(tenant_id) as with_tenant_id,
  COUNT(*) - COUNT(tenant_id) as missing_tenant_id
FROM proactive_messages;

-- Verify indexes exist
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'proactive_messages'
ORDER BY indexname;

-- Verify customer_messaging_preferences table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'customer_messaging_preferences';
