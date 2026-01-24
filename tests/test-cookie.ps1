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
    
    Write-Host "测试不同的Cookie格式:"
    
    Write-Host "1. token=value"
    $headers1 = @{
        "Cookie" = "token=$token"
    }
    $response1 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET -Headers $headers1
    if ($response1.Content -like "*管理后台*") {
        Write-Host "   成功: 返回管理后台"
    } else {
        Write-Host "   失败: 返回登录页面"
    }
    
    Write-Host "2. Authorization header"
    $headers2 = @{
        "Authorization" = "Bearer $token"
    }
    $response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET -Headers $headers2
    if ($response2.Content -like "*管理后台*") {
        Write-Host "   成功: 返回管理后台"
    } else {
        Write-Host "   失败: 返回登录页面"
    }
}