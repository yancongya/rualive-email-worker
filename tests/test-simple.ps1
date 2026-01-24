$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "admin@rualive.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/login' -Method POST -Headers $headers -Body $body
$response.Content