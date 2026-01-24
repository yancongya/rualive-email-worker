$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjcxMTI4Njk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4Njc0Mjk4LCJleHAiOjE3NzEyNjYyOTh9.OyBEdXABlUSXZh8iFYJz3Ecxa+PcRRVf4dQj+/4IjQ="
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body1 = @{
    apiKey = "test_key_12345"
} | ConvertTo-Json
$response1 = Invoke-WebRequest -Uri "https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key/test" -Method POST -Headers $headers -Body $body1
Write-Host "Test 1 Status:" $response1.StatusCode
$body2 = @{
    apiKey = "test_key_12345"
    testEmail = "custom@example.com"
} | ConvertTo-Json
$response2 = Invoke-WebRequest -Uri "https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key/test" -Method POST -Headers $headers -Body $body2
Write-Host "Test 2 Status:" $response2.StatusCode