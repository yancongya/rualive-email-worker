# RuAlive Email Worker Deployment Script
# Features: Clean, Build, Copy, Deploy - All in one
# Optimization: Smart file change detection to avoid unnecessary rebuilds

param(
    [switch]$Force,  # Force rebuild, skip checks
    [switch]$NoDeploy  # Build only, do not deploy
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RuAlive Email Worker Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Define source files and build output files
$sourceFiles = @(
    "public\user-v6.tsx",
    "public\auth.tsx",
    "public\index.tsx",
    "public\admin.tsx",
    "public\vite.config.ts",
    "public\package.json"
)

$buildOutputFile = "public\dist\assets\userV6-*.js"

# Check if rebuild is needed
function NeedsRebuild {
    if ($Force) {
        Write-Host "  Force rebuild mode" -ForegroundColor Yellow
        return $true
    }

    # Check if build output exists
    $buildFiles = Get-ChildItem -Path "public\dist\assets" -Filter "userV6-*.js" -ErrorAction SilentlyContinue
    if (-not $buildFiles) {
        Write-Host "  Build output does not exist, need to build" -ForegroundColor Yellow
        return $true
    }

    # Get latest build file time
    $latestBuild = ($buildFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime

    # Check if source files are updated
    foreach ($sourceFile in $sourceFiles) {
        if (Test-Path $sourceFile) {
            $sourceTime = (Get-Item $sourceFile).LastWriteTime
            if ($sourceTime -gt $latestBuild) {
                Write-Host "  File updated detected: $sourceFile" -ForegroundColor Yellow
                return $true
            }
        }
    }

    Write-Host "  Source files not updated, skip build" -ForegroundColor Green
    return $false
}

# Check if rebuild is needed
$shouldBuild = NeedsRebuild

# Clean dist directory
Write-Host "[1/4] Cleaning old dist directory..." -ForegroundColor Yellow
try {
    if (Test-Path "dist") {
        Remove-Item "dist" -Recurse -Force
        Write-Host "  Clean completed" -ForegroundColor Green
    } else {
        Write-Host "  dist directory does not exist, skip clean" -ForegroundColor Green
    }
} catch {
    Write-Host "  Clean failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Build frontend project (if needed)
if ($shouldBuild) {
    Write-Host "[2/4] Building frontend project..." -ForegroundColor Yellow
    try {
        Set-Location "public"
        $buildResult = npm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Build failed" -ForegroundColor Red
            Write-Host $buildResult -ForegroundColor Red
            exit 1
        }
        Write-Host "  Build success" -ForegroundColor Green
        Set-Location ".."
    } catch {
        Write-Host "  Build exception: $_" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
} else {
    Write-Host "[2/4] Skip build (using existing build files)" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[3/4] Copying build files to dist directory..." -ForegroundColor Yellow
try {
    Remove-Item "dist" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item "public\dist" -Destination "dist" -Recurse -Force
    Write-Host "  Copy completed" -ForegroundColor Green
} catch {
    Write-Host "  Copy failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Deploy to Cloudflare Workers (if needed)
if (-not $NoDeploy) {
    Write-Host "[4/4] Deploying to Cloudflare Workers..." -ForegroundColor Yellow
    try {
        $deployResult = npm run deploy 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Deploy failed" -ForegroundColor Red
            Write-Host $deployResult -ForegroundColor Red
            exit 1
        }
        Write-Host "  Deploy success" -ForegroundColor Green
    } catch {
        Write-Host "  Deploy exception: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[4/4] Skip deploy (-NoDeploy parameter)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/4] Cleaning public/dist directory..." -ForegroundColor Yellow
try {
    if (Test-Path "public\dist") {
        Remove-Item "public\dist" -Recurse -Force
        Write-Host "  Clean completed" -ForegroundColor Green
    }
} catch {
    Write-Host "  Clean failed (can ignore): $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment process completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: https://rualive-email-worker.cubetan57.workers.dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  .\deploy.ps1              # Normal deployment (smart check)" -ForegroundColor White
Write-Host "  .\deploy.ps1 -Force       # Force rebuild" -ForegroundColor White
Write-Host "  .\deploy.ps1 -NoDeploy    # Build only, do not deploy" -ForegroundColor White
Write-Host ""