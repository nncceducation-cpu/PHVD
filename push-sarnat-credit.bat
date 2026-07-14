@echo off
REM ===========================================================================
REM  PHVD -> GitHub : add the Sarnat-NNCC credit
REM
REM  Ships the credit to the web app (live immediately) and to the Android
REM  build. iOS keeps 1.0 as submitted; the credit goes out in 1.1.
REM
REM  Double-click. Safe to run twice.
REM ===========================================================================
setlocal
cd /d "%~dp0"

echo.
echo   PHVD - push the Sarnat-NNCC credit
echo   ==================================
echo.

git --version >nul 2>&1
if errorlevel 1 ( echo   Git is not installed. & pause & exit /b 1 )
if not exist ".git" ( echo   No .git here. & pause & exit /b 1 )

git config user.name "Khorshid Mohammad"
git config user.email "khorshid.mohammad@gmail.com"

echo   Fetching...
git fetch origin main
if errorlevel 1 goto :fail

echo   Adopting remote history (your files are NOT touched)...
git reset --soft origin/main
if errorlevel 1 goto :fail

echo   Staging...
git add -A

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Credit the Sarnat-NNCC program in the app footer, References, listing and privacy page"
  if errorlevel 1 goto :fail
) else (
  echo   Nothing new to commit.
  goto :done
)

echo   Pushing...
git push origin main
if errorlevel 1 goto :fail

:done
echo.
echo   ============================================
echo    PUSHED. Tell Claude "pushed".
echo   ============================================
echo.
pause
exit /b 0

:fail
echo.
echo   FAILED - read the git message just above.
echo.
pause
exit /b 1
