# 测试发送邮件给操作员
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3Njg2NzIxMjAxNTdfYngxajd0aHFxIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njk1OTczMzEsImV4cCI6MTc3MjE4OTMzMX0=.ymOFtBOpYHcBEymLvvPB/1jJWtUlXCH4V9viy1tJq/g="

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 测试发送邮件给操作员（user）
$body = @{recipient = "user"} | ConvertTo-Json

Write-Host "=== 测试发送邮件给操作员 ==="
Write-Host "请求URL: https://rualive-email-worker.cubetan57.workers.dev/api/send-now"
Write-Host "请求方法: POST"
Write-Host "请求头: Authorization=Bearer $token"
Write-Host "请求体: $body"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri 'https://rualive-email-worker.cubetan57.workers.dev/api/send-now' -Method POST -Headers $headers -Body $body

    Write-Host "响应状态码: $($response.StatusCode)"
    Write-Host "响应头:"
    $response.Headers.Keys | ForEach-Object { Write-Host "  ${_}: $($response.Headers[$_])" }
    Write-Host ""
    Write-Host "响应内容:"
    $response.Content
} catch {
    Write-Host "错误发生:"
    Write-Host "异常类型: $($_.Exception.GetType().FullName)"
    Write-Host "异常消息: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host ""
        Write-Host "响应状态码: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "响应内容:"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody
    }
}