@echo off
REM ---------------------------------------------------------------------------
REM  Uploads the four Android signing secrets to the PHVD GitHub repo.
REM
REM  Reads the key material straight off disk - nothing is copy-pasted, and
REM  nothing is echoed to the screen.
REM
REM  Needs the GitHub CLI, which you already authenticated for the iOS build.
REM ---------------------------------------------------------------------------
setlocal
cd /d "%~dp0"

if not exist "certs\phvd-release.keystore" (
  echo ERROR: certs\phvd-release.keystore not found.
  echo Run this from inside the PHVD folder.
  pause
  exit /b 1
)

set REPO=nncceducation-cpu/PHVD

echo Setting ANDROID_KEYSTORE_BASE64 ...
gh secret set ANDROID_KEYSTORE_BASE64 --repo %REPO% < certs\keystore-base64.secret

echo Setting ANDROID_KEYSTORE_PASSWORD ...
set /p KSPW=<certs\keystore-password.secret
gh secret set ANDROID_KEYSTORE_PASSWORD --repo %REPO% --body "%KSPW%"

echo Setting ANDROID_KEY_PASSWORD ...
gh secret set ANDROID_KEY_PASSWORD --repo %REPO% --body "%KSPW%"

echo Setting ANDROID_KEY_ALIAS ...
gh secret set ANDROID_KEY_ALIAS --repo %REPO% --body "phvd"

set KSPW=

echo.
echo Done. Four secrets set. Tell Claude "android secrets set".
echo.
pause
