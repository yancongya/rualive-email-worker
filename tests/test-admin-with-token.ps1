$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjczOTU0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4NjczOTU0LCJleHAiOjE3NzEyNjU5NTR9.CYz/b7YLvLNhm/ZKv+xzsLnWc53/5z0XIerUV4DjVAc="

$headers = @{
    "Cookie" = "token=$token"
}

Write-Host "访问 /admin (带token):"
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET -Headers $headers
Write-Host "状态码: $($response.StatusCode)"

if ($response.Content -like "*管理后台*") {
    Write-Host "成功: 返回管理后台"
} elseif ($response.Content -like "*登录*") {
    Write-Host "失败: 返回登录页面"
} else {
    Write-Host "未知: 返回其他内容"
}