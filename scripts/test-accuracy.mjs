import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/lib/risk.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { getVIP97, getRiskZone } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/vi-spreadsheet.json', import.meta.url)));
const clinical = { hcGrowth: false, sutures: false, fontanelle: false };
const make = (pma, vi, ahw, overrides = {}) => ({ pma, viLeft: vi, viRight: vi, ahwLeft: ahw, ahwRight: ahw, clinical, ...overrides });
const counts = { spreadsheet: 0, decimalGrid: 0, boundaries: 0, laterality: 0, invalid: 0, clinical: 0, legacy: 0 };
let maxReferenceError = 0;
for (const book of fixtures) for (const [age, ref, upper] of book.rows) {
  const delta = Math.abs(getVIP97(age) - ref);
  maxReferenceError = Math.max(maxReferenceError, delta);
  assert.ok(delta < 1e-10, `${book.file}, PMA ${age}`);
  assert.ok(Math.abs(getVIP97(age) + 4 - upper) < 1e-10);
  counts.spreadsheet += 2;
}
// Independent integer arithmetic oracle: reference for age (168 + day)/7.
// Coefficients from the authors' Constants column C, evaluated as exact rationals.
const denominator = 49_000_000n;
const oracle = (viBand, ahw) => [
  ['Green', 'Unclassified', 'Unclassified'],
  ['Unclassified', 'Yellow', 'Yellow'],
  ['Unclassified', 'Yellow', 'Red'],
][viBand][ahw <= 6 ? 0 : ahw <= 10 ? 1 : 2];
for (let day = 0; day <= 126; day++) {
  const n = BigInt(168 + day);
  const refNumerator = 642056n * 49n + 424486n * n * 7n - 2409n * n * n;
  const age = 24 + day / 7;
  for (let viTenth = 1; viTenth <= 300; viTenth++) {
    const viNumerator = BigInt(viTenth) * (denominator / 10n);
    const band = viNumerator <= refNumerator ? 0 : viNumerator <= refNumerator + 4n * denominator ? 1 : 2;
    for (let ahwTenth = 1; ahwTenth <= 200; ahwTenth++) {
      assert.equal(getRiskZone(make(age, viTenth / 10, ahwTenth / 10)).zone, oracle(band, ahwTenth / 10));
      counts.decimalGrid++;
    }
  }
  const p = getVIP97(age);
  const viCases = [[p - 1e-9, 0], [p, 0], [p + 1e-9, 1], [p + 4 - 1e-9, 1], [p + 4, 1], [p + 4 + 1e-9, 2]];
  const ahwCases = [6 - 1e-9, 6, 6 + 1e-9, 10 - 1e-9, 10, 10 + 1e-9];
  for (const [vi, band] of viCases) for (const ahw of ahwCases) {
    assert.equal(getRiskZone(make(age, vi, ahw)).zone, oracle(band, ahw)); counts.boundaries++;
    for (let bits = 1; bits <= 7; bits++) {
      const signs = { hcGrowth: !!(bits & 1), sutures: !!(bits & 2), fontanelle: !!(bits & 4) };
      const result = getRiskZone(make(age, vi, ahw, { clinical: signs }));
      assert.equal(result.zone, 'Red');
      assert.equal(result.reasons.length, Object.values(signs).filter(Boolean).length);
      counts.clinical++;
    }
  }
  // Asymmetric sides, crossed maxima, and swapping left/right.
  const vs = [p - .1, p + .1, p + 4.1];
  const ws = [3, 7, 11];
  for (const lvi of vs) for (const rvi of vs) for (const lahw of ws) for (const rahw of ws) {
    const m = make(age, lvi, lahw, { viRight: rvi, ahwRight: rahw });
    const expected = oracle(Math.max(lvi,rvi) <= p ? 0 : Math.max(lvi,rvi) <= p + 4 ? 1 : 2, Math.max(lahw,rahw));
    assert.equal(getRiskZone(m).zone, expected);
    assert.equal(getRiskZone({ ...m, viLeft: rvi, viRight: lvi, ahwLeft: rahw, ahwRight: lahw }).zone, expected);
    counts.laterality += 2;
  }
}
for (const field of ['pma','viLeft','viRight','ahwLeft','ahwRight']) for (const value of [NaN,Infinity,-Infinity,null,undefined,'', '11', -1, 0]) {
  assert.equal(getRiskZone(make(28,11,7,{ [field]: value })).zone,'Unclassified'); counts.invalid++;
}
for (const pma of [23.999,42.001]) { assert.equal(getRiskZone(make(pma,11,7)).zone,'Unclassified'); counts.invalid++; }
for (const tod of [0,25,26,100,NaN,Infinity,null]) for (const [vi,ahw,expected] of [[9,3,'Green'],[11,7,'Yellow'],[15,11,'Red']]) {
  assert.equal(getRiskZone(make(28,vi,ahw,{todLeft:tod,todRight:tod,ri:1.5})).zone,expected); counts.legacy++;
}
const result = { counts, total: Object.values(counts).reduce((a,b)=>a+b,0), maxReferenceError };
writeFileSync(new URL('../docs/accuracy-results.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
