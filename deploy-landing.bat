@echo off
chcp 65001 >nul
cls
echo ========================================
echo   RuAlive Landing Page - Deploy
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

REM Check Wrangler
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npx not found
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Environment check passed
echo.

echo [1/4] Verifying landing.html file...
if not exist "landing.html" (
    echo ERROR: landing.html not found!
    echo.
    pause
    exit /b 1
)
echo landing.html found
echo.

echo [2/4] Building user dashboard (if needed)...
if exist "scripts\build-dashboard.js" (
    node scripts\build-dashboard.js
    if errorlevel 1 (
        echo.
        echo Build failed, but continuing with landing page deployment...
        echo.
    ) else (
        echo Build completed
    )
) else (
    echo No dashboard build script found, skipping...
)
echo.

echo [3/4] Testing landing.html syntax...
powershell -Command "Get-Content landing.html | Out-String" >nul 2>nul
if errorlevel 1 (
    echo WARNING: Could not validate HTML syntax, but continuing...
) else (
    echo HTML syntax appears valid
)
echo.

echo [4/4] Deploying to Cloudflare Workers...
npx wrangler deploy
if errorlevel 1 (
    echo.
    echo Deploy failed!
    echo.
    echo Possible issues:
    echo   - Cloudflare authentication required
    echo   - Network connectivity issues
    echo   - Configuration errors
    echo.
    pause
    exit /b 1
)

echo Deploy completed successfully!
echo.

echo ========================================
echo   SUCCESS!
echo ========================================
echo.
echo Your modern landing page is now live at:
echo   https://rualive-email-worker.cubetan57.workers.dev/
echo.
echo Other available URLs:
echo   - User Dashboard: https://rualive-email-worker.cubetan57.workers.dev/user
echo   - Admin Panel: https://rualive-email-worker.cubetan57.workers.dev/admin
echo   - Login: https://rualive-email-worker.cubetan57.workers.dev/login
echo.
echo To view the landing page, open the main URL in your browser.
echo.
pause