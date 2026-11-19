import { readFileSync } from 'node:fs'; import { browserType } from './_browser.mjs';
const theme = process.argv[2] ?? 'midnight';
const b=await browserType.launch(); const c=await b.newContext({viewport:{width:375,height:667},deviceScaleFactor:2});
await c.addInitScript((t)=>{if(sessionStorage.getItem('x'))return;localStorage.clear();if(t==='paper')localStorage.setItem('vantage.settings.v1',JSON.stringify({lightTheme:'paper',appearance:'light'}));sessionStorage.setItem('x','1');},theme);
const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>m.type()==='error'&&errs.push(m.text().slice(0,160)));
const run=(a,x={})=>p.evaluate(([a,x])=>window.vantage.runAction(a,x),[a,x]); const shots=[]; const shot=async n=>{const f=`screenshots/_h-${n}.png`;await p.screenshot({path:f});shots.push(f);};
const swipe=async()=>{await p.mouse.move(330,300);await p.mouse.down();await p.mouse.move(40,300,{steps:8});await p.mouse.up();await p.waitForTimeout(700);};
await p.goto('http://localhost:5173'); await p.waitForTimeout(4000); await run('shell.unlock'); await p.waitForTimeout(900);
await shot('p1'); await swipe(); await shot('p2'); await swipe(); await shot('p3');
// tap the folder on page 3
const folder=await p.locator('[data-item-id="folder:people"]').boundingBox(); await p.mouse.click(folder.x+folder.width/2, folder.y+folder.height/2-8); await p.waitForTimeout(700); await shot('folder'); await p.mouse.click(30,620); await p.waitForTimeout(500);
// back to page 1, long press the music widget
await p.mouse.move(40,300);await p.mouse.down();await p.mouse.move(340,300,{steps:8});await p.mouse.up();await p.waitForTimeout(400);
await p.mouse.move(40,300);await p.mouse.down();await p.mouse.move(340,300,{steps:8});await p.mouse.up();await p.waitForTimeout(700);
const music=await p.locator('[data-item-id="widget:music"]').boundingBox();
await p.mouse.move(music.x+40,music.y+30); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(600); await shot('menu');
await p.mouse.click(30,30); await p.waitForTimeout(500);
// tap the weather widget: app grows out of it
const weather=await p.locator('[data-item-id="widget:weather"]').boundingBox();
await p.mouse.click(weather.x+weather.width/2, weather.y+weather.height/2); await p.waitForTimeout(120); await shot('opening'); await p.waitForTimeout(900); await shot('opened');
const s=await b.newPage({viewport:{width:7*236+16,height:500}}); await s.setContent(`<style>body{margin:0;padding:16px;display:flex;flex-wrap:wrap;gap:16px;background:#20262d}img{width:220px;border-radius:10px}</style>`+shots.map(f=>`<img src="data:image/png;base64,${readFileSync(f).toString('base64')}">`).join('')); await s.screenshot({path:`screenshots/home-${theme}.png`,fullPage:true});
console.log('errors',errs); await b.close();
