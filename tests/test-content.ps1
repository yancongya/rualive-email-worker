$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjczOTU0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4NjczOTU0LCJleHAiOjE3NzEyNjU5NTR9.CYz/b7YLvLNhm/ZKv+xzsLnWc53/5z0XIerUV4DjVAc="

$headers = @{
    "Cookie" = "token=$token"
}

$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET -Headers $headers
$response.Content.Substring(0, 500)