$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjcxMTI4Njk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4Njc0Mjk4LCJleHAiOjE3NzEyNjYyOTh9.OyBEdXABlUSXZh8iFYJ3z3Ecxa+PcRRVf4dQj+/4IjQ="

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    config = @{
        enabled = $true
        emergency_email = "test@example.com"
        emergency_name = "Test Contact"
        min_work_hours = 4
        min_keyframes = 60
        min_json_size = 15
    }
} | ConvertTo-Json -Depth 3

Write-Host "Sending config..."
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/config' -Method POST -Headers $headers -Body $body
Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"