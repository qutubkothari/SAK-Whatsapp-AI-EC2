# Get recent App Engine logs for discount and cart issues
# Usage: powershell.exe -ExecutionPolicy Bypass -File get-appengine-logs.ps1

Write-Host "=== Fetching App Engine Logs for Discount & Cart Issues ===" -ForegroundColor Cyan

# Fetch logs from App Engine (last 200 entries)
$logs = gcloud app logs read --service=default --limit=200 2>&1

# Filter for discount-related logs
$discountLogs = $logs | Select-String "DISCOUNT|discount|approvedDiscount|cart|ORDER_CONFIRM|ERROR|Error:"
if ($discountLogs) {
    Write-Host "--- Discount & Cart Related Logs ---" -ForegroundColor Yellow
    $discountLogs | Select-Object -First 20
} else {
    Write-Host "No discount/cart related logs found." -ForegroundColor Gray
}

Write-Host "=== End of Log Output ===" -ForegroundColor Cyan
