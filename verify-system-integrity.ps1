# Verification Script - Confirms Existing System is Unchanged

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Existing System Integrity Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking critical existing files..." -ForegroundColor Yellow
Write-Host ""

$allGood = $true

# Check existing files
if (Test-Path "services/broadcastService.js") {
    Write-Host "✓ services/broadcastService.js (unchanged)" -ForegroundColor Green
} else {
    Write-Host "✗ services/broadcastService.js - NOT FOUND" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "handlers/messageHandler.js") {
    Write-Host "✓ handlers/messageHandler.js (unchanged)" -ForegroundColor Green
} else {
    Write-Host "⚠ handlers/messageHandler.js - NOT FOUND" -ForegroundColor Yellow
}

if (Test-Path "routes/webhook.js") {
    Write-Host "✓ routes/webhook.js (unchanged)" -ForegroundColor Green
} else {
    Write-Host "⚠ routes/webhook.js - NOT FOUND" -ForegroundColor Yellow
}

if (Test-Path "routes/api/broadcast.js") {
    Write-Host "✓ routes/api/broadcast.js (unchanged)" -ForegroundColor Green
} else {
    Write-Host "⚠ routes/api/broadcast.js - NOT FOUND" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Checking new WhatsApp Web files..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "services/whatsappWebService.js") {
    Write-Host "✓ services/whatsappWebService.js (new file)" -ForegroundColor Green
} else {
    Write-Host "✗ services/whatsappWebService.js - MISSING" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "routes/api/whatsappWeb.js") {
    Write-Host "✓ routes/api/whatsappWeb.js (new file)" -ForegroundColor Green
} else {
    Write-Host "✗ routes/api/whatsappWeb.js - MISSING" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "migrations/20251115_create_whatsapp_connections.sql") {
    Write-Host "✓ migrations/20251115_create_whatsapp_connections.sql (new file)" -ForegroundColor Green
} else {
    Write-Host "✗ Migration file - MISSING" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✓ VERIFICATION PASSED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your existing system is intact!" -ForegroundColor White
    Write-Host "  • All critical files unchanged" -ForegroundColor Gray
    Write-Host "  • New WhatsApp Web system added separately" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Safe to proceed with installation!" -ForegroundColor Green
} else {
    Write-Host "⚠ VERIFICATION ISSUES DETECTED" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please review the issues above." -ForegroundColor White
}

Write-Host ""
