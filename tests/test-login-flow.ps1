Write-Host "测试完整登录流程"
Write-Host "================================"
Write-Host ""

Write-Host "Step 1: 管理员登录"
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
    Write-Host "登录成功"
    $token = $data.token
    Write-Host "Token: $($token.Substring(0, 50))..."
    
    Write-Host ""
    Write-Host "Step 2: 使用token访问 /admin"
    $headers2 = @{
        "Cookie" = "token=$token"
    }
    
    $response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET -Headers $headers2
    if ($response2.Content -like "*管理后台*") {
        Write-Host "成功访问管理后台"
    } else {
        Write-Host "访问失败"
    }
    
    Write-Host ""
    Write-Host "Step 3: 测试 /api/auth/me"
    $headers3 = @{
        "Authorization" = "Bearer $token"
    }
    
    $response3 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/me' -Method GET -Headers $headers3
    $data3 = $response3.Content | ConvertFrom-Json
    
    if ($data3.success -and $data3.user.role -eq 'admin') {
        Write-Host "用户验证成功: $($data3.user.username)"
    } else {
        Write-Host "用户验证失败"
    }
} else {
    Write-Host "登录失败: $($data.error)"
}

Write-Host ""
Write-Host "================================"
Write-Host "测试完成"
Write-Host ""
Write-Host "请在浏览器中测试完整流程:"
Write-Host "1. 访问 https://rualive-email-worker.cubetan57.workers.dev/admin"
Write-Host "2. 应该会显示登录页面"
Write-Host "3. 输入 admin@rualive.com / admin123"
Write-Host "4. 登录成功后应该能正常进入管理后台，不会再刷新"