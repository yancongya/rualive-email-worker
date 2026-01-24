$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "admin@rualive.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "管理员登录获取新token:"
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/login' -Method POST -Headers $headers -Body $body
$response.Content

Write-Host "`n================================"
Write-Host "请复制上面的token，然后在浏览器控制台运行:"
Write-Host "localStorage.setItem('token', '你的token')"