# Check Logs for Add Product Fix
# Run this script to verify the deployment is working

Write-Host "=== Checking Add Product Fix Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check current version
Write-Host "1. Checking deployed versions..." -ForegroundColor Yellow
gcloud app versions list --service=default --format="table(version.id,traffic_split,last_deployed)" --limit=3
Write-Host ""

# Check recent logs for our patterns
Write-Host "2. Checking logs for ADDITIONAL_PRODUCT messages..." -ForegroundColor Yellow
$logs = gcloud app logs read --service=default --limit=200 2>&1
$additionalProductLogs = $logs | Select-String "ADDITIONAL_PRODUCT"
if ($additionalProductLogs) {
    Write-Host "Found ADDITIONAL_PRODUCT logs:" -ForegroundColor Green
    $additionalProductLogs | Select-Object -First 10
} else {
    Write-Host "No ADDITIONAL_PRODUCT logs yet (feature may not have been triggered)" -ForegroundColor Yellow
}
Write-Host ""

# Check for ORDER_CONFIRM rejections
Write-Host "3. Checking logs for ORDER_CONFIRM rejections..." -ForegroundColor Yellow
$confirmLogs = $logs | Select-String "ORDER_CONFIRM.*Rejected"
if ($confirmLogs) {
    Write-Host "Found ORDER_CONFIRM rejection logs:" -ForegroundColor Green
    $confirmLogs | Select-Object -First 10
} else {
    Write-Host "No ORDER_CONFIRM rejections yet" -ForegroundColor Yellow
}
Write-Host ""

# Check for errors
Write-Host "4. Checking for errors..." -ForegroundColor Yellow
$errorLogs = $logs | Select-String "ERROR|Error:" | Where-Object { $_ -notmatch "Error: No error" }
if ($errorLogs) {
    Write-Host "⚠️  Found errors:" -ForegroundColor Red
    $errorLogs | Select-Object -First 10
} else {
    Write-Host "✓ No errors found" -ForegroundColor Green
}
Write-Host ""

# Check for recent customer messages
Write-Host "5. Recent customer activity..." -ForegroundColor Yellow
$customerLogs = $logs | Select-String "\[CUSTOMER\]|\[ORDER\]" | Select-Object -First 10
if ($customerLogs) {
    $customerLogs
} else {
    Write-Host "No recent customer activity" -ForegroundColor Gray
}
Write-Host ""

Write-Host "=== Log Check Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test via WhatsApp: 'give me price 8x80 10 ctns' then 'add 8x100 5ctns'"
Write-Host "2. Run this script again after testing to see the logs"
Write-Host "3. Check that cart shows BOTH products (8x80 and 8x100)"
Write-Host ""
Write-Host "=== Log Check Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test via WhatsApp: 'give me price 8x80 10 ctns' then 'add 8x100 5ctns'"
Write-Host "2. Run this script again after testing to see the logs"
Write-Host "3. Check that cart shows BOTH products (8x80 and 8x100)"
Write-Host ""
