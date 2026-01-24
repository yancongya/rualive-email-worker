$url = "https://rualive-email-worker.cubetan57.workers.dev/admin/login"
$response = Invoke-WebRequest -Uri $url -Method GET
Write-Host "Status: $($response.StatusCode)"
Write-Host "Content length: $($response.Content.Length)"
if ($response.Content -match "管理员登录") {
    Write-Host "Admin login page: OK"
} else {
    Write-Host "Admin login page: FAIL"
}