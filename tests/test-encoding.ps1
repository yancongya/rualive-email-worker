$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/user' -Method GET
$encoding = [System.Text.Encoding]::UTF8
$content = $encoding.GetString($response.Content)
if ($content -match "用户面板") {
    Write-Host "User page: OK"
} else {
    Write-Host "User page: FAIL"
    Write-Host "Content length: $($content.Length)"
}