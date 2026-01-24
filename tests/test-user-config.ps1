$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjcxMTI4Njk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4Njc0Mjk4LCJleHAiOjE3NzEyNjYyOTh9.OyBEdXABlUSXZh8iFYJ3z3Ecxa+PcRRVf4dQj+/4IjQ="

Write-Host "Test 1: Get user config"
$headers = @{
    "Authorization" = "Bearer $token"
}
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/config' -Method GET -Headers $headers
$data = $response.Content | ConvertFrom-Json
Write-Host "Config: $($data.success)"
if ($data.success) {
    Write-Host "Enabled: $($data.data.enabled)"
    Write-Host "Emergency Email: $($data.data.emergency_email)"
}

Write-Host ""
Write-Host "Test 2: Save user config"
$config = @{
    enabled = $true
    emergency_email = "test@example.com"
    emergency_name = "Test Contact"
    min_work_hours = 4
    min_keyframes = 60
    min_json_size = 15
}
$body = $config | ConvertTo-Json
$response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/config' -Method POST -Headers $headers -Body $body -ContentType "application/json"
$data2 = $response2.Content | ConvertFrom-Json
Write-Host "Save result: $($data2.success)"

Write-Host ""
Write-Host "Test 3: Get user config again"
$response3 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/config' -Method GET -Headers $headers
$data3 = $response3.Content | ConvertFrom-Json
Write-Host "Config: $($data3.success)"
if ($data3.success) {
    Write-Host "Enabled: $($data3.data.enabled)"
    Write-Host "Emergency Email: $($data3.data.emergency_email)"
    Write-Host "Emergency Name: $($data3.data.emergency_name)"
}