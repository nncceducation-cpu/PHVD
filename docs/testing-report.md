# PHVD accuracy and bug audit

Audit date: 13 October 2026. Target: current PHVD repository source corresponding to https://nncceducation-cpu.github.io/PHVD/app/. The corrected calculator has been pushed and deployed. Native 1.6.1 releases are being staged separately; build and store status is recorded in the release folder.

## Calculation accuracy

The VI/AHW rules follow the user's Figure 5 image from El-Dib et al. (2020), with TOD omitted. Red criteria take priority. All inequalities are evaluated with unrounded values; labels use “97th %” as requested. The authors' supplementary spreadsheets label the same polynomial curve p97.5.

| Test coverage | Checks | Result |
| --- | ---: | --- |
| Cached VI and VI + 4 mm values from both supplied spreadsheets | 326 | Exact match; maximum absolute error 0 mm |
| Every gestational day from 24–42 weeks, VI 0.1–30 mm and AHW 0.1–20 mm in 0.1 mm increments | 7,620,000 | Pass |
| Exact boundaries and values 0.000000001 mm below/above cutoffs | 4,572 | Pass |
| Asymmetric measurements, crossed maxima, left/right swaps | 20,574 | Pass |
| All seven nonempty clinical-sign combinations at the boundary cases | 32,004 | Pass |
| Missing, nonnumeric, nonfinite, negative, zero and out-of-range inputs | 47 | Pass |
| Legacy TOD values and recorded RI do not change the risk category | 21 | Pass |
| Focused regression, history/validation and OCR parser checks | 67 | Pass |
| Intentional wrong-curve, wrong-AND/OR, wrong-cutoff and missing-clinical-sign mutations | 9 | All detected |

The main accuracy suite totals 7,677,544 checks. Its decimal-grid oracle uses independent integer/rational arithmetic derived from the spreadsheet coefficients, rather than calling the implementation to produce expected results. Fixture values are extracted from the original workbooks' cached Constants cells; the fixture files contain no patient data.

## Bugs repaired

- Damaged or unexpected saved-history JSON and denied storage no longer crash the calculator. Startup does not overwrite stored history. Invalid rows are omitted with a visible notice; valid rows are retained.
- Full or blocked storage produces a visible warning while the in-memory calculator remains available.
- The assessment date uses the local calendar date, including near UTC midnight.
- Decimal commas are accepted in all four languages. “11,5” is assessed, exported and saved as 11.5, rather than 115. Invalid numeric suffixes are rejected instead of partially parsed.
- Language switching uses the current React text, preventing stale risk labels. New criteria, management guidance, review messages and exported captions are translated in French, Spanish and Portuguese.
- Graphs sort measurements by age/date, handle larger values without clipping, include numerical axes, and plot the VI curve at daily intervals.
- Saving retains the assessment for immediate export and prevents an unchanged assessment from being saved twice. Clearing history re-enables saving.
- Clinical-sign checkboxes support keyboard focus and Space activation; numeric fields have accessible labels.
- OCR parsing retains equal left/right measurements, preserves decimal precision, and rejects malformed/unit-suffix values. These are parser tests, not validation of camera recognition.
- Offline installation caches the initial script and stylesheet, preserves unrelated applications' caches, and does not return HTML for a missing JavaScript asset.

## Browser and production verification

The 22-scenario browser suite covers storage failures, malformed and legacy history, persistence and reload, invalid saves, clinical signs, keyboard access, local dates, decimal-comma entry, all four language versions, phone/tablet/desktop widths (320, 375, 768 and 1200 px), translated risk strings, and PNG exports in all four languages. It also checks that the selected management plan follows measurement changes and clinical signs, while all three reference cards follow the assessment and graphs at the bottom. Edge and WebKit production runs must have 22/22 passing results in their accompanying JSON files. First-install offline use and cache isolation have six passing production checks. TypeScript and the production build pass.

## Limits and decisions needing clinical awareness

This is a broad finite software audit, not proof that every possible input, device or clinical situation is correct. Firefox could not launch because its Windows side-by-side runtime configuration is missing. Native Android/iOS camera capture, ML Kit recognition and saving to Photos require device testing. WebKit on Windows is not a test on an actual iPhone or Mac Safari.

The existing maximum-of-left/right rule is retained and explicitly tested, including crossed maxima. The paper does not explicitly define a left/right aggregation algorithm. Both sides must have positive measurements before a measurement-based zone is assigned. Clinical signs override incomplete measurements. Discordant VI/AHW pairs are left unclassified with a review message; this is not a fourth risk zone. Removing TOD intentionally omits the paper's alternative TOD pathway. Clinical validation of these design decisions remains separate from the software tests.
