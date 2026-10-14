#!/usr/bin/env bash
set -euo pipefail
mkdir -p smoke-results
app=com.khorshidmohammad.phvd
trap 'adb logcat -d > smoke-results/logcat.txt; adb shell dumpsys package "$app" > smoke-results/package.txt' EXIT
apk=$(find out -maxdepth 1 -name '*.apk' ! -name '*-test.apk')
test_apk=$(find out -maxdepth 1 -name '*-test.apk')
test -f "$apk"
test -f "$test_apk"
adb install -r "$apk"
adb install -r -t "$test_apk"
# Permission grants are restricted to the disposable emulator. Real-device
# camera capture and the interactive permission dialogs still need device QA.
for permission in CAMERA READ_EXTERNAL_STORAGE WRITE_EXTERNAL_STORAGE READ_MEDIA_IMAGES READ_MEDIA_VIDEO; do
  adb shell pm grant "$app" "android.permission.$permission" 2>/dev/null || true
done
# Validate first-use OCR without a background model download.
adb shell svc wifi disable
adb shell svc data disable
adb logcat -c
adb shell dumpsys package "$app" > smoke-results/package-before-start.txt
adb shell am start -W -n "$app/.MainActivity"
sleep 5
adb shell pidof "$app"
adb shell am instrument -w -r "$app.test/$app.ReleaseSmokeInstrumentation" | tee smoke-results/instrumentation.txt
adb logcat -d > smoke-results/logcat.txt
grep -q 'OK (3 tests)' smoke-results/instrumentation.txt
if grep -q "E AndroidRuntime: Process: $app," smoke-results/logcat.txt; then
  echo 'Unexpected native crash during release smoke tests'
  exit 1
fi
