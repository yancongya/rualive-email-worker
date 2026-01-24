$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjcxMTI4Njk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4NjcxMTM5LCJleHAiOjE3NzEyNjMxMzl9.NO9W3h3+QP2akFYT1KAJRaB1gYJ7Pc+QpmTOraRISSw="

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key' -Method GET -Headers $headers

Write-Host "API密钥状态:"
$response.Content