@echo off
chcp 65001 >nul
cls
echo ========================================
echo   Upload to KV Storage
echo ========================================
echo.

cd /d "%~dp0\.."

npx wrangler kv:key put --binding=KV "user-dashboard-inline" --path=./src/user-dashboard/index-inline.html --preview false

if errorlevel 1 (
    echo.
    echo Upload failed!
    echo.
    pause
    exit /b 1
)

echo.
echo Upload success!
echo.
pause