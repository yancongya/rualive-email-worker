$body = @{
    email = "admin@rualive.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/login' -Method POST -ContentType 'application/json' -Body $body

Write-Host "登录响应:"
$response.Content