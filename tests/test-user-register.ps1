$body = @{
    email = "test@example.com"
    username = "测试用户"
    password = "test123456"
    inviteCode = "9Q7J-GY0N"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/register' -Method POST -ContentType 'application/json' -Body $body

Write-Host "注册响应:"
$response.Content