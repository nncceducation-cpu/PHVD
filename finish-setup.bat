@echo off
REM ============================================================
REM  PHVD - finish the Apple setup
REM
REM  Already done for you on developer.apple.com:
REM    - App ID        com.khorshidmohammad.phvd
REM    - Certificate   Apple Distribution (exp. 2027-07-13)
REM    - Profile       PHVD (App Store)
REM    - private.key + CSR are in certs\
REM
REM  This script:
REM    1. collects the two downloads out of your Downloads folder
REM    2. builds distribution.p12 from the cert + your private key
REM    3. base64-encodes everything for GitHub secrets
REM
REM  You choose the .p12 password. It is typed into OpenSSL
REM  directly and is never stored or transmitted.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "SSL=openssl"
where openssl >nul 2>&1
if errorlevel 1 (
  if exist "C:\Program Files\Git\usr\bin\openssl.exe" (
    set "SSL=C:\Program Files\Git\usr\bin\openssl.exe"
  ) else (
    echo   OpenSSL not found. Install Git for Windows: https://git-scm.com/download/win
    pause & exit /b 1
  )
)

set "DL=%USERPROFILE%\Downloads"
if not exist certs mkdir certs

echo.
echo   PHVD - finishing Apple setup
echo   ===========================
echo.

REM ---- 1. collect the downloads ----
echo   [1/3] Collecting downloads...

if exist "certs\distribution.cer" (
  echo         distribution.cer already in certs\
) else (
  if exist "%DL%\distribution.cer" (
    move /y "%DL%\distribution.cer" "certs\distribution.cer" >nul
    echo         moved distribution.cer
  ) else (
    for %%f in ("%DL%\*.cer") do (
      move /y "%%f" "certs\distribution.cer" >nul
      echo         moved %%~nxf  -^>  distribution.cer
      goto :gotcer
    )
    echo         [!] No .cer found in Downloads. Find it and put it in certs\ as distribution.cer
    pause & exit /b 1
  )
)
:gotcer

if exist "certs\PHVD.mobileprovision" (
  echo         PHVD.mobileprovision already in certs\
) else (
  for %%f in ("%DL%\*.mobileprovision") do (
    move /y "%%f" "certs\PHVD.mobileprovision" >nul
    echo         moved %%~nxf  -^>  PHVD.mobileprovision
    goto :gotprof
  )
  echo         [!] No .mobileprovision found in Downloads.
  pause & exit /b 1
)
:gotprof

cd certs

REM ---- 2. build the .p12 ----
echo.
echo   [2/3] Building distribution.p12...
if not exist private.key (
  echo         [!] private.key is missing. Cannot continue.
  echo             The certificate is useless without it.
  pause & exit /b 1
)

"%SSL%" x509 -in distribution.cer -inform DER -out distribution.pem -outform PEM
if errorlevel 1 goto :fail

echo.
echo   ------------------------------------------------------------
echo    Choose a password for the .p12 and WRITE IT DOWN.
echo    It becomes the GitHub secret  P12_PASSWORD.
echo    OpenSSL asks twice. Nothing is echoed to the screen.
echo   ------------------------------------------------------------
echo.
"%SSL%" pkcs12 -export -macalg sha1 -inkey private.key -in distribution.pem -out distribution.p12
if errorlevel 1 goto :fail
echo.
echo         built distribution.p12

REM ---- 3. encode for GitHub ----
echo.
echo   [3/3] Encoding for GitHub secrets...
call :enc "distribution.p12"
call :enc "PHVD.mobileprovision"
for %%f in (AuthKey_*.p8) do call :enc "%%f"

echo.
echo   ============================================================
echo    DONE. Now add 8 secrets at:
echo    github.com/nncceducation-cpu/PHVD/settings/secrets/actions
echo   ============================================================
echo.
echo    Paste file contents:
echo      BUILD_CERTIFICATE_BASE64     distribution.p12.txt
echo      PROVISIONING_PROFILE_BASE64  PHVD.mobileprovision.txt
echo      ASC_KEY_BASE64               AuthKey_AM452AHFLH.p8.txt
echo.
echo    Type by hand:
echo      P12_PASSWORD       the password you just chose
echo      KEYCHAIN_PASSWORD  any random string, e.g. phvd-ci-7k2q
echo      ASC_KEY_ID         AM452AHFLH
echo      ASC_ISSUER_ID      the UUID from App Store Connect
echo      APPLE_TEAM_ID      X7ZRXAX7NT
echo.
echo    THEN DELETE the .txt files. They are your key material.
echo.
explorer .
pause
exit /b 0

:enc
if not exist "%~1" ( echo         [skip] %~1 not found & goto :eof )
powershell -NoProfile -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('%~1')) | Set-Content -NoNewline '%~1.txt'"
echo         encoded %~1
goto :eof

:fail
echo.
echo   FAILED - read the OpenSSL message above.
pause
exit /b 1
