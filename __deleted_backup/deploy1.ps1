# Simple Deploy Script - No loops, just deploy
# Usage: .\deploy1.ps1

Write-Host "🚀 Starting simple deployment..." -ForegroundColor Green

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$version = "v$timestamp"

Write-Host "Version: $version" -ForegroundColor Yellow

# Just deploy, no extra commands
gcloud app deploy --version=$version --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
}