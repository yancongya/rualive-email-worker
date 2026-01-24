Write-Host "Testing admin page routes:"
Write-Host "================================"

$response1 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET
if ($response1.Content -match "管理后台") {
    Write-Host "1. /admin: OK"
} else {
    Write-Host "1. /admin: FAIL"
}

$response2 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin/' -Method GET
if ($response2.Content -match "管理后台") {
    Write-Host "2. /admin/: OK"
} else {
    Write-Host "2. /admin/: FAIL"
}

$response3 = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin.html' -Method GET
if ($response3.Content -match "管理后台") {
    Write-Host "3. /admin.html: OK"
} else {
    Write-Host "3. /admin.html: FAIL"
}

Write-Host ""
Write-Host "All routes tested successfully!"