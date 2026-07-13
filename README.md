# PHVD — iOS

The **PHVD tab** of the *DRIVE IVH 2.0* Google AI Studio app, extracted into a standalone
native iOS app (Capacitor + Vite + React), built and shipped to the App Store from a Windows
machine via a cloud macOS runner.

## Status — everything up to the Submit button is done

| | |
|---|---|
| PHVD tab ported (all 561 lines) | done |
| Clinical logic verified against the source's own reference points | done |
| Native iOS shell (Capacitor) | done |
| First-launch medical disclaimer gate | done |
| App icon + splash (1024×1024, no alpha) | done |
| TypeScript compiles, production bundle builds | done |
| macOS CI → signed .ipa → TestFlight | done, **needs your Apple secrets** |
| Privacy policy, listing copy, App Review notes | done |
| **Press "Submit for Review"** | **yours** |

## What was ported, and the two things that changed

`src/components/PhvdTab.tsx` is the AI Studio `components/PHVD.tsx`. The clinical logic —
`getVIP97`, `getRiskZone`, `getManagementAdvice`, and the `RiskGraph` SVG — is unchanged.

**1. The Gemini "Generate Clinical Report" button is removed.**
The original imported `generatePHVDReport` from `services/gemini`. An API key cannot be shipped
inside an app bundle — anything in the bundle is extractable in minutes and the key gets
drained. Removing it also means the App Store privacy answer is a clean *"Data Not Collected"*,
which is the smoothest possible review for a medical app.

To restore it: stand up a serverless proxy (Cloudflare Worker / Vercel) holding the key
server-side, call that from the app, and update `store/PRIVACY.md` and the App Privacy
questionnaire to declare that clinical text leaves the device.

**2. The `stats_measurements` / `stats_updated` localStorage counters are dropped.**
They fed the parent app's dashboard, which doesn't exist in the standalone app.

## Verify the clinical logic yourself

The port was transcribed from the AI Studio editor, so it was checked rather than trusted.
`getVIP97(pma) = 0.28 × pma + 2.6` reproduces the source's own stated anchors —
24w → 9.32mm and 40w → 13.80mm, against the comment's "24w=9.3mm, 40w=13.8mm" — which
independently confirms both coefficients came across correctly. Zone boundaries (Green /
Yellow / Red, VI > P97+4mm, AHW > 10mm, TOD > 25mm, clinical-sign override) were each tested
at PMA 28.

**Before this reaches real clinicians, read `src/components/PhvdTab.tsx` lines 53–100 against
El-Dib et al. (2020) and Brouwer et al. (2012) and confirm you're happy with it.** It is your
name on the app.

## Local dev (works on Windows)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
```

iOS cannot be built on Windows. That's what the CI workflow is for.

---

# Shipping it

## 1. Push to your PHVD repo

```powershell
cd "C:\Users\khors\Downloads\HIE AI\Nmotion\PHVD"
git init
git add .
git commit -m "PHVD iOS: port PHVD tab from DRIVE IVH 2.0, Capacitor shell, macOS CI, App Store pack"
git branch -M main
git remote add origin https://github.com/<your-username>/PHVD.git
git push -u origin main
```

`node_modules/`, `dist/` and `ios/` are gitignored — the macOS runner rebuilds them.

## 2. App Store Connect

- New app → Bundle ID **`com.khorshidmohammad.phvd`**
  (must match `capacitor.config.ts` — change both together if you want a different one)
- Fill the listing from **`store/APP_STORE_LISTING.md`** (name, subtitle, description,
  keywords, age rating, and the Review Notes text that pre-empts the medical-app questions)
- Host **`store/PRIVACY.md`** somewhere public (GitHub Pages on this repo is free) and paste
  the URL into App Information → Privacy Policy URL. **Apple will not review without it.**
- App Privacy questionnaire → **"Data Not Collected"**. Nothing else to tick.
- Upload **`store/app-icon-1024.png`** as the app icon.
- Screenshots: run `npm run dev`, open at iPhone 6.7" size (1290×2796), capture at least 3.

## 3. Apple credentials → GitHub secrets

Create an **App Store Connect API key** (Users and Access → Integrations). Download the `.p8`
**once** — Apple will not let you download it again. Create an **Apple Distribution
certificate** (export as `.p12`) and an **App Store provisioning profile** for the Bundle ID.

Then in the repo → Settings → Secrets and variables → Actions:

| Secret | What it is |
|---|---|
| `BUILD_CERTIFICATE_BASE64` | the `.p12`, base64-encoded |
| `P12_PASSWORD` | its password |
| `PROVISIONING_PROFILE_BASE64` | the `.mobileprovision`, base64-encoded |
| `KEYCHAIN_PASSWORD` | any random string |
| `ASC_KEY_BASE64` | the `.p8`, base64-encoded |
| `ASC_KEY_ID` | 10-character key ID |
| `ASC_ISSUER_ID` | issuer UUID |
| `APPLE_TEAM_ID` | 10-character team ID |

Base64 on Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\cert.p12")) | Set-Clipboard
```

## 4. Build

GitHub → **Actions → "iOS build & upload to App Store Connect" → Run workflow.**

~15 minutes on a rented macOS runner. It installs deps, builds the web bundle, generates the
native iOS project, generates the icon set, signs, archives, exports the `.ipa`, and uploads
it to App Store Connect. The build appears in TestFlight.

## 5. Submit

In App Store Connect, attach the TestFlight build to the version and press **Submit for
Review**.

That button is yours. Apple's terms require the account holder to submit, and handling your
signing certificates or pressing submit on your behalf isn't something I'll do.

---

## Layout

```
src/components/PhvdTab.tsx        the ported PHVD tab — all clinical logic lives here
src/components/DisclaimerGate.tsx first-launch disclaimer — do not remove, review depends on it
capacitor.config.ts               appId must match your App Store Connect Bundle ID
assets/icon.png                   1024×1024 source icon; CI generates the full iOS set from it
.github/workflows/ios-release.yml the macOS build + TestFlight upload
store/                            privacy policy, listing copy, App Review notes, 1024 icon
```
