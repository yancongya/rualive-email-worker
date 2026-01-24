$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "admin@rualive.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "登录获取token:"
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/login' -Method POST -Headers $headers -Body $body
$data = $response.Content | ConvertFrom-Json

if ($data.success) {
    $token = $data.token
    Write-Host "Token获取成功"
    
    Write-Host ""
    Write-Host "测试 /api/auth/me:"
    $headers2 = @{
        "Authorization" = "Bearer $token"
    }
    
    $response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/me' -Method GET -Headers $headers2
    $response2.Content
}