import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/lib/scan.ts',import.meta.url),'utf8').split('export function parseNumbers')[1];
const js=ts.transpileModule('export function parseNumbers'+source,{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {parseNumbers}=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const cases=[
  ['1 d1 2.26 cm 2 d1 1.73 cm',[22.6,17.3]],
  ['1 d1 2.26 cm 2 d1 2.26 cm',[22.6,22.6]],
  ['2,26 cm 6,2 mm',[22.6,6.2]],
  ['2.265 cm 2.034cm',[22.65,20.34]],
  ['28/07/2026 13:06:33 AO 50% MI 0.7 TI 0.2 7 mm',[7]],
  ['1001cm 1234cm 100cm',[]],
  ['7mm2 2cm3 -2cm',[]],
  ['1e3cm',[]],
  ['none',[]],
  ['7MM 1CM',[7,10]],
  ['RI: 0.75 7mm',[7,.75]],
];
for(const [text,values] of cases) assert.deepEqual(parseNumbers(text).map(x=>x.valueMm),values,text);
assert.deepEqual(parseNumbers('2.26cm 2.26cm').map(x=>x.seq),[1,2]);
assert.equal(new Set(parseNumbers('2.26cm 2.26cm').map(x=>x.id)).size,2);
console.log(`${cases.length+2} OCR parser checks passed`);
