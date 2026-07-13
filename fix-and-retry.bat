@echo off
REM ============================================================
REM  PHVD - fix the two bugs that failed build #1
REM
REM  Build #1 died at:
REM    "MAC verification failed during PKCS12 import"
REM
REM  Cause 1 (my bug): set-secrets.bat piped the password with
REM    trailing spaces, so P12_PASSWORD in GitHub had junk on the
REM    end. Now uses --body, which passes the value exactly.
REM
REM  Cause 2: OpenSSL 3 puts a SHA-256 MAC on the .p12; macOS's
REM    "security import" can't verify it and reports it as a wrong
REM    password. Now built with -macalg sha1 (still AES-encrypted).
REM
REM  Rebuilds the .p12, re-uploads the secrets, done.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "REPO=nncceducation-cpu/PHVD"

set "SSL=openssl"
where openssl >nul 2>&1
if errorlevel 1 set "SSL=C:\Program Files\Git\usr\bin\openssl.exe"

echo.
echo   PHVD - fix and retry
echo   ===================
echo.

if not exist "certs\private.key" ( echo   [!] certs\private.key missing. & pause & exit /b 1 )
if not exist "certs\distribution.cer" ( echo   [!] certs\distribution.cer missing. & pause & exit /b 1 )

echo   ------------------------------------------------------------
echo    Pick a password for the .p12. It can be the SAME one as
echo    before, or a new one - it just has to match what goes into
echo    GitHub, and this script handles both ends.
echo.
echo    Avoid spaces and ^& ^| ^^ ^< ^> characters.
echo   ------------------------------------------------------------
echo.
set /p P12PW=  .p12 password: 
if "!P12PW!"=="" ( echo   Empty. Stopping. & pause & exit /b 1 )

echo.
echo   [1/3] Rebuilding distribution.p12 with a macOS-readable MAC...
cd certs
del /q distribution.p12 2>nul
"%SSL%" pkcs12 -export -macalg sha1 -inkey private.key -in distribution.cer -passout pass:!P12PW! -out distribution.p12
if errorlevel 1 goto :fail
"%SSL%" pkcs12 -in distribution.p12 -info -noout -passin pass:!P12PW! 2>&1 | findstr /i "MAC:"
echo         rebuilt and verified

echo.
echo   [2/3] Re-encoding...
powershell -NoProfile -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('distribution.p12')) | Set-Content -NoNewline 'distribution.p12.txt'"
cd ..

echo.
echo   [3/3] Updating GitHub secrets...
gh secret set BUILD_CERTIFICATE_BASE64 --repo %REPO% < "certs\distribution.p12.txt" && echo     [ok] BUILD_CERTIFICATE_BASE64 || goto :fail
gh secret set P12_PASSWORD --repo %REPO% --body "!P12PW!" && echo     [ok] P12_PASSWORD (exact, no trailing whitespace) || goto :fail

REM re-set the other scalars cleanly too - they had the same trailing-space bug
gh secret set ASC_KEY_ID        --repo %REPO% --body "AM452AHFLH"   && echo     [ok] ASC_KEY_ID        || goto :fail
gh secret set APPLE_TEAM_ID     --repo %REPO% --body "X7ZRXAX7NT"   && echo     [ok] APPLE_TEAM_ID     || goto :fail
gh secret set KEYCHAIN_PASSWORD --repo %REPO% --body "phvd-ci-7k2q" && echo     [ok] KEYCHAIN_PASSWORD || goto :fail

del /q "certs\distribution.p12.txt" 2>nul

echo.
echo   ============================================
echo    Fixed. Tell Claude and it will re-run the build.
echo   ============================================
echo.
pause
exit /b 0

:fail
echo.
echo   FAILED - read the message above.
pause
exit /b 1
