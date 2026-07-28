# PHVD on Google Play — SUBMITTED FOR REVIEW

**The closed-testing release + store listing are in Google's review queue.**
Reviews typically complete within 7 days. Status: "Changes in review".

Play Console: developer **Dr Khorshid Mohammad**, app **PHVD**, ID 4973320917945194224.

## Fully done and submitted

| | |
|---|---|
| Account verification (identity + device) | cleared |
| Developer name → "Dr Khorshid Mohammad" | done |
| App record, package `com.khorshidmohammad.phvd`, free, all countries | done |
| Store listing: title, descriptions, icon, feature graphic, phone + 7"/10" tablet screenshots | done |
| App category: Medical · contact email/phone/website | done |
| Content rating (IARC): Everyone / All ages | done |
| Target audience: 18+ | done |
| Data safety: No data collected, no data shared | done |
| Health apps: "Medical reference and education" (not a device) | done |
| Ads / Advertising ID / Government / Financial: none | done |
| **Internal testing**: published, live | done |
| **Closed testing (Alpha)**: signed .aab (v2), all countries, testers attached | done |
| **Submitted to Google for review** | **done — in review** |

## Testers (both tracks) — "PHVD testers" list

- khorshid.mohammad@gmail.com (you)
- sylkejsteggerda@gmail.com
- meddyromadhan@gmail.com
- hanan.khalil80@gmail.com

**Invite link** (only works for the emails above):
https://play.google.com/apps/internaltest/4700286163834451471

Once Google approves the review, testers install PHVD from Play like a normal app,
under the real name (no more "unreviewed" placeholder).

## The road to the public Play Store — what's left

1. **Google reviews the submission** (≤7 days). You'll get an email.
2. **Closed test: 12+ testers opted in for 14 continuous days.** You have 4 — add
   ~8 more emails and I'll put them on the list. The 14-day clock needs 12+ enrolled.
3. **Apply for production access** — Google reviews the account.
4. **Promote to Production** → public on the Play Store.

Steps 2–4 are the remaining gate. The single most useful thing you can do now is
gather ~8 more colleagues' Google-account emails.

## Reminders

- **Keystore** `certs/phvd-release.keystore` is your *upload* key (Play App Signing
  is on). Lose it and you can reset it from Play Console — you won't lose the listing.
  Still back it up.
- **Clinical logic**: read `src/components/PhvdTab.tsx` lines 53–100 against
  El-Dib (2020) and Brouwer (2012) before real clinicians rely on it. It's your name on it.
