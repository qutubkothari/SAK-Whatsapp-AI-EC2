# Quick Log Viewer

Write-Host "`n=== Deployment Status ===" -ForegroundColor Cyan

Write-Host "`nChecking current version..."
gcloud app versions list --service=default --format="table(version.id,traffic_split)" --limit=3

Write-Host "`n=== Reading Recent Logs ===" -ForegroundColor Cyan
Write-Host "Please wait..."

$logs = gcloud app logs read --limit=100 2>&1 | Out-String

Write-Host "`n=== Checking for Fix Patterns ===" -ForegroundColor Cyan

if ($logs -match "ADDITIONAL_PRODUCT") {
    Write-Host "✓ ADDITIONAL_PRODUCT logs found!" -ForegroundColor Green
    $logs -split "`n" | Select-String "ADDITIONAL_PRODUCT" | Select-Object -First 5
} else {
    Write-Host "⚠️  No ADDITIONAL_PRODUCT logs (feature not triggered yet)" -ForegroundColor Yellow
}

if ($logs -match "ORDER_CONFIRM.*Rejected") {
    Write-Host "`n✓ ORDER_CONFIRM rejection logs found!" -ForegroundColor Green
    $logs -split "`n" | Select-String "ORDER_CONFIRM.*Rejected" | Select-Object -First 5
} else {
    Write-Host "`n⚠️  No ORDER_CONFIRM rejections yet" -ForegroundColor Yellow
}

Write-Host "`n=== Test Instructions ===" -ForegroundColor Cyan
Write-Host "Send these WhatsApp messages:" -ForegroundColor Yellow
Write-Host "1. give me price 8x80 10 ctns"
Write-Host "2. add 8x100 5ctns"
Write-Host "`nThen run this script again" -ForegroundColor Yellow
Write-Host ""
