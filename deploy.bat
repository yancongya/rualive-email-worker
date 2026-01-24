@echo off
chcp 65001 >nul
cls
echo ========================================
echo   RuAlive Email Worker - Deploy
echo ========================================
echo.

cd /d "%~dp0"

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Environment check passed
echo.

echo [1/3] Building dashboard...
node scripts\build-dashboard.js
if errorlevel 1 (
    echo.
    echo Build failed!
    echo.
    pause
    exit /b 1
)
echo Build completed
echo.

echo [2/3] Uploading to KV...
npx wrangler kv:key put --binding=KV "user-dashboard-inline" --path=./src/user-dashboard/index-inline.html --preview false
if errorlevel 1 (
    echo.
    echo KV upload failed!
    echo.
    pause
    exit /b 1
)
echo Upload completed
echo.

echo [3/3] Deploying to Cloudflare Workers...
npx wrangler deploy
if errorlevel 1 (
    echo.
    echo Deploy failed!
    echo.
    pause
    exit /b 1
)
echo Deploy completed
echo.

echo ========================================
echo   SUCCESS!
echo ========================================
echo.
echo URLs:
echo   - Home: https://rualive-email-worker.cubetan57.workers.dev/
echo   - User: https://rualive-email-worker.cubetan57.workers.dev/user
echo   - Admin: https://rualive-email-worker.cubetan57.workers.dev/admin
echo.
pause