# Apple credentials — the Windows path

You need three things from Apple. Each one is a few clicks plus one script run.

**Prerequisite:** an active Apple Developer Program membership ($99/yr). If you only have a
free Apple ID, none of the pages below will show the buttons. Check at
[developer.apple.com/account](https://developer.apple.com/account) — you should see
"Certificates, Identifiers & Profiles" in the sidebar.

Two IDs you'll need to copy along the way — grab them now:

- **`APPLE_TEAM_ID`** — [developer.apple.com/account](https://developer.apple.com/account) →
  Membership details. A 10-character string like `A1B2C3D4E5`.
- **`ASC_ISSUER_ID`** — comes in step 2 below.

---

## 1. Register the App ID (2 min)

Apple needs to know the Bundle ID exists before it will issue a profile for it.

1. [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers) → **+**
2. **App IDs** → Continue → **App** → Continue
3. Description: `PHVD`
4. Bundle ID: select **Explicit**, enter exactly:
   ```
   com.khorshidmohammad.phvd
   ```
5. Leave all capabilities unticked — the app needs none.
6. Continue → Register

Then create the app record: [App Store Connect](https://appstoreconnect.apple.com) → Apps →
**+** → New App. Platform iOS, Name `PHVD`, Primary Language English, Bundle ID
`com.khorshidmohammad.phvd`, SKU `phvd-001`.

---

## 2. App Store Connect API key → the `.p8` (2 min)

This is what lets the GitHub runner upload the build without your password.

1. [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** →
   **Integrations** tab → **App Store Connect API** → **Team Keys**
2. **+** → Name: `PHVD CI` → Access: **App Manager** → Generate
3. **Download the `.p8`.** Apple lets you do this **exactly once** — there is no second
   chance. Put it in the `certs\` folder inside PHVD (create it if it doesn't exist yet).
   The filename looks like `AuthKey_ABC123DEFG.p8`.
4. Copy two values off that page:
   - **Key ID** — the 10-character code in the key's row → secret `ASC_KEY_ID`
   - **Issuer ID** — the UUID shown *above* the table → secret `ASC_ISSUER_ID`

---

## 3. Distribution certificate → the `.p12` (5 min)

Apple's instructions here assume a Mac, because Keychain Access normally generates the
signing request. On Windows, OpenSSL does it — `make-ios-certs.bat` handles that.

**Run `make-ios-certs.bat`.** It creates `certs\private.key` and
`certs\CertificateSigningRequest.certSigningRequest`.

Then:

1. [developer.apple.com/account/resources/certificates](https://developer.apple.com/account/resources/certificates) → **+**
2. Choose **Apple Distribution** — *not* "Apple Development". Getting this wrong is the
   single most common way this goes sideways.
3. Upload `certs\CertificateSigningRequest.certSigningRequest`
4. Download the certificate. **Rename it to `distribution.cer`** and put it in `certs\`.
5. **Run `make-ios-certs.bat` again.** It sees the `.cer`, and builds
   `certs\distribution.p12`.
   - It asks you to choose a password. **Write it down** — that's the `P12_PASSWORD` secret.
   - You type it into OpenSSL directly. It isn't stored anywhere.

> **`certs\private.key` is irreplaceable.** The certificate is useless without it. Don't
> delete the `certs\` folder.

---

## 4. Provisioning profile → the `.mobileprovision` (2 min)

1. [developer.apple.com/account/resources/profiles](https://developer.apple.com/account/resources/profiles) → **+**
2. Under **Distribution**, choose **App Store Connect** → Continue
3. App ID: `com.khorshidmohammad.phvd` → Continue
4. Certificate: pick the Apple Distribution cert you just made → Continue
5. Name it `PHVD` → Generate → Download
6. Put it in `certs\` and rename it to **`PHVD.mobileprovision`**

---

## 5. Encode everything → GitHub secrets (3 min)

**Run `encode-secrets.bat`.** It base64-encodes the three binary files locally and writes a
`.txt` next to each. Nothing leaves your machine.

Then: [repo → Settings → Secrets and variables → Actions](https://github.com/nncceducation-cpu/PHVD/settings/secrets/actions)
→ **New repository secret**, eight times:

| Secret | Where it comes from |
|---|---|
| `BUILD_CERTIFICATE_BASE64` | paste contents of `certs\distribution.p12.txt` |
| `P12_PASSWORD` | the password you chose in step 3 |
| `PROVISIONING_PROFILE_BASE64` | paste contents of `certs\PHVD.mobileprovision.txt` |
| `KEYCHAIN_PASSWORD` | any random string you invent, e.g. `phvd-ci-9f2a` |
| `ASC_KEY_BASE64` | paste contents of `certs\AuthKey_*.p8.txt` |
| `ASC_KEY_ID` | step 2 — 10 characters |
| `ASC_ISSUER_ID` | step 2 — a UUID |
| `APPLE_TEAM_ID` | 10 characters, from Membership details |

**Delete the `.txt` files afterwards.** They're your key material in plain text.

`certs/` is already in `.gitignore`, so none of this can be committed by accident.

---

## 6. Build

GitHub → **Actions** → **"iOS build & upload to App Store Connect"** → **Run workflow**.

~15 min. The build appears in TestFlight. Then fill the listing from
`store/APP_STORE_LISTING.md`, add the privacy URL
(`https://nncceducation-cpu.github.io/PHVD/`), upload the screenshots, and **Submit for
Review**.

---

### If it fails

- **"No signing certificate found"** — you made an *Apple Development* cert instead of *Apple
  Distribution*. Redo step 3.
- **"Provisioning profile doesn't match bundle identifier"** — the App ID in step 1 isn't
  exactly `com.khorshidmohammad.phvd`.
- **"Invalid or unsupported key format"** on the `.p12` — re-run the second pass of
  `make-ios-certs.bat`; the `-legacy` flag it uses is what makes OpenSSL 3 output a `.p12`
  that macOS keychains accept.

Paste any error at me and I'll work out which of the above it is.
