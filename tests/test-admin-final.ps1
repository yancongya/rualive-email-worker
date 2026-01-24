Write-Host "测试管理员页面是否正常加载..."
Write-Host "请在浏览器中打开: https://rualive-email-worker.cubetan57.workers.dev/admin"
Write-Host ""
Write-Host "如果页面仍然刷新，请检查浏览器控制台的错误信息"
Write-Host ""

# 测试API接口
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjcxMTI4Njk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4NjcxMTM5LCJleHAiOjE3NzEyNjMxMzl9.NO9W3h3+QP2akFYT1KAJRaB1gYJ7Pc+QpmTOraRISSw="

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "测试所有管理员API接口:"
Write-Host "================================"

Write-Host "`n1. /api/auth/me"
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/me' -Method GET -Headers $headers
$response.Content

Write-Host "`n2. /api/admin/users"
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/users' -Method GET -Headers $headers
$response.Content

Write-Host "`n3. /api/admin/invite-codes"
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/invite-codes' -Method GET -Headers $headers
$response.Content

Write-Host "`n4. /api/admin/api-key"
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/admin/api-key' -Method GET -Headers $headers
$response.Content

Write-Host ""
Write-Host "================================"
Write-Host "所有API接口测试完成"