// Screenshots of every signature theme pack at 375 x 667: lock screen, home
// page 1 and one app (Weather), then one contact sheet with all of them.
//
//   1. start the app:        npm run dev
//   2. in a second terminal: npm run screenshots:packs
//      (or only some packs: npm run screenshots:packs -- signal porcelain)
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { browserType } from './_browser.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = fileURLToPath(new globalThis.URL('../screenshots/packs/', import.meta.url));
const ALL = ['signal', 'obsidian', 'lacquer', 'popink', 'nightreed', 'porcelain', 'reedglass', 'frost', 'notebook', 'gallery'];
const packs = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

mkdirSync(OUT, { recursive: true });
const browser = await browserType.launch();
const problems = [];

for (const id of packs) {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
  await context.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.clear();
      localStorage.setItem('vantage.settings.v1', JSON.stringify({ bootAnimation: false, setupDone: true, userName: 'Aaryan' }));
      sessionStorage.setItem('seeded', '1');
    }
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`${id}: ${error.message}`));
  const wait = (ms) => page.waitForTimeout(ms);
  const shot = (name) => page.screenshot({ path: `${OUT}${id}-${name}.png` });

  await page.goto(URL);
  await wait(1500);
  await page.evaluate((pack) => window.vantage.runAction('theme.applyPack', { id: pack }), id);
  await wait(1800);
  await shot('1-lock');

  await page.evaluate(() => window.vantage.runAction('shell.unlock', {}));
  await wait(2000);
  await shot('2-home');

  await page.evaluate(() => window.vantage.runAction('app.open', { appId: 'weather' }));
  await wait(1200);
  await shot('3-app');
  await context.close();
  console.log(`saved ${id}`);
}

// One sheet: a row per pack (lock, home, app)
const sheet = await browser.newPage({ viewport: { width: 3 * 190 + 160, height: packs.length * 340 } });
const img = (name) => `data:image/png;base64,${readFileSync(`${OUT}${name}.png`).toString('base64')}`;
await sheet.setContent(`<body style="margin:0;background:#222;font:600 14px Inter,system-ui;color:#ddd">${packs
  .map(
    (id) =>
      `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px"><div style="width:140px">${id}</div>${['1-lock', '2-home', '3-app']
        .map((n) => `<img src="${img(`${id}-${n}`)}" style="width:180px;height:320px;border-radius:12px">`)
        .join('')}</div>`,
  )
  .join('')}</body>`);
await sheet.screenshot({ path: `${OUT}packs-sheet.png`, fullPage: true });
await browser.close();
console.log(problems.length ? `Problems:\n${problems.join('\n')}` : 'No page errors.');
