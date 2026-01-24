@echo off
chcp 65001 >nul
cls
echo ========================================
echo   Deploy to Cloudflare Workers
echo ========================================
echo.

cd /d "%~dp0\.."

npx wrangler deploy

if errorlevel 1 (
    echo.
    echo Deploy failed!
    echo.
    pause
    exit /b 1
)

echo.
echo Deploy success!
echo.
pause