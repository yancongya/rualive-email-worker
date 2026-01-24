Write-Host "Test 1: Visit /admin without token"
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET
Write-Host "Status: $($response.StatusCode)"
if ($response.Content -like "*login*") {
    Write-Host "OK: Returns login page"
} else {
    Write-Host "FAIL: Returns admin page"
}

Write-Host ""
Write-Host "Test 2: Visit /admin with token"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjczNjY2Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4NjczNjY2LCJleHAiOjE3NzEyNjU2NjZ9.YcL6IX063HYu6Cdtn4Iqc3vU23paRoGwTyMbJ8M2MZw="
$headers = @{
    "Cookie" = "token=$token"
}
$response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/admin' -Method GET -Headers $headers
Write-Host "Status: $($response.StatusCode)"
if ($response.Content -like "*admin*") {
    Write-Host "OK: Returns admin page"
} else {
    Write-Host "FAIL: Returns other page"
}

Write-Host ""
Write-Host "Done"
Write-Host ""
Write-Host "Please visit in browser: https://rualive-email-worker.cubetan57.workers.dev/admin"