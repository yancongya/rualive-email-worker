@echo off
chcp 65001 >nul
cls
echo ========================================
echo   Environment Check
echo ========================================
echo.

echo [1] Current directory...
cd
echo Current dir: %cd%
echo.

echo [2] Checking Node.js...
where node
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
) else (
    echo OK: Node.js installed
    node --version
)
echo.

echo [3] Checking npm...
where npm
if %errorlevel% neq 0 (
    echo ERROR: npm not found
) else (
    echo OK: npm installed
    npm --version
)
echo.

echo [4] Checking npx...
where npx
if %errorlevel% neq 0 (
    echo ERROR: npx not found
) else (
    echo OK: npx installed
)
echo.

echo [5] Checking files...
if exist "scripts\build-dashboard.js" (
    echo OK: scripts\build-dashboard.js exists
) else (
    echo ERROR: scripts\build-dashboard.js not found
)

if exist "src\user-dashboard\index.html" (
    echo OK: src\user-dashboard\index.html exists
) else (
    echo ERROR: src\user-dashboard\index.html not found
)

if exist "wrangler.toml" (
    echo OK: wrangler.toml exists
) else (
    echo ERROR: wrangler.toml not found
)
echo.

echo [6] Checking wrangler...
npx wrangler --version
if %errorlevel% neq 0 (
    echo ERROR: wrangler not installed
) else (
    echo OK: wrangler installed
)
echo.

echo [7] Checking Cloudflare login...
npx wrangler whoami
if %errorlevel% neq 0 (
    echo ERROR: Not logged in to Cloudflare
    echo Please run: npx wrangler login
) else (
    echo OK: Logged in to Cloudflare
)
echo.

echo ========================================
echo   Check Complete
echo ========================================
echo.
pause