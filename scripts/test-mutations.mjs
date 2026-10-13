import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const source=readFileSync('src/lib/risk.ts','utf8');
const fixtures=JSON.parse(readFileSync('scripts/fixtures/vi-spreadsheet.json','utf8'))[1].rows;
const mutations=[
  ['Wrong VI curve',s=>s.replace('0.642056 + 0.424486 * pma - 0.002409 * pma * pma','0.28 * pma + 2.6')],
  ['Red OR instead of AND',s=>s.replace('vi > p97 + 4 && ahw > 10','vi > p97 + 4 || ahw > 10')],
  ['Yellow OR instead of AND',s=>s.replace('vi > p97 && ahw > 6','vi > p97 || ahw > 6')],
  ['Wrong +4 threshold',s=>s.replace('vi > p97 + 4 &&','vi > p97 + 3.9 &&')],
  ['Inclusive red VI cutoff',s=>s.replace('vi > p97 + 4 &&','vi >= p97 + 4 &&')],
  ['Inclusive red AHW cutoff',s=>s.replace('&& ahw > 10','&& ahw >= 10')],
  ['Inclusive yellow AHW cutoff',s=>s.replace('&& ahw > 6','&& ahw >= 6')],
  ['Green OR instead of AND',s=>s.replace('vi <= p97 && ahw <= 6','vi <= p97 || ahw <= 6')],
  ['Clinical signs ignored',s=>s.replace("if (reasons.length)","if (false)")],
];
for(const [name,mutate] of mutations) {
  const changed=mutate(source);assert.notEqual(changed,source,name);
  const js=ts.transpileModule(changed,{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
  const mod=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  let detected=false;
  for(const [pma,p] of fixtures.filter(row=>row[0]<=42)) {
    if(Math.abs(mod.getVIP97(pma)-p)>1e-10){detected=true;break;}
    const baseline=source; // Expected bands are assigned from the supplied workbook.
    for(const [vi,band] of [[p-.1,0],[p,0],[p+.1,1],[p+3.95,1],[p+4,1],[p+4.1,2]]) for(const ahw of [3,6,7,10,11]) {
      const expected=[['Green','Unclassified','Unclassified'],['Unclassified','Yellow','Yellow'],['Unclassified','Yellow','Red']][band][ahw<=6?0:ahw<=10?1:2];
      const m={pma,viLeft:vi,viRight:vi,ahwLeft:ahw,ahwRight:ahw,clinical:{hcGrowth:false,sutures:false,fontanelle:false}};
      if(mod.getRiskZone(m).zone!==expected)detected=true;
      if(mod.getRiskZone({...m,clinical:{...m.clinical,sutures:true}}).zone!=='Red')detected=true;
    }
  }
  assert.ok(detected,`Tests failed to detect mutation: ${name}`);
}
console.log(`${mutations.length} intentional calculation defects detected by independent source cases`);
