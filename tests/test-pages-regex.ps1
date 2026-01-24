$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/user' -Method GET
if ($response.Content -match "用户面板") {
    Write-Host "User page: OK"
} else {
    Write-Host "User page: FAIL"
}

$response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET
if ($response2.Content -match "管理后台") {
    Write-Host "Admin page: OK"
} else {
    Write-Host "Admin page: FAIL"
}

$response3 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/' -Method GET
if ($response3.Content -match "登录") {
    Write-Host "Login page: OK"
} else {
    Write-Host "Login page: FAIL"
}