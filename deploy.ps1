# RuAlive Email Worker 自动化部署脚本
# 功能：清理、构建、复制、部署 一键完成

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RuAlive Email Worker 自动化部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "[1/5] 清理旧的 dist 目录..." -ForegroundColor Yellow
try {
    if (Test-Path "dist") {
        Remove-Item "dist" -Recurse -Force
        Write-Host "  ✓ 清理完成" -ForegroundColor Green
    } else {
        Write-Host "  ✓ dist 目录不存在，跳过清理" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ 清理失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/5] 构建前端项目..." -ForegroundColor Yellow
try {
    Set-Location "public"
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ 构建失败" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ 构建成功" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 构建异常: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/5] 复制构建文件到 dist 目录..." -ForegroundColor Yellow
try {
    Set-Location ".."
    Remove-Item "dist" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item "public\dist" -Destination "dist" -Recurse -Force
    Write-Host "  ✓ 复制完成" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 复制失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/5] 部署到 Cloudflare Workers..." -ForegroundColor Yellow
try {
    $deployResult = npm run deploy 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ 部署失败" -ForegroundColor Red
        Write-Host $deployResult -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ 部署成功" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 部署异常: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[5/5] 清理 public/dist 目录..." -ForegroundColor Yellow
try {
    if (Test-Path "public\dist") {
        Remove-Item "public\dist" -Recurse -Force
        Write-Host "  ✓ 清理完成" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠ 清理失败（可忽略）: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ 部署流程全部完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址: https://rualive-email-worker.cubetan57.workers.dev" -ForegroundColor Cyan
Write-Host ""