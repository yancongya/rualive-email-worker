$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "admin@rualive.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/login' -Method POST -Headers $headers -Body $body
$data = $response.Content | ConvertFrom-Json

if ($data.success) {
    $token = $data.token
    
    Write-Host "Test API Key Management:"
    Write-Host "================================"
    
    Write-Host ""
    Write-Host "1. Get current API key status:"
    $headers2 = @{
        "Authorization" = "Bearer $token"
    }
    $response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key' -Method GET -Headers $headers2
    $response2.Content
    
    Write-Host ""
    Write-Host "2. Update API key:"
    $body2 = @{
        apiKey = "re_test123456789"
    } | ConvertTo-Json
    
    $response3 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key' -Method POST -Headers $headers2 -Body $body2
    $response3.Content
    
    Write-Host ""
    Write-Host "3. Get API key status again:"
    $response4 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key' -Method GET -Headers $headers2
    $response4.Content
    
    Write-Host ""
    Write-Host "4. Delete API key:"
    $response5 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key' -Method DELETE -Headers $headers2
    $response5.Content
    
    Write-Host ""
    Write-Host "================================"
    Write-Host "Test completed"
}