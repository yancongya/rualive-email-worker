$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjcxMTI4Njk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4Njc0Mjk4LCJleHAiOjE3NzEyNjYyOTh9.OyBEdXABlUSXZh8iFYJz3Ecxa+PcRRVf4dQj+/4IjQ"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    apiKey = "test_key"
    testEmail = "2655283737@qq.com"
} | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri "https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key/test" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host $response.Content
} catch {
    Write-Host $($_.Exception.Message)
}