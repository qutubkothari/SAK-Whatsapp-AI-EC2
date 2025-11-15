# WhatsApp Web Standalone Setup Script
# This script installs dependencies for the WhatsApp Web system
# WITHOUT affecting the existing Maytapi-based system

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WhatsApp Web Standalone Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install npm packages
Write-Host "[1/3] Installing npm packages..." -ForegroundColor Yellow
Write-Host "  - whatsapp-web.js (WhatsApp Web client)" -ForegroundColor Gray
Write-Host "  - qrcode (QR code generation)" -ForegroundColor Gray
Write-Host "  - puppeteer (Chromium automation)" -ForegroundColor Gray
Write-Host ""

npm install whatsapp-web.js qrcode puppeteer

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check database migration
Write-Host "[2/3] Database Migration Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please run this SQL in your Supabase database:" -ForegroundColor Cyan
Write-Host "  migrations/20251115_create_whatsapp_connections.sql" -ForegroundColor White
Write-Host ""
Write-Host "This creates the 'whatsapp_connections' table (separate from existing tables)" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "Have you run the database migration? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host ""
    Write-Host "⚠ Please run the migration before continuing" -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

Write-Host "✓ Database migration confirmed" -ForegroundColor Green
Write-Host ""

# Step 3: Verify files
Write-Host "[3/3] Verifying installation..." -ForegroundColor Yellow
Write-Host ""

$requiredFiles = @(
    "services/whatsappWebService.js",
    "routes/api/whatsappWeb.js",
    "migrations/20251115_create_whatsapp_connections.sql"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file - MISSING" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

if ($allFilesExist) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✓ Installation Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Restart your server: npm start" -ForegroundColor White
    Write-Host "2. Test API: POST /api/whatsapp-web/connect" -ForegroundColor White
    Write-Host "3. Read full guide: WHATSAPP_WEB_STANDALONE_GUIDE.md" -ForegroundColor White
    Write-Host ""
    Write-Host "Your existing Maytapi system is UNCHANGED and safe." -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "⚠ Some files are missing. Please check the installation." -ForegroundColor Red
    Write-Host ""
}
