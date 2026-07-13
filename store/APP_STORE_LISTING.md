# App Store Connect — listing copy & review answers

Positioning: **educational / reference tool for clinicians.** Every field below is written
to keep the app clearly outside "medical device" territory, which is what keeps App Review
guideline 1.4.1 from becoming a problem.

---

## App name (30 char max)
`PHVD`

## Subtitle (30 char max)
`Ventricular index reference`

## Primary category
Medical  ·  **Secondary:** Education

## Age rating
17+ — answer **"Yes, infrequent/mild"** to *Medical/Treatment Information*. This is expected
for a clinical reference app and is not a penalty.

## Promotional text (170 char max)
A bedside reference for post-haemorrhagic ventricular dilatation in preterm infants.
Enter measurements, see them against reference curves. For clinicians. Not a diagnostic device.

## Description

PHVD is a reference and educational tool for neonatal clinicians working with
post-haemorrhagic ventricular dilatation in preterm infants.

Enter serial cranial ultrasound measurements — ventricular index, anterior horn width and
thalamo-occipital distance — alongside post-menstrual age, and see them plotted against
published reference curves.

**What it does**
• Records serial measurements across post-menstrual age
• Plots them against reference curves
• Shows the trend across a series of scans
• Keeps everything on your device

**What it does not do**
PHVD does not diagnose, does not recommend treatment, and does not replace clinical
assessment, imaging review, or your local protocol. It is a reference aid for qualified
healthcare professionals. Every output must be independently verified against the source
images and your unit's guideline.

PHVD collects no personal data. Nothing you enter leaves your device.

## Keywords (100 char max)
`neonatal,preterm,ventricular,index,cranial,ultrasound,IVH,NICU,neurology,reference`

## Support URL
https://github.com/<your-username>/PHVD  (or a GitHub Pages page — must be live at review)

## Privacy Policy URL
Required. Host `store/PRIVACY.md` — see README.

---

## App Privacy questionnaire (App Store Connect > App Privacy)

If the shipped build has **no** Gemini/AI call:
> **"Data Not Collected"** — tick nothing else. This is the whole questionnaire. Done.

If the shipped build **does** call the Gemini API, you must instead declare:
> Health & Fitness → Health → **collected, linked to no identity, used for App Functionality**

The first answer is far cleaner. See the API-key note in the README before deciding.

---

## Notes for App Review (the "Review Notes" free-text box)

Paste this. It pre-empts the two questions reviewers ask about clinical apps.

> PHVD is an educational and reference tool for qualified neonatal healthcare
> professionals. It does not provide a diagnosis, does not recommend treatment, and is not
> a medical device. It presents user-entered measurements against published reference
> curves from the peer-reviewed literature, which are cited in-app.
>
> A full disclaimer is presented on first launch and must be accepted before the app can be
> used; a persistent disclaimer is visible on every screen.
>
> The app requires no account. There is no login. All processing is on-device and no user
> data is collected or transmitted.
>
> Developer: Dr Khorshid Mohammad, staff neonatologist.

---

## Assets you still need to produce
- [ ] App icon, 1024×1024 PNG, no alpha, no rounded corners
- [ ] iPhone 6.7" screenshots (1290×2796) — minimum 3
- [ ] iPad screenshots only if you ship iPad support (you can set iPhone-only and skip these)
