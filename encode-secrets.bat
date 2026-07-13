@echo off
REM ============================================================
REM  Base64-encodes your Apple files for GitHub secrets.
REM
REM  Reads from certs\ :
REM     distribution.p12          -> BUILD_CERTIFICATE_BASE64
REM     PHVD.mobileprovision      -> PROVISIONING_PROFILE_BASE64
REM     AuthKey_XXXXXXXXXX.p8     -> ASC_KEY_BASE64
REM
REM  Writes each as a .txt next to it. Paste the CONTENTS of each
REM  .txt into the matching GitHub secret, then delete the .txt.
REM
REM  Nothing is uploaded anywhere. This is local encoding only.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

if not exist "certs" (
  echo   No certs\ folder. Run make-ios-certs.bat first.
  pause
  exit /b 1
)
cd certs

echo.
echo   Encoding for GitHub secrets
echo   ==========================
echo.

call :enc "distribution.p12"        "BUILD_CERTIFICATE_BASE64"
call :enc "PHVD.mobileprovision"    "PROVISIONING_PROFILE_BASE64"

for %%f in (AuthKey_*.p8) do call :enc "%%f" "ASC_KEY_BASE64"

echo.
echo   ------------------------------------------------------------
echo   Go to:
echo     github.com/nncceducation-cpu/PHVD
echo       -^> Settings -^> Secrets and variables -^> Actions
echo       -^> New repository secret   (do this 8 times)
echo   ------------------------------------------------------------
echo.
echo   From the .txt files just written:
echo     BUILD_CERTIFICATE_BASE64     paste distribution.p12.txt
echo     PROVISIONING_PROFILE_BASE64  paste PHVD.mobileprovision.txt
echo     ASC_KEY_BASE64               paste AuthKey_*.p8.txt
echo.
echo   Typed by hand:
echo     P12_PASSWORD      the password you chose for the .p12
echo     KEYCHAIN_PASSWORD any random string, e.g. hunter2-phvd-ci
echo     ASC_KEY_ID        10 chars, from the API key row in App Store Connect
echo     ASC_ISSUER_ID     the UUID above the key table
echo     APPLE_TEAM_ID     10 chars, top-right of developer.apple.com
echo.
echo   DELETE the .txt files once pasted. They are your key material.
echo.
explorer .
pause
exit /b 0

:enc
if not exist "%~1" (
  echo   [skip] %~1 not found  ^(needed for %~2^)
  goto :eof
)
powershell -NoProfile -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('%~1')) | Set-Content -NoNewline '%~1.txt'"
if errorlevel 1 (
  echo   [FAIL] %~1
  goto :eof
)
echo   [ ok ] %~1  -^>  %~1.txt   ^(secret: %~2^)
goto :eof
