// A new version replaced this one's files: opening an app whose code is gone
// must reload onto the new version (not leave a blank screen). Simulated by
// making the app's code fail to load once.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const apps = JSON.parse(readFileSync(new URL('./fixtures/phone-apps.json', import.meta.url), 'utf8'));
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 VantageOSHost/0.3.0' });
await c.addInitScript((list) => {
  if (!localStorage.getItem('vantage.settings.v1')) localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false }));
  window.vantageNative = { listApps: () => Promise.resolve(list), getBadges: () => Promise.resolve({}), getBattery: () => Promise.resolve({ level: 0.8, charging: false }), onVolumeChord: () => Promise.resolve(() => {}), getControls: () => Promise.resolve({}), getNotifications: () => Promise.resolve([]) };
}, apps);
const p = await c.newPage();
let blocked = 0;
let loads = 0;
let armed = false; // blocked from opening the app until the page reloads
await p.route(/assets\/CustomiseApp[^/]*\.js/, (route) => (armed && loads === armedAt ? (blocked++, route.abort()) : route.continue()));
let armedAt = -1;
p.on('load', () => loads++);
p.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 120)));
await p.goto(process.env.APP_URL ?? 'http://localhost:4173');
await p.waitForSelector('[data-item-id]', { timeout: 20000 });
const before = loads;
armed = true;
armedAt = loads;
await p.evaluate(() => window.vantageGo('app/customise'));
await p.waitForTimeout(4000);
const nodes = await p.evaluate(() => document.querySelectorAll('#root *').length);
console.log(`blocked loads: ${blocked}, page reloads: ${loads - before}, elements on screen: ${nodes}, url: ${p.url()}`);
console.log(blocked >= 1 && loads - before >= 1 && nodes > 300 ? 'ok: reloaded onto the new version, Vantage on screen' : 'FAIL');
await p.screenshot({ path: 'screenshots/stale-build.png' });
await b.close();
