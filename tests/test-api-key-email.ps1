$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjcxMTI4Njk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4Njc0Mjk4LCJleHAiOjE3NzEyNjYyOTh9.OyBEdXABlUSXZh8iFYJ3z3Ecxa+PcRRVf4dQj+/4IjQ="

Write-Host "Test API key with test email:"
Write-Host "================================"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    apiKey = "test_key_12345"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key/test' -Method POST -Headers $headers -Body $body
$data = $response.Content | ConvertFrom-Json

Write-Host "Response: $($data.success)"
if ($data.success) {
    Write-Host "Message: $($data.message)"
} else {
    Write-Host "Error: $($data.error)"
}