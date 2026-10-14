#!/usr/bin/env python3
"""
Patches the Capacitor-generated android/ project for a signed Play release.

android/ is regenerated from scratch on every CI run (it is gitignored, exactly
like ios/), so every change we need has to be reapplied here rather than
committed. Four things need changing in the stock Capacitor 6 output:

  1. It targets SDK 34. Google Play requires API 36 for updates from
     31 Aug 2026, so the release build now targets API 36.
  2. compileSdk 36 needs a current Android Gradle Plugin. Capacitor 6 ships 8.2.1.
     So AGP and the Gradle wrapper both move up too.
  3. There is no signing config at all - the stock release buildType is unsigned.
  4. Release code optimization is disabled, causing Play's DEX warning.

Reads from the environment:
  ANDROID_VERSION_CODE   monotonically increasing integer; Play rejects reuse
  ANDROID_VERSION_NAME   e.g. 1.0
  KEYSTORE_PATH / KEYSTORE_PASSWORD / KEY_ALIAS / KEY_PASSWORD

Idempotent: safe to run twice.
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ANDROID = Path(os.environ.get("ANDROID_PROJECT_DIR", ROOT / "android"))
OCR_GRADLE = Path(os.environ.get("ANDROID_OCR_GRADLE", ROOT / "node_modules/@pantrist/capacitor-plugin-ml-kit-text-recognition/android/build.gradle"))

MIN_SDK = "24"  # Required by this app's existing Play automatic protection.
TARGET_SDK = "36"
AGP_VERSION = "8.10.1"  # Includes the R8 metadata used by Android vitals.
GRADLE_VERSION = "8.11.1"

VERSION_CODE = os.environ.get("ANDROID_VERSION_CODE", "11")
VERSION_NAME = os.environ.get("ANDROID_VERSION_NAME", "1.6.2")

failures = []


def edit(path: Path, fn):
    if not path.exists():
        failures.append(f"missing: {path.relative_to(ROOT)}")
        return
    before = path.read_text(encoding="utf-8")
    after = fn(before)
    path.write_text(after, encoding="utf-8")
    print(f"  patched {path.relative_to(ROOT)}")


# 1 -- SDK levels
def sdks(t: str) -> str:
    t = re.sub(r"minSdkVersion\s*=\s*\d+", f"minSdkVersion = {MIN_SDK}", t)
    t = re.sub(r"compileSdkVersion\s*=\s*\d+", f"compileSdkVersion = {TARGET_SDK}", t)
    t = re.sub(r"targetSdkVersion\s*=\s*\d+", f"targetSdkVersion = {TARGET_SDK}", t)
    return t


edit(ANDROID / "variables.gradle", sdks)


# 2 -- Android Gradle Plugin + Gradle wrapper
edit(
    ANDROID / "build.gradle",
    lambda t: re.sub(
        r"com\.android\.tools\.build:gradle:[\d.]+",
        f"com.android.tools.build:gradle:{AGP_VERSION}",
        t,
    ),
)
edit(
    ANDROID / "gradle/wrapper/gradle-wrapper.properties",
    lambda t: re.sub(
        r"gradle-[\d.]+-all\.zip", f"gradle-{GRADLE_VERSION}-all.zip", t
    ),
)


# 3 -- signing config + version, injected into app/build.gradle
SIGNING = """    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH"))
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
"""


def app_gradle(t: str) -> str:
    # version code / name
    t = re.sub(r"versionCode\s+\d+", f"versionCode {VERSION_CODE}", t)
    t = re.sub(r'versionName\s+"[^"]*"', f'versionName "{VERSION_NAME}"', t)
    t = t.replace('testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"',
                  'testInstrumentationRunner "com.khorshidmohammad.phvd.ReleaseSmokeInstrumentation"')

    # signingConfigs block, inserted just before buildTypes
    if "signingConfigs {" not in t:
        t = t.replace("    buildTypes {", SIGNING + "    buildTypes {", 1)

    # Replace only the buildTypes release block (not signingConfigs.release).
    # Keep Capacitor's consumer rules, which protect reflective plugin loading.
    start = t.index("    buildTypes {")
    head, build_types = t[:start], t[start:]
    build_types = re.sub(
        r"release\s*\{[^{}]*\}",
        "release {\n"
        "            signingConfig signingConfigs.release\n"
        "            minifyEnabled true\n"
        "            shrinkResources true\n"
        "            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n"
        "        }",
        build_types, count=1,
    )
    t = head + build_types
    if 'testBuildType "release"' not in t:
        t = t.replace("    buildTypes {", '    testBuildType "release"\n    buildTypes {', 1)
    return t


edit(ANDROID / "app/build.gradle", app_gradle)

# Bundle the Latin OCR model so a fresh/offline install can recognize text
# immediately, without a separate Google Play Services model download.
edit(OCR_GRADLE, lambda t: re.sub(
    r'implementation "com\.google\.android\.gms:play-services-mlkit-text-recognition:[^"]+"',
    'implementation "com.google.mlkit:text-recognition:16.0.1"', t,
))

# The JavaScript bridge must retain its annotated entry points. Plugin classes,
# constructors, methods and callbacks are kept by Capacitor's consumer rules.
edit(ANDROID / "app/proguard-rules.pro", lambda _: (ROOT / "scripts/android/proguard-rules.pro").read_text(encoding="utf-8"))

# Run the integration tests against the actual signed, optimized release APK.
test_dir = ANDROID / "app/src/androidTest/java/com/khorshidmohammad/phvd"
test_dir.mkdir(parents=True, exist_ok=True)
(test_dir / "ReleaseSmokeInstrumentation.java").write_text(
    (ROOT / "scripts/android/ReleaseSmokeInstrumentation.java").read_text(encoding="utf-8"), encoding="utf-8"
)


# 4 -- CAMERA permission for the measurement-scan feature (on-device OCR).
#      android/ is regenerated each run, so the permission is injected here.
def manifest(t: str) -> str:
    if "android.permission.CAMERA" not in t:
        t = t.replace(
            "</manifest>",
            '    <uses-permission android:name="android.permission.CAMERA" />\n'
            '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n'
            "</manifest>",
            1,
        )
    return t


edit(ANDROID / "app/src/main/AndroidManifest.xml", manifest)


# -- verify, loudly. A silently-unsigned release build is the failure mode that
#    wastes an afternoon, so assert rather than hope.
checks = {
    OCR_GRADLE: ['implementation "com.google.mlkit:text-recognition:16.0.1"'],
    ANDROID / "variables.gradle": [
        f"minSdkVersion = {MIN_SDK}",
        f"targetSdkVersion = {TARGET_SDK}",
        f"compileSdkVersion = {TARGET_SDK}",
    ],
    ANDROID / "build.gradle": [f"com.android.tools.build:gradle:{AGP_VERSION}"],
    ANDROID / "gradle/wrapper/gradle-wrapper.properties": [f"gradle-{GRADLE_VERSION}-all.zip"],
    ANDROID / "app/build.gradle": [
        "signingConfigs {",
        "signingConfig signingConfigs.release",
        "minifyEnabled true",
        "shrinkResources true",
        "proguard-android-optimize.txt",
        'testBuildType "release"',
        'testInstrumentationRunner "com.khorshidmohammad.phvd.ReleaseSmokeInstrumentation"',
        f"versionCode {VERSION_CODE}",
        f'versionName "{VERSION_NAME}"',
    ],
    ANDROID / "app/src/main/AndroidManifest.xml": [
        "android.permission.CAMERA",
    ],
}

print("\nverifying:")
for path, needles in checks.items():
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    for needle in needles:
        if needle in text:
            print(f"  ok   {needle}")
        else:
            failures.append(f"{path.relative_to(ROOT)}: expected {needle!r}")

if failures:
    print("\nFAILED:")
    for f in failures:
        print("  " + f)
    sys.exit(1)

print("\nandroid/ patched: API %s, AGP %s, signed release, version %s (%s)"
      % (TARGET_SDK, AGP_VERSION, VERSION_NAME, VERSION_CODE))
