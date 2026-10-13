import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const translationsJs=ts.transpileModule(readFileSync('src/risk-translations.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {riskTranslations}=await import(`data:text/javascript;base64,${Buffer.from(translationsJs).toString('base64')}`);
const production = process.env.PHVD_PRODUCTION === 'true';
const port = production ? '5183' : '5181';
const server = process.env.PHVD_TEST_URL ? null : spawn(process.execPath,['node_modules/vite/bin/vite.js',...(production?['preview']:[]),'--host','127.0.0.1','--port',port,'--strictPort'],{stdio:'ignore',windowsHide:true});
const url = process.env.PHVD_TEST_URL || `http://127.0.0.1:${port}/`;
for(let attempt=0; attempt<60; attempt++) {
  try { if((await fetch(url)).ok) break; } catch {}
  if(attempt===59) {server?.kill(); throw new Error('Local test server did not start');}
  await new Promise(resolve=>setTimeout(resolve,250));
}
const engine = process.env.PHVD_BROWSER || 'edge';
let browser;
try { browser = await ({edge:chromium,firefox,webkit}[engine]).launch({headless:true,...(engine==='edge'?{channel:'msedge'}:{})}); }
catch (error) { server?.kill(); throw error; }
const results = [];
mkdirSync('docs/test-artifacts',{recursive:true});
async function run(name, test) {
  try { await test(); results.push({name,status:'PASS'}); }
  catch (e) { results.push({name,status:'FAIL',error:e.message}); }
}
async function open(options={}) {
  const context = await browser.newContext({ viewport: options.viewport || { width: 1200, height: 900 }, timezoneId: 'America/Edmonton' });
  await context.addInitScript(({ seed, fault }) => {
    localStorage.setItem('phvd-language','en');
    if(seed !== undefined && !localStorage.getItem('phvd-test-seeded')) {
      localStorage.setItem('phvd_data',seed);
      localStorage.setItem('phvd-test-seeded','yes');
    }
    if(fault==='read') Storage.prototype.getItem = () => { throw new DOMException('Denied','SecurityError'); };
    if(fault==='write') Storage.prototype.setItem = () => { throw new DOMException('Full','QuotaExceededError'); };
  },options);
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
  page.setDefaultTimeout(4000);
  if (options.clock) await page.clock.install({time:new Date(options.clock)});
  await page.goto(url);
  const language=page.getByRole('button',{name:'English',exact:true});
  if(await language.isVisible()) await language.click();
  await page.locator('#root button').first().click();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return {context,page,errors};
}
async function fill(page, values=[28,11,11,7,7,.75]) {
  const fields=page.locator('input[data-numeric-input]');
  for(let i=0;i<values.length;i++) await fields.nth(i).fill(String(values[i]));
}
const valid={id:'saved',date:'2026-10-12',pma:28,viLeft:11,viRight:11,ahwLeft:7,ahwRight:7,ri:.75,clinical:{hcGrowth:false,sutures:false,fontanelle:false},todLeft:99,todRight:99};
try {
  for(const seed of ['null','{}','42','"data"','[null]','[{"pma":28}]','{broken']) await run(`Malformed history ${seed}`,async()=>{
    const {context,page,errors}=await open({seed});
    try { assert.equal(await page.locator('input[data-numeric-input]').count(),6); assert.deepEqual(errors,[]); } finally {await context.close();}
  });
  for(const fault of ['read','write']) await run(`Storage ${fault} failure`,async()=>{
    const {context,page,errors}=await open({fault});
    try { await fill(page); await page.getByRole('button',{name:'Save Measurement',exact:true}).click(); assert.deepEqual(errors,[]); } finally {await context.close();}
  });
  await run('Persistence, mixed legacy rows, clear and reload',async()=>{
    const {context,page,errors}=await open({seed:JSON.stringify([valid,null,{pma:'oops'}])});
    try {
      assert.equal(await page.locator('main svg[role=img]:not([aria-hidden=true] svg) circle').count(),2);
      await fill(page);
      await page.getByRole('button',{name:'Save Measurement',exact:true}).click();
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('phvd_data')));
      assert.equal(saved.length,2);
      assert.ok(!('todLeft' in saved[0]));
      await page.reload();
      await page.locator('#root button').first().click();
      assert.equal(await page.locator('main svg[role=img]:not([aria-hidden=true] svg) circle').count(),4);
      await page.getByRole('button',{name:'Clear History',exact:true}).click();
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('phvd_data'))),[]);
      assert.ok(await page.getByRole('button',{name:'Save Measurement',exact:true}).isEnabled());
      assert.deepEqual(errors,[]);
    } finally {await context.close();}
  });
  await run('Local date near UTC midnight',async()=>{
    const {context,page}=await open({clock:'2026-10-14T01:30:00Z'});
    try {assert.equal(await page.locator('input[type=date]').inputValue(),'2026-10-13');} finally {await context.close();}
  });
  await run('Cleared PMA field has no React NaN warnings',async()=>{
    const {context,page,errors}=await open();
    try {await page.locator('input[data-numeric-input]').first().fill(''); assert.deepEqual(errors,[]);} finally {await context.close();}
  });
  await run('Invalid values cannot be saved',async()=>{
    const {context,page,errors}=await open();
    try {
      const alerts=[];page.on('dialog',async dialog=>{alerts.push(dialog.message());await dialog.accept();});
      for(const values of [[23.9,11,11,7,7,.75],[42.1,11,11,7,7,.75],[28,-1,11,7,7,.75],[28,11,11,7,7,1.6]]) {
        await fill(page,values);await page.getByRole('button',{name:'Save Measurement',exact:true}).click();
      }
      await fill(page);await page.locator('input[type=date]').fill('');await page.getByRole('button',{name:'Save Measurement',exact:true}).click();
      assert.equal(alerts.length,5);assert.equal(await page.evaluate(()=>localStorage.getItem('phvd_data')),null);assert.deepEqual(errors,[]);
    }finally{await context.close();}
  });
  await run('Clinical signs override normal measurements and keyboard access',async()=>{
    const {context,page,errors}=await open();
    try {
      await fill(page,[28,9,9,3,3,.75]);
      for(let index=0;index<3;index++) {
        const checkbox=page.getByRole('checkbox').nth(index);
        await checkbox.focus();await page.keyboard.press('Space');assert.equal(await page.locator('[data-risk-zone]').getAttribute('data-risk-zone'),'Red');
        await page.keyboard.press('Space');assert.equal(await page.locator('[data-risk-zone]').getAttribute('data-risk-zone'),'Green');
      }
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  });
  await run('Multilingual decimal-comma entry and invalid numeric text',async()=>{
    const {context,page}=await open();
    try {
      for(const [index,lang] of ['en','fr','es','pt'].entries()) {
        await page.locator(`nav [data-language=${lang}]`).click();
        await fill(page,[28,11,11+index*.1,7,7,.75]);
        const field=page.locator('input[data-numeric-input]').nth(1);await field.fill('');await field.pressSequentially('11,5');
        assert.equal(await page.locator('[aria-hidden=true] tbody tr').first().locator('td').nth(1).innerText(),'11.5');
        assert.equal(await page.locator('[data-risk-zone]').getAttribute('data-risk-zone'),'Yellow');
        await page.locator('main button').filter({has:page.locator('svg.lucide-save')}).click();
        const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('phvd_data')));
        assert.equal(stored.at(-1).viLeft,11.5);
        await fill(page);await field.fill('11.5x');assert.equal(await page.locator('[data-risk-zone]').getAttribute('data-risk-zone'),'Unclassified');
      }
    }finally{await context.close();}
  });
  for(const width of [320,375,768,1200]) await run(`Layout and graphs ${width}px`,async()=>{
    const {context,page,errors}=await open({viewport:{width,height:900}});
    try {
      await fill(page,[28,30,30,20,20,.75]);
      const layout=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(layout.scroll<=layout.width+1,JSON.stringify(layout));
      const graphs=page.locator('main svg[role=img]:not([aria-hidden=true] svg)');
      const data=await graphs.evaluateAll(ss=>ss.filter(s=>s.querySelector('polygon')).map(s=>({box:s.viewBox.baseVal.height,points:[...s.querySelectorAll('circle')].map(c=>Number(c.getAttribute('cy')))})));
      assert.equal(data.length,2);
      assert.ok(data.every(g=>g.points.every(y=>Number.isFinite(y)&&y>=0&&y<=g.box)),'Measurements clipped outside graph');
      await page.screenshot({path:`docs/test-artifacts/layout-${width}.png`,fullPage:true});
      assert.deepEqual(errors,[]);
    } finally {await context.close();}
  });
  await run('Risk labels change through all zones in each language',async()=>{
    const {context,page,errors}=await open();
    try {
      const expected={en:['Low Risk - Observation','Moderate Risk - Evaluation','High Risk - Intervention'],fr:['Risque faible – Observation','Risque modéré – Évaluation','Risque élevé – Intervention'],es:['Riesgo bajo: observación','Riesgo moderado: evaluación','Riesgo alto: intervención'],pt:['Risco baixo: observação','Risco moderado: avaliação','Risco alto: intervenção']};
      for(const lang of ['en','fr','es','pt']) {
        await page.locator(`nav [data-language=${lang}]`).click();
        const titles=[];
        for(const [vi,ahw] of [[9,3],[11,7],[15,11],[9,3]]) {
          await fill(page,[28,vi,vi,ahw,ahw,.75]);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          titles.push(await page.locator('[data-risk-zone]').innerText());
        }
        assert.deepEqual(titles,[...expected[lang],expected[lang][0]]);
        if(lang!=='en') {
          const untranslated=await page.evaluate(keys=>{
            const walker=document.createTreeWalker(document.getElementById('root'),NodeFilter.SHOW_TEXT);
            const found=[];while(walker.nextNode()){
              const text=walker.currentNode.nodeValue.trim().replace(/\s+/g,' ');
              if(keys.includes(text))found.push(text);
            }return found;
          },riskTranslations.map(row=>row[0]));
          assert.deepEqual(untranslated,[],`${lang} untranslated risk strings`);
        }
      }
      assert.deepEqual(errors,[]);
      await page.locator('nav [data-language=en]').click();
      await page.locator('.xl\\:grid-cols-3').screenshot({path:'docs/test-artifacts/stratification.png'});
    } finally {await context.close();}
  });
  await run('Selected management follows measurements; all zones remain at the end',async()=>{
    const {context,page}=await open({viewport:{width:375,height:900}});
    try {
      const plan=page.locator('[data-current-management-zone]');
      const reference=page.locator('[data-risk-zone-reference]');
      for(const lang of ['en','fr','es','pt']) {
        await page.locator(`nav [data-language=${lang}]`).click();
        for(const [vi,ahw,zone] of [[9,3,'Green'],[11,7,'Yellow'],[15,11,'Red'],[9,3,'Green'],[11,3,'Unclassified']]) {
          await fill(page,[28,vi,vi,ahw,ahw,.75]);
          assert.equal(await plan.getAttribute('data-current-management-zone'),zone);
          assert.equal(await plan.locator('.space-y-3 > div').count(),{Green:4,Yellow:6,Red:3,Unclassified:1}[zone]);
          assert.equal(await reference.locator(':scope > div').count(),3);
          if(lang==='en') {
            const text=await plan.innerText();
            assert.equal(text.includes('Observation in NICU'),zone==='Green');
            assert.equal(text.includes('Referral to regional center'),zone==='Yellow');
            assert.equal(text.includes('VP Shunt'),zone==='Red');
          }
        }
        await fill(page,[28,9,9,3,3,.75]);
        await page.getByRole('checkbox').first().focus();await page.keyboard.press('Space');
        assert.equal(await plan.getAttribute('data-current-management-zone'),'Red');
        await page.getByRole('checkbox').first().focus();await page.keyboard.press('Space');
        assert.equal(await plan.getAttribute('data-current-management-zone'),'Green');
      }
      assert.ok(await page.evaluate(()=>{
        const reference=document.querySelector('[data-risk-zone-reference]');
        const graphs=[...document.querySelectorAll('main svg[role=img]')].filter(el=>!el.closest('[aria-hidden=true]'));
        return [document.querySelector('[data-current-management-zone]'),...graphs].every(el=>!!(el.compareDocumentPosition(reference)&Node.DOCUMENT_POSITION_FOLLOWING));
      }));
      const layout=await page.evaluate(()=>[document.documentElement.clientWidth,document.documentElement.scrollWidth]);
      assert.ok(layout[1]<=layout[0]+1);
    }finally{await context.close();}
  });
  await run('Assessment PNG export',async()=>{
    const {context,page,errors}=await open();
    try {
      await fill(page);
      await page.getByRole('button',{name:'Save Measurement',exact:true}).click();
      assert.equal(await page.locator('[data-risk-zone]').getAttribute('data-risk-zone'),'Yellow');
      assert.equal(await page.locator('[aria-hidden=true] tbody tr').first().locator('td').nth(1).innerText(),'11');
      assert.ok(await page.getByRole('button',{name:'Save Measurement',exact:true}).isDisabled());
      const event=page.waitForEvent('download');
      await page.getByRole('button',{name:'Download assessment image',exact:true}).click();
      const download=await event; await download.saveAs('docs/test-artifacts/assessment.png');
      assert.equal(await download.failure(),null); assert.deepEqual(errors,[]);
      for(const lang of ['fr','es','pt']) {
        await page.locator(`nav [data-language=${lang}]`).click();
        const downloaded=page.waitForEvent('download');
        await page.locator('main button').filter({has:page.locator('svg.lucide-image-down')}).click();
        await (await downloaded).saveAs(`docs/test-artifacts/assessment-${lang}.png`);
      }
    } finally {await context.close();}
  });
} finally { await browser.close(); server?.kill(); }
writeFileSync(`docs/browser-results-${engine}${production?'-production':''}.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({name,status,error})=>({name,status,error:error?.slice(0,300)})),null,2));
if(results.some(x=>x.status==='FAIL')) process.exitCode=1;
