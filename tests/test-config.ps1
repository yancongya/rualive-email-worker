$body = Get-Content test-config.json -Raw
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/config' -Method POST -ContentType 'application/json' -Body $body
$response.Content