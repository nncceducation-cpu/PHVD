"""Fail a release without R8 metadata/mapping or meaningful code obfuscation."""
import hashlib
import json
from pathlib import Path
import re
import sys
import struct
import zipfile

aab = Path(sys.argv[1])
mapping = Path(sys.argv[2]).read_text(encoding="utf-8")
classes = re.findall(r"^([^ #].*?) -> (.+?):$", mapping, re.M)
assert classes, "R8 mapping must include class mappings"
renamed = sum(before != after for before, after in classes)
assert renamed / len(classes) >= 0.25, "Less than 25% of mapped classes were obfuscated"
with zipfile.ZipFile(aab) as bundle:
    metadata = json.loads(bundle.read("BUNDLE-METADATA/com.android.tools/r8.json"))
    vitals_scores = {name: round(100 - metadata["stats"][key], 2) for name, key in {
        "obfuscation": "noObfuscationPercentage", "optimization": "noOptimizationPercentage",
        "shrinking": "noShrinkingPercentage"}.items()}
    assert all(25 <= score <= 100 for score in vitals_scores.values()), f"R8 score below Play threshold: {vitals_scores}"
    assert all(metadata["options"][key] for key in ["isObfuscationEnabled", "isOptimizationsEnabled", "isShrinkingEnabled"]), "An R8 optimization was disabled"
    embedded_mapping = bundle.read("BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map")
    assert embedded_mapping, "Play needs the embedded mapping for crash deobfuscation"
    dex_bytes = sum(item.file_size for item in bundle.infolist() if item.filename.endswith(".dex"))
    assert dex_bytes < 11471028, "R8 did not reduce DEX size compared with build 10"
    assets = {name: hashlib.sha256(bundle.read(name)).hexdigest() for name in bundle.namelist()
              if name.startswith("base/assets/public/assets/") and name.endswith(".js")}
    assert "0bc054c43e94e0f844abe427f2348feba6787617b2c8e0068d65c6e314129ebe" in assets.values(), "Calculator bundle changed from tested build 10"
    native_alignments = {}
    for name in bundle.namelist():
        if name.endswith(".so") and any(abi in name for abi in ["/arm64-v8a/", "/x86_64/"]):
            elf = bundle.read(name)
            assert elf[:5] == b"\x7fELF\x02" and elf[5] == 1, f"Unexpected native ELF format: {name}"
            phoff = struct.unpack_from("<Q", elf, 32)[0]
            phsize, phnum = struct.unpack_from("<HH", elf, 54)
            alignments = [struct.unpack_from("<Q", elf, phoff + i * phsize + 48)[0]
                          for i in range(phnum) if struct.unpack_from("<I", elf, phoff + i * phsize)[0] == 1]
            assert alignments and min(alignments) >= 16384, f"Native library lacks 16 KB page alignment: {name}"
            native_alignments[name] = alignments
report = {"r8": metadata, "dexBytes": dex_bytes, "build10DexBytes": 11471028,
          "vitalsScoresFromR8Metadata": vitals_scores,
          "native64BitLoadSegmentAlignments": native_alignments,
          "mappedClassObfuscationPercent": round(renamed / len(classes) * 100, 2),
          "mappedClasses": len(classes), "renamedClasses": renamed, "webAssetSha256": assets}
# Mapping-based percentage is a separate diagnostic, not the Android vitals score.
print(json.dumps(report, indent=2))
Path(sys.argv[3]).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
