// Edit mode: drag an app to the right edge (page flips), drop it on an empty spot.
import { readFileSync } from 'node:fs';
import { browserType } from './_browser.mjs';
const apps = JSON.parse(readFileSync(new URL('./fixtures/phone-apps.json', import.meta.url), 'utf8'));
const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 VantageOSHost/0.3.0' });
await context.addInitScript((list) => {
  if (!sessionStorage.getItem('s')) { localStorage.clear(); localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false })); sessionStorage.setItem('s', '1'); }
  window.vantageNative = { listApps: () => Promise.resolve(list), getBadges: () => Promise.resolve({}), getBattery: () => Promise.resolve({ level: 0.8, charging: false }), onVolumeChord: () => Promise.resolve(() => {}), getControls: () => Promise.resolve({}), getNotifications: () => Promise.resolve([]) };
}, apps);
const page = await context.newPage();
page.on('console', (m) => /move|drop/i.test(m.text()) && console.log('console:', m.text()));
await page.goto(process.env.APP_URL ?? 'http://localhost:5173'); await page.waitForTimeout(2500); await page.reload(); await page.waitForTimeout(2500);
await page.evaluate(() => window.vantageGo('home/2')); await page.waitForTimeout(1200);
const sel = '[data-item-id="app:ios:com.apple.mobilesafari"]';
const pos = () => page.evaluate(() => { const raw = Object.entries(localStorage).filter(([k]) => /layout|home/i.test(k)).map(([k, v]) => [k, v]); for (const [, v] of raw) { try { const lay = JSON.parse(v); const list = Array.isArray(lay) ? lay : lay.items ?? lay.layout ?? []; const it = list.find((i) => i.id === 'app:ios:com.apple.mobilesafari'); if (it) return `page ${it.page} col ${it.col} row ${it.row}`; } catch {} } return 'keys: ' + raw.map(([k]) => k).join(','); });
console.log('before', await pos());
const a = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up();
await page.getByText('Edit home screen').click(); await page.waitForTimeout(800);
await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.waitForTimeout(450);
await page.mouse.move(a.x + 20, a.y + 10, { steps: 4 });
await page.mouse.move(368, 300, { steps: 15 }); // right edge: flip to the next page (once)
await page.waitForTimeout(Number(process.env.HOLD ?? 700));
await page.mouse.move(300, 330, { steps: 15 }); // the 3rd row's free end on the next page (it has apps)
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/page-move-hover.png' });
await page.mouse.up(); await page.waitForTimeout(900);
console.log('after', await pos());
await page.screenshot({ path: 'screenshots/page-move-after.png' });
await browser.close();
