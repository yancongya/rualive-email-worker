$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl8xNzY4NjcxMTI4Njk5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY4NjcxMTM5LCJleHAiOjE3NzEyNjMxMzl9.NO9W3h3+QP2akFYT1KAJRaB1gYJ7Pc+QpmTOraRISSw="

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "测试 /api/auth/me 接口（带详细输出）:"
try {
    $response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/auth/me' -Method GET -Headers $headers -Verbose
    Write-Host "状态码: $($response.StatusCode)"
    Write-Host "响应内容:"
    $response.Content
} catch {
    Write-Host "错误: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.value__)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "响应内容: $responseBody"
    }
}