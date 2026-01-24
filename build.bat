@echo off
chcp 65001 >nul
cls
echo ========================================
echo   RuAlive Email Worker - Build
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

node scripts\build-dashboard.js

if errorlevel 1 (
    echo.
    echo Build failed!
    echo.
    pause
    exit /b 1
)

echo.
pause