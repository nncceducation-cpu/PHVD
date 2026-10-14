"""Validate the release patch against the shipped Capacitor template, twice."""
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

root = Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory(prefix="android-patch-test-", dir=root) as temp:
    android = Path(temp)
    files = ["variables.gradle", "build.gradle", "gradle/wrapper/gradle-wrapper.properties",
             "app/build.gradle", "app/proguard-rules.pro", "app/src/main/AndroidManifest.xml"]
    with tarfile.open(root / "node_modules/@capacitor/cli/assets/android-template.tar.gz") as template:
        for name in files:
            target = android / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(template.extractfile(name).read())
    env = {**os.environ, "ANDROID_PROJECT_DIR": str(android), "ANDROID_VERSION_CODE": "11", "ANDROID_VERSION_NAME": "1.6.2"}
    subprocess.run([sys.executable, str(root / "scripts/patch-android.py")], env=env, check=True, capture_output=True)
    first = {p.relative_to(android): p.read_bytes() for p in android.rglob("*") if p.is_file()}
    subprocess.run([sys.executable, str(root / "scripts/patch-android.py")], env=env, check=True, capture_output=True)
    second = {p.relative_to(android): p.read_bytes() for p in android.rglob("*") if p.is_file()}
    assert first == second, "Release patch must be idempotent"
    gradle = (android / "app/build.gradle").read_text(encoding="utf-8")
    assert gradle.count("signingConfig signingConfigs.release") == 1
    assert "minifyEnabled false" not in gradle
    assert "proguard-android.txt" not in gradle
    assert "minifyEnabled true" in gradle and "shrinkResources true" in gradle
    assert (android / "app/src/androidTest/java/com/khorshidmohammad/phvd/ReleaseBridgeTest.java").exists()
    assert "-dontobfuscate" not in (android / "app/proguard-rules.pro").read_text(encoding="utf-8")
print("PASS: real Capacitor template, optimized release, signing, plugin rules, repeat application")
