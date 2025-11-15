# EC2 Deployment Script
param([string]$Message = "Update from Windows")

Write-Host "====================" -ForegroundColor Cyan
Write-Host " EC2 Deployment" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

# Commit and push
Write-Host "`n[1/2] Pushing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "$Message"
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFailed to push!" -ForegroundColor Red
    exit 1
}

# Deploy to EC2
Write-Host "`n[2/2] Deploying to EC2..." -ForegroundColor Yellow
$EC2_IP = "13.62.57.240"
$EC2_KEY = "$HOME\Downloads\whatsapp-ai-key.pem"
$CMD = "cd /home/ubuntu/whatsapp-ai && git pull && sudo systemctl restart whatsapp-ai && sudo systemctl status whatsapp-ai --no-pager"

ssh -i $EC2_KEY ubuntu@$EC2_IP $CMD

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Dashboard: http://$EC2_IP`:8080/dashboard" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ FAILED!" -ForegroundColor Red
}
