# Quick Deploy Script for Google App Engine
# Usage: .\deploy.ps1

Write-Host "Checking current project..." -ForegroundColor Cyan
$CURRENT_PROJECT = gcloud config get-value project 2>$null

if ($CURRENT_PROJECT -ne "sak-whatsapp-ai-sales-assist") {
    Write-Host "Switching to WhatsApp AI project..." -ForegroundColor Yellow
    gcloud config set project sak-whatsapp-ai-sales-assist
}

# Verify we're in the correct project
$CURRENT_PROJECT = gcloud config get-value project 2>$null
if ($CURRENT_PROJECT -ne "sak-whatsapp-ai-sales-assist") {
    Write-Host "ERROR: Not in correct project! Current: $CURRENT_PROJECT" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying WhatsApp AI app to project: $CURRENT_PROJECT" -ForegroundColor Green

# Generate version name with timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$version = "auto-deploy-$timestamp"

Write-Host "Version: $version" -ForegroundColor Yellow
Write-Host "Deploying... (this may take a few minutes)" -ForegroundColor Yellow

# Deploy with explicit project
gcloud app deploy app.yaml --version=$version --project=sak-whatsapp-ai-sales-assist --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "URL: https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com" -ForegroundColor Cyan

    Write-Host "Checking deployment status..." -ForegroundColor Yellow
    gcloud app versions list --filter="version.id=$version" --format="table(version.id,status,traffic_split)" --project=sak-whatsapp-ai-sales-assist

    Write-Host "" -ForegroundColor White
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "To check recent logs, run:" -ForegroundColor Cyan
    Write-Host "gcloud app logs read --limit=20 --project=sak-whatsapp-ai-sales-assist" -ForegroundColor White
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

