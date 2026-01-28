# 测试各种错误场景
$baseUrl = "https://rualive-email-worker.cubetan57.workers.dev/api/send-now"

# 场景1: 无效的token
Write-Host "=== 场景1: 无效的token ==="
$headers1 = @{
    "Authorization" = "Bearer invalid_token"
    "Content-Type" = "application/json"
}
$body1 = @{recipient = "user"} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers1 -Body $body1
    Write-Host "响应: $($response1.Content)"
} catch {
    Write-Host "错误: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.value__)"
    }
}

Write-Host ""

# 场景2: 不发送请求体
Write-Host "=== 场景2: 不发送请求体 ==="
$headers2 = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3Njg2NzIxMjAxNTdfYngxajd0aHFxIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njk1OTczMzEsImV4cCI6MTc3MjE4OTMzMX0=.ymOFtBOpYHcBEymLvvPB/1jJWtUlXCH4V9viy1tJq/g="
    "Content-Type" = "application/json"
}

try {
    $response2 = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers2
    Write-Host "响应: $($response2.Content)"
} catch {
    Write-Host "错误: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.value__)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        Write-Host "响应内容: $($reader.ReadToEnd())"
    }
}

Write-Host ""

# 场景3: 测试次数超限（模拟）
Write-Host "=== 场景3: 测试emergency recipient（可能缺少配置）==="
$headers3 = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3Njg2NzIxMjAxNTdfYngxajd0aHFxIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njk1OTczMzEsImV4cCI6MTc3MjE4OTMzMX0=.ymOFtBOpYHcBEymLvvPB/1jJWtUlXCH4V9viy1tJq/g="
    "Content-Type" = "application/json"
}
$body3 = @{recipient = "emergency"} | ConvertTo-Json

try {
    $response3 = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers3 -Body $body3
    Write-Host "响应: $($response3.Content)"
} catch {
    Write-Host "错误: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.value__)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        Write-Host "响应内容: $($reader.ReadToEnd())"
    }
}

Write-Host ""

# 场景4: 检查用户配置
Write-Host "=== 场景4: 检查用户配置 ==="
$headers4 = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3Njg2NzIxMjAxNTdfYngxajd0aHFxIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njk1OTczMzEsImV4cCI6MTc3MjE4OTMzMX0=.ymOFtBOpYHcBEymLvvPB/1jJWtUlXCH4V9viy1tJq/g="
}

try {
    $response4 = Invoke-WebRequest -Uri "https://rualive-email-worker.cubetan57.workers.dev/api/config" -Method GET -Headers $headers4
    Write-Host "用户配置: $($response4.Content)"
} catch {
    Write-Host "错误: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "状态码: $($_.Exception.Response.StatusCode.value__)"
    }
}