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
    
    Write-Host "Test API Key Test Function:"
    Write-Host "================================"
    
    Write-Host ""
    Write-Host "1. Test with invalid API key:"
    $headers2 = @{
        "Authorization" = "Bearer $token"
    }
    $body2 = @{
        apiKey = "re_invalid_key"
    } | ConvertTo-Json
    
    $response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key/test' -Method POST -Headers $headers2 -Body $body2
    $response2.Content
    
    Write-Host ""
    Write-Host "2. Test with empty API key:"
    $body3 = @{
        apiKey = ""
    } | ConvertTo-Json
    
    $response3 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key/test' -Method POST -Headers $headers2 -Body $body3
    $response3.Content
    
    Write-Host ""
    Write-Host "================================"
    Write-Host "Test completed"
}