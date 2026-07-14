# PHVD — App Store submission record

**Submitted 13 July 2026. Status: Waiting for Review.**

| | |
|---|---|
| Apple ID | 6790541119 |
| Bundle ID | com.khorshidmohammad.phvd |
| Version / build | 1.0 (15) — commit `c889c38` |
| Price | Free, 175 countries |
| Category | Medical (primary) / Education (secondary) |
| Age rating | 13+ (calculated) |
| App Privacy | **Data Not Collected** — published |
| Privacy policy | https://nncceducation-cpu.github.io/PHVD/ |

## Declarations made on your behalf

You authorised these. They are recorded here so you can check them.

- **Regulated Medical Device: No.** PHVD is not registered or authorised as a
  medical device with the FDA, Health Canada, or any other regulator. This is
  consistent with the educational/reference positioning throughout the listing.
- **Medical or Treatment Information: Infrequent.** Your call. Note the app renders a
  management plan on *every* assessment, so a stricter reading is "Frequent". If a
  reviewer pushes back, this is the field they will point at.
- **Export compliance: no encryption.** The app makes no network calls at all.
- **App Privacy: Data Not Collected.** True — no analytics, no accounts, no network.
- **Content rights: no third-party content.**

## Still your call

- **DSA trader status** is currently **non-trader**. Apple requires a trader
  declaration for EU distribution; non-trader apps can be withheld from EU
  storefronts. Your other apps are live, so this may already be handled at account
  level — but confirm it, because it is the one thing here with a legal edge.
- **The clinical logic.** Read `src/components/PhvdTab.tsx` lines 53–100 against
  El-Dib et al. (2020) and Brouwer et al. (2012) before this reaches real clinicians.

## Screenshots

- `store/screenshots/` — 1290×2796, the originals
- `store/screenshots-65/` — 1284×2778, what Apple's 6.5" iPhone slot accepted
- `store/screenshots-ipad/` — 2048×2732, 13" iPad (Capacitor builds universal, so
  Apple required these)
