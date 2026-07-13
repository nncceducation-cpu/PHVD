@echo off
REM ============================================================
REM  PHVD -> Apple signing certificate, the Windows way
REM
REM  Apple assumes you have a Mac (Keychain makes the signing
REM  request). You don't. This uses OpenSSL instead.
REM
REM  Run it TWICE:
REM    Pass 1 - makes your private key + a .certSigningRequest
REM    ...you upload that to Apple, download distribution.cer...
REM    Pass 2 - turns Apple's .cer + your key into the .p12
REM
REM  Your .p12 password is typed straight into OpenSSL.
REM  It is never stored, logged, or shown to anyone.
REM ============================================================
setlocal
cd /d "%~dp0"

set "SSL=openssl"
where openssl >nul 2>&1
if errorlevel 1 (
  if exist "C:\Program Files\Git\usr\bin\openssl.exe" (
    set "SSL=C:\Program Files\Git\usr\bin\openssl.exe"
  ) else (
    echo   OpenSSL not found. Install Git for Windows ^(it includes OpenSSL^):
    echo   https://git-scm.com/download/win
    pause
    exit /b 1
  )
)

if not exist "certs" mkdir certs
cd certs

echo.
echo   PHVD - Apple signing certificate
echo   ================================
echo.

REM ---------- PASS 2: Apple's .cer is here, build the .p12 ----------
if exist "distribution.cer" (
  if exist "private.key" (
    echo   Found distribution.cer + private.key.
    echo   Building the .p12...
    echo.
    "%SSL%" x509 -in distribution.cer -inform DER -out distribution.pem -outform PEM
    if errorlevel 1 goto :fail

    echo   ------------------------------------------------------------
    echo    Choose a password for the .p12 and REMEMBER IT.
    echo    It becomes the GitHub secret  P12_PASSWORD.
    echo    OpenSSL will ask you to type it twice. It is not echoed.
    echo   ------------------------------------------------------------
    echo.
    "%SSL%" pkcs12 -export -macalg sha1 -inkey private.key -in distribution.pem -out distribution.p12
    if errorlevel 1 goto :fail

    echo.
    echo   ============================================
    echo    DONE -^> certs\distribution.p12
    echo   ============================================
    echo.
    echo   Next:
    echo     1. developer.apple.com -^> Profiles -^> + -^> App Store Connect
    echo        App ID com.khorshidmohammad.phvd, pick the cert you just made,
    echo        download the .mobileprovision into this certs\ folder.
    echo     2. Run  encode-secrets.bat  to base64 everything for GitHub.
    echo.
    explorer .
    pause
    exit /b 0
  )
)

REM ---------- PASS 1: make the key + CSR ----------
if exist "private.key" (
  echo   private.key already exists - keeping it ^(do NOT delete it,
  echo   the certificate is worthless without it^).
) else (
  echo   [1/2] Generating your private key...
  "%SSL%" genrsa -out private.key 2048
  if errorlevel 1 goto :fail
)

echo   [2/2] Generating the certificate signing request...
"%SSL%" req -new -key private.key -out CertificateSigningRequest.certSigningRequest -subj "/emailAddress=khorshid.mohammad@gmail.com/CN=Khorshid Mohammad/C=CA"
if errorlevel 1 goto :fail

echo.
echo   ============================================
echo    Created  certs\CertificateSigningRequest.certSigningRequest
echo   ============================================
echo.
echo   Now, in your browser:
echo     1. developer.apple.com/account/resources/certificates
echo     2. Click  +
echo     3. Choose  Apple Distribution   (NOT "Apple Development")
echo     4. Upload the .certSigningRequest file from certs\
echo     5. Download the resulting file. Rename it  distribution.cer
echo        and put it in this certs\ folder.
echo     6. Double-click THIS script again. It will build the .p12.
echo.
echo   Keep certs\private.key. Losing it means starting over.
echo.
explorer .
pause
exit /b 0

:fail
echo.
echo   FAILED - read the OpenSSL message above.
echo.
pause
exit /b 1
