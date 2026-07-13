@echo off
REM ============================================================
REM  PHVD -> GitHub secrets, without any copy-pasting
REM
REM  Uses the GitHub CLI to read the files straight from disk and
REM  upload them encrypted. No clipboard. No truncated blobs.
REM
REM  You type two things (the .p12 password and the Issuer ID).
REM  They go from your keyboard into GitHub. Nothing is stored.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "REPO=nncceducation-cpu/PHVD"

echo.
echo   PHVD - set GitHub secrets
echo   =========================
echo.

where gh >nul 2>&1
if errorlevel 1 (
  echo   The GitHub CLI is not installed. Install it with:
  echo.
  echo       winget install --id GitHub.cli
  echo.
  echo   Then CLOSE this window, open a new one, and run this again.
  pause
  exit /b 1
)

gh auth status >nul 2>&1
if errorlevel 1 (
  echo   Signing in to GitHub - a browser window will open.
  echo.
  gh auth login
  if errorlevel 1 (
    echo   Sign-in failed.
    pause & exit /b 1
  )
)

if not exist "certs\distribution.p12" (
  echo   [!] certs\distribution.p12 missing. Run finish-setup.bat first.
  pause & exit /b 1
)

echo   Repo: %REPO%
echo.

REM ---- the two you must type ----
echo   ------------------------------------------------------------
set /p P12PW=  The .p12 password you chose in OpenSSL: 
if "!P12PW!"=="" ( echo   Empty. Stopping. & pause & exit /b 1 )

echo.
echo   Issuer ID: App Store Connect -^> Users and Access -^>
echo   Integrations. It's the UUID ABOVE the key table,
echo   like  461157ec-3925-42b5-9c19-8bdc94bc815d
set /p ISSUER=  Issuer ID: 
if "!ISSUER!"=="" ( echo   Empty. Stopping. & pause & exit /b 1 )
echo   ------------------------------------------------------------
echo.

echo   Uploading...
echo.

REM ---- the three files, read straight off disk ----
gh secret set BUILD_CERTIFICATE_BASE64    --repo %REPO% < "certs\distribution.p12.txt"        && echo     [ok] BUILD_CERTIFICATE_BASE64    || goto :fail
gh secret set PROVISIONING_PROFILE_BASE64 --repo %REPO% < "certs\PHVD.mobileprovision.txt"    && echo     [ok] PROVISIONING_PROFILE_BASE64 || goto :fail
gh secret set ASC_KEY_BASE64              --repo %REPO% < "certs\AuthKey_AM452AHFLH.p8.txt"   && echo     [ok] ASC_KEY_BASE64              || goto :fail

REM ---- the fixed values ----
echo AM452AHFLH   | gh secret set ASC_KEY_ID        --repo %REPO% && echo     [ok] ASC_KEY_ID        || goto :fail
echo X7ZRXAX7NT   | gh secret set APPLE_TEAM_ID     --repo %REPO% && echo     [ok] APPLE_TEAM_ID     || goto :fail
echo phvd-ci-7k2q | gh secret set KEYCHAIN_PASSWORD --repo %REPO% && echo     [ok] KEYCHAIN_PASSWORD || goto :fail

REM ---- the two you typed ----
echo !P12PW!  | gh secret set P12_PASSWORD  --repo %REPO% && echo     [ok] P12_PASSWORD  || goto :fail
echo !ISSUER! | gh secret set ASC_ISSUER_ID --repo %REPO% && echo     [ok] ASC_ISSUER_ID || goto :fail

echo.
echo   ============================================
echo    All 8 secrets set.
echo   ============================================
echo.
gh secret list --repo %REPO%
echo.
echo   Now delete the .txt files in certs\ - they are your
echo   signing key in plain text.
echo.
pause
exit /b 0

:fail
echo.
echo   FAILED - read the gh message above.
pause
exit /b 1
