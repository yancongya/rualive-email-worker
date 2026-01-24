Write-Host "Test User Page Login Flow:"
Write-Host "================================"
Write-Host ""
Write-Host "1. Visit user page:"
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/user' -Method GET
if ($response.Content -like "*用户面板*") {
    Write-Host "OK: User page loaded"
} else {
    Write-Host "FAIL: User page not loaded"
}

Write-Host ""
Write-Host "2. Visit admin page:"
$response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET
if ($response2.Content -like "*管理后台*") {
    Write-Host "OK: Admin page loaded"
} else {
    Write-Host "FAIL: Admin page not loaded"
}

Write-Host ""
Write-Host "3. Visit root page:"
$response3 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/' -Method GET
if ($response3.Content -like "*登录*") {
    Write-Host "OK: Login page loaded"
} else {
    Write-Host "FAIL: Login page not loaded"
}

Write-Host ""
Write-Host "================================"
Write-Host "Test completed"
Write-Host ""
Write-Host "Now you can test in browser:"
Write-Host "- User page: https://rualive-email-worker.cubetan57.workers.dev/user"
Write-Host "- Admin page: https://rualive-email-worker.cubetan57.workers.dev/admin"
Write-Host "- Login page: https://rualive-email-worker.cubetan57.workers.dev/"