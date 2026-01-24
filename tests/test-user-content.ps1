$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/user' -Method GET
$response.Content.Substring(0, 500)