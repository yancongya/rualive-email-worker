$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3Njg2NzIxMjAxNTdfYngxajd0aHFxIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njg2NzIyNTgsImV4cCI6MTc3MTI2NDI1OH0=.kyH2X2UKA0McK56LUs21Pa945Ax0ZQQco0iDohsqCgQ="

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/send-now' -Method POST -Headers $headers

Write-Host "发送邮件响应:"
$response.Content