import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/lib/risk.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { getVIP97, getRiskZone } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const base = { pma: 28, viLeft: 9, viRight: 9, ahwLeft: 3, ahwRight: 3, clinical: { hcGrowth: false, sutures: false, fontanelle: false } };
const p = getVIP97(28);
const zone = (vi, ahw, extra = {}) => getRiskZone({ ...base, viLeft: vi, viRight: vi, ahwLeft: ahw, ahwRight: ahw, ...extra }).zone;
let count = 0;
const check = (actual, expected) => { assert.equal(actual, expected); count++; };
check(zone(p, 6), 'Green');
check(zone(p + .01, 6.01), 'Yellow');
check(zone(p + 4, 10), 'Yellow');
check(zone(p + 4.01, 10.01), 'Red');
check(zone(p + 4.01, 7), 'Yellow');
check(zone(p + .01, 11), 'Yellow');
check(zone(p - .01, 7), 'Unclassified');
check(zone(p + .01, 6), 'Unclassified');
check(zone(p, 6, { todLeft: 100, todRight: 100 }), 'Green');
for (const key of ['hcGrowth', 'sutures', 'fontanelle']) check(zone(9, 3, { clinical: { ...base.clinical, [key]: true } }), 'Red');
for (const invalid of [0, NaN, -1, Infinity]) check(zone(invalid, 3), 'Unclassified');
for (const pma of [23.9, 42.1, NaN]) check(zone(9, 3, { pma }), 'Unclassified');
check(zone(9, 3, { viRight: NaN }), 'Unclassified');
// Independent expected values from the supplied spreadsheet polynomial.
for (const [age, expected] of [[24,9.442136], [28,10.639008], [40,13.767096], [42,14.220992]]) {
  assert.ok(Math.abs(getVIP97(age) - expected) < 1e-9); count++;
}
console.log(`${count} PHVD regression checks passed`);
