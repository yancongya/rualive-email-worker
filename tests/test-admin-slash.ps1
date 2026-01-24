$url = "https://rualive-email-worker.cubetan57.workers.dev/admin/"
$response = Invoke-WebRequest -Uri $url -Method GET
Write-Host "Status: $($response.StatusCode)"
Write-Host "Content length: $($response.Content.Length)"