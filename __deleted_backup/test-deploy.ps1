y# Simple deployment test - just deploy without any extra commands
Write-Host "Testing deployment..." -ForegroundColor Yellow

# Quick deploy test
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$version = "test-$timestamp"

Write-Host "Test version: $version" -ForegroundColor Cyan

# This should deploy quietly without confirmation
gcloud app deploy --version=$version --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "Test deployment successful!" -ForegroundColor Green
    Write-Host "Cleaning up test version..." -ForegroundColor Yellow

    # Clean up the test version (don't keep it)
    gcloud app versions delete $version --quiet

    Write-Host "Test complete. The deployment script works correctly." -ForegroundColor Green
} else {
    Write-Host "Test deployment failed!" -ForegroundColor Red
}