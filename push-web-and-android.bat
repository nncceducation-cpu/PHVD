@echo off
REM ===========================================================================
REM  PHVD -> GitHub : the web app + the Android build
REM
REM  Two commits were made on github.com directly (the References section),
REM  so this local repo is behind. Plain `git push` would be rejected.
REM
REM  This adopts the remote history WITHOUT touching a single file on disk
REM  (reset --soft moves the pointer, not your work), then commits everything
REM  in the folder as one clean commit on top.
REM
REM  Double-click. Safe to run twice.
REM ===========================================================================
setlocal
cd /d "%~dp0"

echo.
echo   PHVD - push web app + Android
echo   =============================
echo.

git --version >nul 2>&1
if errorlevel 1 (
  echo   Git is not installed: https://git-scm.com/download/win
  pause & exit /b 1
)

if not exist ".git" (
  echo   No .git here. Run push-to-github.bat first.
  pause & exit /b 1
)

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
  echo   Committing...
  git commit -m "Add PWA web app (docs/app) and signed Android build pipeline"
  if errorlevel 1 goto :fail
) else (
  echo   Nothing new to commit - already up to date.
  goto :done
)

echo.
echo   Pushing...
git push origin main
if errorlevel 1 goto :fail

:done
echo.
echo   ============================================
echo    PUSHED.
echo   ============================================
echo   Now double-click set-android-secrets.bat,
echo   then tell Claude "pushed, secrets set".
echo.
pause
exit /b 0

:fail
echo.
echo   FAILED - read the git message just above.
echo.
pause
exit /b 1
