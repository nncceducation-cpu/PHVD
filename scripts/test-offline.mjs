import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=createServer(async(req,res)=>{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  try{const bytes=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'}).end(bytes);}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(5182,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
  const context=await browser.newContext();
  await context.addInitScript(()=>localStorage.setItem('phvd-language','en'));
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5182/');
  await page.getByRole('button',{name:'I understand and accept'}).click();
  await page.evaluate(async()=>{
    await caches.open('other-app-cache');await caches.open('phvd-old');
    await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  const keys=await page.evaluate(()=>caches.keys());assert.ok(keys.includes('other-app-cache'));assert.ok(!keys.includes('phvd-old'));
  const requests=await page.evaluate(async()=>{const c=await caches.open('phvd-v3-vi-ahw');return(await c.keys()).map(r=>r.url);});
  assert.ok(requests.some(r=>/\/assets\/index-.*\.js$/.test(r)));assert.ok(requests.some(r=>/\.css$/.test(r)));
  await context.setOffline(true);await page.reload();
  await page.getByRole('button',{name:'I understand and accept'}).click();
  const fields=page.locator('input[data-numeric-input]');for(const [i,v] of [[0,28],[1,11],[2,11],[3,7],[4,7]])await fields.nth(i).fill(String(v));
  await page.getByText('Moderate Risk - Evaluation',{exact:true}).first().waitFor();
  const missing=await page.evaluate(async()=>{const r=await fetch('/assets/missing.js');return {status:r.status,type:r.headers.get('content-type')};});
  assert.equal(missing.status,503);assert.ok(!missing.type.includes('html'));assert.deepEqual(errors,[]);
  await context.close();console.log('6 production offline/cache isolation checks passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
