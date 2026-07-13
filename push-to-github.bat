@echo off
REM ============================================================
REM  PHVD -> GitHub
REM  Double-click. Safe to run again if it fails partway.
REM
REM  GitHub will ask you to sign in in ITS OWN window.
REM  Do not type a token or password into this one.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo   PHVD - push to GitHub
echo   =====================
echo.

git --version >nul 2>&1
if errorlevel 1 (
  echo   Git is not installed: https://git-scm.com/download/win
  echo.
  pause
  exit /b 1
)

REM ---- 1. identity (this is what failed last time) ----
REM Always asks, so a wrong global git identity can't silently win.
set /p GNAME=  Name for git commits [Khorshid Mohammad]: 
if "!GNAME!"=="" set "GNAME=Khorshid Mohammad"
set /p GMAIL=  Email for git commits [khorshid.mohammad@gmail.com]: 
if "!GMAIL!"=="" set "GMAIL=khorshid.mohammad@gmail.com"

REM ---- 2. repo URL ----
echo   Open your PHVD repo on github.com and copy the address bar.
echo   It looks like:  https://github.com/yourname/PHVD
echo.
set /p REPO=  Repo URL [press Enter for nncceducation-cpu/PHVD]: 
if "!REPO!"=="" set "REPO=https://github.com/nncceducation-cpu/PHVD"

REM reject the placeholder
echo !REPO! | findstr /i "USERNAME yourname your-username" >nul
if not errorlevel 1 (
  echo.
  echo   That still contains the placeholder. Replace it with your REAL
  echo   GitHub username - the name that appears in your own repo's URL.
  echo.
  pause
  exit /b 1
)

REM Normalise the URL. Strip any trailing slash, strip a .git if it's
REM already there, then add exactly one back. (The old findstr check
REM failed to spot an existing .git and produced PHVD.git.git.)
if "!REPO:~-1!"=="/" set "REPO=!REPO:~0,-1!"
if /i "!REPO:~-4!"==".git" set "REPO=!REPO:~0,-4!"
set "REPO=!REPO!.git"

echo.
echo   Name : !GNAME!
echo   Email: !GMAIL!
echo   Repo : !REPO!
echo.

if not exist ".git" git init -b main
git config user.name "!GNAME!"
git config user.email "!GMAIL!"

REM make sure we are on main even if git init defaulted to master
git branch -M main 2>nul

echo   Staging...
git add -A

git diff --cached --quiet
if errorlevel 1 (
  echo   Committing...
  git commit -m "PHVD iOS: port PHVD tab from DRIVE IVH 2.0, Capacitor shell, macOS CI, App Store pack"
  if errorlevel 1 goto :fail
) else (
  git rev-parse HEAD >nul 2>&1
  if errorlevel 1 (
    echo   Nothing staged and no commit exists. Something is off.
    goto :fail
  )
  echo   Already committed, nothing new to add.
)

git remote remove origin >nul 2>&1
git remote add origin "!REPO!"

echo.
echo   Pushing... ^(GitHub sign-in window may appear^)
git push -u origin main
if errorlevel 1 goto :fail

echo.
echo   ============================================
echo    PUSHED.
echo   ============================================
echo   Next: repo Settings ^> Secrets and variables ^> Actions,
echo   add the 8 Apple secrets, then Actions ^> Run workflow.
echo.
pause
exit /b 0

:fail
echo.
echo   FAILED - read the git message just above this line.
echo   Fix it and double-click this file again; it picks up where it left off.
echo.
pause
exit /b 1
