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
    
    Write-Host "Token: $token"
    Write-Host ""
    
    Write-Host "测试token解析:"
    $parts = $token.Split('.')
    Write-Host "Token parts: $($parts.Length)"
    if ($parts.Length -eq 3) {
        Write-Host "Header: $($parts[0])"
        Write-Host "Payload: $($parts[1])"
        
        $payloadJson = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($parts[1]))
        Write-Host "Payload JSON: $payloadJson"
    }
    
    Write-Host ""
    Write-Host "访问 /admin:"
    $headers2 = @{
        "Authorization" = "Bearer $token"
    }
    $response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET -Headers $headers2
    Write-Host "Status: $($response2.StatusCode)"
    Write-Host "Content: $($response2.Content.Substring(0, 200))"
}