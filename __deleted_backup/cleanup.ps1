# SAK WhatsApp AI Sales Assistant - Cleanup Script
# Removes test files, documentation files, and redundant files

Write-Host "Starting cleanup..." -ForegroundColor Cyan

$filesToDelete = @(
    # All markdown documentation files (keep only README.md)
    "*.md"
    
    # Test scripts
    "test_*.js"
    "test_*.ps1"
    "*test*.js"
    
    # Check scripts
    "check_*.js"
    
    # Delete scripts
    "delete_*.js"
    
    # Diagnostic scripts
    "diagnose_*.js"
    "nuke_*.js"
    "create_sample_*.js"
    
    # Other utility scripts
    "embed-products.js"
    "autoAddPatch.js"
    "handleBestPriceRequest_updated.js"
    
    # Redundant deployment scripts
    "deploy1.ps1"
    "test-deploy.ps1"
    "auto-deploy-watcher.ps1"
    
    # Utility scripts
    "quick-check.ps1"
    "check-logs.ps1"
    "get-appengine-logs.ps1"
    
    # Log files
    "*.log"
    "app_logs.txt"
    
    # Redundant HTML files
    "public/dashboard - Copy.html"
    "public/dashboard-enhanced.html"
    "public/dashboard-v2.html"
    "public/dashboard.fixed.html"
    "public/ai-dashboard.html"
    "public/zoho-dashboard - Copy.html"
    "public/zoho-dashboard.html"
    "public/.DS_Store"
    
    # Admin files (if not needed in production)
    "admin.js"
    
    # Build/deploy files
    "cloudbuild.yaml"
    "cloudrun.yaml"
)

$totalDeleted = 0
$errors = @()

foreach ($pattern in $filesToDelete) {
    try {
        $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
        
        foreach ($file in $files) {
            # Skip README.md
            if ($file.Name -eq "README.md") {
                continue
            }
            
            try {
                Remove-Item $file.FullName -Force
                Write-Host "  Deleted: $($file.Name)" -ForegroundColor Green
                $totalDeleted++
            } catch {
                $errors += "Failed to delete $($file.Name): $_"
                Write-Host "  Error deleting: $($file.Name)" -ForegroundColor Red
            }
        }
    } catch {
        # Pattern didn't match anything, skip silently
    }
}

# Clean up scripts folder
if (Test-Path "scripts") {
    Write-Host "`nCleaning scripts folder..." -ForegroundColor Cyan
    $scriptFiles = Get-ChildItem -Path "scripts" -Filter "*.js" -File
    foreach ($file in $scriptFiles) {
        if ($file.Name -match "check_|delete_|test_") {
            try {
                Remove-Item $file.FullName -Force
                Write-Host "  Deleted: scripts/$($file.Name)" -ForegroundColor Green
                $totalDeleted++
            } catch {
                $errors += "Failed to delete scripts/$($file.Name): $_"
            }
        }
    }
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "Total files deleted: $totalDeleted" -ForegroundColor Yellow

if ($errors.Count -gt 0) {
    Write-Host "`nErrors encountered:" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
}

Write-Host "`nRecommended next steps:" -ForegroundColor Cyan
Write-Host "  1. Review remaining files with: Get-ChildItem -Recurse" -ForegroundColor White
Write-Host "  2. Test the application" -ForegroundColor White
Write-Host "  3. Deploy: .\deploy.ps1" -ForegroundColor White
Write-Host "================================================`n" -ForegroundColor Cyan
