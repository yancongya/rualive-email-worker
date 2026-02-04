# RuAlive Email Worker 自动化部署脚本
# 功能：清理、构建、复制、部署 一键完成
# 优化：智能检查文件变化，避免不必要的重复构建

param(
    [switch]$Force,  # 强制重新构建，跳过检查
    [switch]$NoDeploy  # 只构建不部署
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RuAlive Email Worker 自动化部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# 定义源文件和构建输出文件
$sourceFiles = @(
    "public\user-v6.tsx",
    "public\auth.tsx",
    "public\index.tsx",
    "public\admin.tsx",
    "public\vite.config.ts",
    "public\package.json"
)

$buildOutputFile = "public\dist\assets\userV6-*.js"

# 检查是否有文件需要重新构建
function NeedsRebuild {
    if ($Force) {
        Write-Host "  强制重新构建模式" -ForegroundColor Yellow
        return $true
    }

    # 检查构建输出是否存在
    $buildFiles = Get-ChildItem -Path "public\dist\assets" -Filter "userV6-*.js" -ErrorAction SilentlyContinue
    if (-not $buildFiles) {
        Write-Host "  构建输出不存在，需要构建" -ForegroundColor Yellow
        return $true
    }

    # 获取最新的构建文件时间
    $latestBuild = ($buildFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime

    # 检查源文件是否有更新
    foreach ($sourceFile in $sourceFiles) {
        if (Test-Path $sourceFile) {
            $sourceTime = (Get-Item $sourceFile).LastWriteTime
            if ($sourceTime -gt $latestBuild) {
                Write-Host "  检测到文件更新: $sourceFile" -ForegroundColor Yellow
                return $true
            }
        }
    }

    Write-Host "  ✓ 源文件未更新，跳过构建" -ForegroundColor Green
    return $false
}

# 检查是否需要重新构建
$shouldBuild = NeedsRebuild

# 清理 dist 目录
Write-Host "[1/4] 清理旧的 dist 目录..." -ForegroundColor Yellow
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

# 构建前端项目（如果需要）
if ($shouldBuild) {
    Write-Host "[2/4] 构建前端项目..." -ForegroundColor Yellow
    try {
        Set-Location "public"
        $buildResult = npm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ✗ 构建失败" -ForegroundColor Red
            Write-Host $buildResult -ForegroundColor Red
            exit 1
        }
        Write-Host "  ✓ 构建成功" -ForegroundColor Green
        Set-Location ".."
    } catch {
        Write-Host "  ✗ 构建异常: $_" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
} else {
    Write-Host "[2/4] 跳过构建（使用现有构建文件）" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[3/4] 复制构建文件到 dist 目录..." -ForegroundColor Yellow
try {
    Remove-Item "dist" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item "public\dist" -Destination "dist" -Recurse -Force
    Write-Host "  ✓ 复制完成" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 复制失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 部署到 Cloudflare Workers（如果需要）
if (-not $NoDeploy) {
    Write-Host "[4/4] 部署到 Cloudflare Workers..." -ForegroundColor Yellow
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
} else {
    Write-Host "[4/4] 跳过部署（-NoDeploy 参数）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/4] 清理 public/dist 目录..." -ForegroundColor Yellow
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

Write-Host "使用提示:" -ForegroundColor Cyan
Write-Host "  .\deploy.ps1              # 正常部署（智能检查）" -ForegroundColor White
Write-Host "  .\deploy.ps1 -Force       # 强制重新构建" -ForegroundColor White
Write-Host "  .\deploy.ps1 -NoDeploy    # 只构建不部署" -ForegroundColor White
Write-Host ""