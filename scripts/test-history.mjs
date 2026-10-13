import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/lib/history.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {readHistory,measurementError,localDate}=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
let content=null,writes=0,count=0;
globalThis.localStorage={getItem:()=>content,setItem:()=>{writes++;}};
const row={id:'a',date:'2026-10-13',pma:28,viLeft:11,viRight:10,ahwLeft:7,ahwRight:6,ri:0,clinical:{hcGrowth:false,sutures:false,fontanelle:false},todLeft:100};
for(const value of [null,'','null','{}','42','"x"','[null]','[{}]','{bad']) {
  content=value; const result=readHistory(); assert.deepEqual(result.measurements,[]); count++;
}
content=JSON.stringify([null,{...row,id:'later',pma:30},row,{...row,ri:-1},{...row,date:'2026-02-31'}]);
const result=readHistory();assert.equal(result.measurements.length,2);assert.equal(result.measurements[0].id,'a');assert.ok(!('todLeft' in result.measurements[0]));assert.ok(result.message);count+=4;
assert.equal(writes,0);count++;
for(const [field,value] of [['date',''],['date','2026-02-31'],['date','2025-02-29'],['date','2026-13-01'],['ri',NaN],['ri',1.51],['ri',-1],['pma',NaN],['pma',23.9],['viRight',0]]) {
  assert.ok(measurementError({...row,[field]:value}));count++;
}
for(const value of [0,.75,1.5]) {assert.equal(measurementError({...row,ri:value}),null);count++;}
assert.equal(measurementError({...row,date:'2024-02-29'}),null);count++;
assert.equal(localDate(new Date(2026,9,13,23,30)),'2026-10-13');count++;
globalThis.localStorage.getItem=()=>{throw new Error('blocked');};
assert.ok(readHistory().message);count++;
console.log(`${count} history and validation checks passed`);
