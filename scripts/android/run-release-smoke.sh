#!/usr/bin/env bash
set -euo pipefail
mkdir -p smoke-results
app=com.khorshidmohammad.phvd
apk=$(find out -maxdepth 1 -name '*.apk' ! -name '*-test.apk')
test_apk=$(find out -maxdepth 1 -name '*-test.apk')
test -f "$apk"
test -f "$test_apk"
adb install -r "$apk"
adb install -r "$test_apk"
# Permission grants are restricted to the disposable emulator. Real-device
# camera capture and the interactive permission dialogs still need device QA.
for permission in CAMERA READ_EXTERNAL_STORAGE WRITE_EXTERNAL_STORAGE READ_MEDIA_IMAGES READ_MEDIA_VIDEO; do
  adb shell pm grant "$app" "android.permission.$permission" 2>/dev/null || true
done
adb logcat -c
adb shell am instrument -w -r "$app.test/androidx.test.runner.AndroidJUnitRunner" | tee smoke-results/instrumentation.txt
adb logcat -d > smoke-results/logcat.txt
grep -q 'OK (3 tests)' smoke-results/instrumentation.txt
if grep -q 'FATAL EXCEPTION' smoke-results/logcat.txt; then
  echo 'Unexpected native crash during release smoke tests'
  exit 1
fi
