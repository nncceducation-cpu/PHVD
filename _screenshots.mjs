/**
 * Generates App Store screenshots at exactly 1290 x 2796 (iPhone 6.7").
 * Run via make-screenshots.bat — do not run directly.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const DIST = join(process.cwd(), 'dist');
const OUT = join(process.cwd(), 'store', 'screenshots');
mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const body = await readFile(join(DIST, p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(8099, r));
console.log('  serving dist/ on :8099');

// iPhone 6.7" App Store spec: 1290 x 2796 = 430 x 932 CSS px at 3x
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

const shot = async (name) => {
  await page.screenshot({ path: join(OUT, name) });
  console.log('  captured ' + name);
};

const setRow = async (label, L, R) => {
  const row = page.locator('div.grid.grid-cols-3').filter({ hasText: new RegExp(`^${label}`) }).first();
  await row.locator('input[placeholder="L"]').fill(String(L));
  await row.locator('input[placeholder="R"]').fill(String(R));
};

await page.goto('http://localhost:8099/', { waitUntil: 'networkidle' });

// 1 — the disclaimer gate: the first thing App Review sees
await page.waitForSelector('text=Before you continue');
await shot('1-disclaimer.png');

await page.click('text=I understand and accept');
await page.waitForSelector('text=PHVD Risk Stratification');

// 2 — a low-risk (green) assessment
await setRow('VI', 9.0, 8.6);
await setRow('AHW', 3.0, 2.8);
await setRow('TOD', 18, 17);
await page.waitForTimeout(400);
await shot('2-assessment-low-risk.png');

// 3 — a high-risk (red) assessment: triggers + management plan
await setRow('VI', 16.2, 15.4);
await setRow('AHW', 11.5, 10.8);
await setRow('TOD', 26, 24);
await page.waitForTimeout(400);
await shot('3-assessment-high-risk.png');

// 4 — the trend against the reference curves
await page.click('text=Save Measurement');
await page.waitForTimeout(400);
await page.locator('text=Ventricular Index Trend').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await shot('4-trend-vs-reference.png');

// 5 — the management plan in full
await page.locator('text=Management Plan').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await shot('5-management-plan.png');

await browser.close();
server.close();
console.log('\n  Done. 5 screenshots in store\\screenshots\\ at 1290x2796.');
