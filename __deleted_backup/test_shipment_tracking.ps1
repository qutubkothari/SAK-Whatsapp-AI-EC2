# Test shipment tracking with proper WhatsApp webhook format
$webhookUrl = "https://auto-deploy-20251021-102847.uc.r.appspot.com/webhook"

# Proper WhatsApp webhook format for text message
$body = @{
    message = @{
        from = "919876543210@c.us"  # Test phone number
        to = "917358123456@c.us"    # Your business number
        type = "text"
        text = @{
            body = "1234567892"  # 10-digit LR number
        }
        timestamp = "1638360000"
    }
} | ConvertTo-Json -Depth 10

Write-Host "Sending test webhook request with LR number 1234567892..."
Write-Host "Request body:"
Write-Host $body
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Response status: $($response.StatusCode)"
    Write-Host "Response content:"
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}