# Auto Deploy Watcher for SAK-Whatsapp-AI-Sales-Assistant
# Monitors for file changes and runs deploy.ps1 automatically

$folder = "$PSScriptRoot"
$filter = "*.*"

Write-Host "[Auto-Deploy] Watching for changes in $folder..." -ForegroundColor Cyan

$fsw = New-Object IO.FileSystemWatcher $folder, $filter -Property @{ 
    IncludeSubdirectories = $true
    EnableRaisingEvents = $true
}

Register-ObjectEvent $fsw Changed -Action {
    Write-Host "[Auto-Deploy] Change detected: $($Event.SourceEventArgs.FullPath)" -ForegroundColor Yellow
    Write-Host "[Auto-Deploy] Running deploy.ps1..." -ForegroundColor Green
    powershell.exe -ExecutionPolicy Bypass -File "$PSScriptRoot\deploy.ps1"
}

Register-ObjectEvent $fsw Created -Action {
    Write-Host "[Auto-Deploy] New file detected: $($Event.SourceEventArgs.FullPath)" -ForegroundColor Yellow
    Write-Host "[Auto-Deploy] Running deploy.ps1..." -ForegroundColor Green
    powershell.exe -ExecutionPolicy Bypass -File "$PSScriptRoot\deploy.ps1"
}

Register-ObjectEvent $fsw Deleted -Action {
    Write-Host "[Auto-Deploy] File deleted: $($Event.SourceEventArgs.FullPath)" -ForegroundColor Yellow
    Write-Host "[Auto-Deploy] Running deploy.ps1..." -ForegroundColor Green
    powershell.exe -ExecutionPolicy Bypass -File "$PSScriptRoot\deploy.ps1"
}

Register-ObjectEvent $fsw Renamed -Action {
    Write-Host "[Auto-Deploy] File renamed: $($Event.SourceEventArgs.FullPath)" -ForegroundColor Yellow
    Write-Host "[Auto-Deploy] Running deploy.ps1..." -ForegroundColor Green
    powershell.exe -ExecutionPolicy Bypass -File "$PSScriptRoot\deploy.ps1"
}

Write-Host "[Auto-Deploy] Watching for changes. Press Ctrl+C to stop." -ForegroundColor Cyan
while ($true) { Start-Sleep -Seconds 2 }
