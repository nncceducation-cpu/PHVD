# VI/AHW risk-zone correction

Source: El-Dib et al., J Pediatr. 2020;226:16–27.e3, Figure 5 (page 24 of nihms-1674661.pdf), and the supplied supplementary spreadsheets:

- https://drive.google.com/file/d/1xAHNEeGCZMjgffskVMpXMOqn2DWXq6dT/view (24–42 weeks)
- https://drive.google.com/file/d/1EiQ7wUgyhOtdqBbiZlgU-cA8lL_HQ6P_/view (24–29 weeks)

Both spreadsheets use `0.642056 + 0.424486 * PMA - 0.002409 * PMA²` for VI in Constants column C (labelled p97.5). Figure 5 calls this reference the 97th percentile. Calculations use unrounded values, with PMA expressed in decimal weeks.

This requested version excludes TOD from inputs, export and classification. Legacy TOD values do not affect results. It implements the VI/AHW branch of Figure 5, not its complete TOD-inclusive pathway.

- Green: VI ≤ 97th % AND AHW ≤ 6 mm, with no listed clinical signs.
- Yellow: VI > 97th % AND AHW > 6 mm, unless red criteria apply.
- Red: VI > 97th % + 4 mm AND AHW > 10 mm, OR any listed clinical sign.

The existing maximum-of-left/right aggregation is retained. Figure 5 does not explicitly classify discordant VI/AHW combinations. These display a neutral review message rather than an invented risk category. Both sides must have positive finite measurements and PMA must be within 24–42 weeks; clinical signs still trigger red even with incomplete measurements.

The VI and AHW graph colors are individual measurement bands from Figure 4; they are not an overall clinical classification. This distinction is displayed beside the graphs.

Validation and limitations are recorded in [testing-report.md](testing-report.md). Run `node scripts/test-accuracy.mjs`, `node scripts/test-risk.mjs`, `node scripts/test-history.mjs`, `node scripts/test-scan.mjs`, and `node scripts/test-mutations.mjs` for automated logic checks. Run `node scripts/test-browser-audit.mjs` for the self-contained Edge browser suite. Set `PHVD_BROWSER=webkit` for WebKit, or `PHVD_PRODUCTION=true` after building to test the production bundle. Build with `pnpm build`; run `node scripts/test-offline.mjs` after building for the offline suite. Firefox requires a working host runtime.
