$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjcxMTI4Njk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4Njc0Mjk4LCJleHAiOjE3NzEyNjYyOTh9.OyBEdXABlUSXZh8iFYJ3z3Ecxa+PcRRVf4dQj+/4IjQ="

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/config' -Method GET -Headers $headers
$data = $response.Content | ConvertFrom-Json

Write-Host "Config loaded: $($data.success)"
if ($data.success) {
    Write-Host "Enabled: $($data.data.enabled)"
    Write-Host "Emergency Email: $($data.data.emergency_email)"
    Write-Host "Emergency Name: $($data.data.emergency_name)"
    Write-Host "Min Hours: $($data.data.min_work_hours)"
    Write-Host "Min Keyframes: $($data.data.min_keyframes)"
    Write-Host "Min JSON Size: $($data.data.min_json_size)"
}