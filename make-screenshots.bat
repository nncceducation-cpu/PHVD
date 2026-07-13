@echo off
REM ============================================================
REM  PHVD -> App Store screenshots
REM  Double-click. Produces 5 PNGs at exactly 1290 x 2796
REM  (iPhone 6.7") in store\screenshots\.
REM
REM  First run downloads a headless Chromium (~130 MB). Later
REM  runs are quick.
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo   PHVD - App Store screenshots
echo   ============================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo   Node.js is not installed: https://nodejs.org
  pause
  exit /b 1
)

echo   [1/4] Installing the screenshot tool...
call npm install -D playwright --no-audit --no-fund
if errorlevel 1 goto :fail

echo.
echo   [2/4] Downloading headless Chromium (first run only)...
call npx playwright install chromium
if errorlevel 1 goto :fail

echo.
echo   [3/4] Building the app...
call npm run build
if errorlevel 1 goto :fail

echo.
echo   [4/4] Capturing...
call node _screenshots.mjs
if errorlevel 1 goto :fail

echo.
echo   ============================================
echo    DONE - open store\screenshots\
echo   ============================================
echo   Upload these to App Store Connect under the
echo   6.7" iPhone display size.
echo.
explorer "store\screenshots"
pause
exit /b 0

:fail
echo.
echo   FAILED - read the message above.
echo.
pause
exit /b 1
