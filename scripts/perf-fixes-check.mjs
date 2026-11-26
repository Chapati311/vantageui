// The speed fixes keep everything working: home hides under an open app and
// returns on close; the lock screen and control panel are switched off while
// hidden and still open.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const apps = JSON.parse(readFileSync(new URL('./fixtures/phone-apps.json', import.meta.url), 'utf8'));
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 VantageOSHost/0.3.0' });
await c.addInitScript((list) => {
  if (!sessionStorage.getItem('s')) { localStorage.clear(); localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false })); sessionStorage.setItem('s', '1'); }
  window.vantageNative = { listApps: () => Promise.resolve(list), getBadges: () => Promise.resolve({}), getBattery: () => Promise.resolve({ level: 0.8, charging: false }), onVolumeChord: () => Promise.resolve(() => {}), getControls: () => Promise.resolve({}), getNotifications: () => Promise.resolve([]) };
}, apps);
const p = await c.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(process.env.APP_URL ?? 'http://localhost:4173'); await p.waitForTimeout(2500); await p.reload(); await p.waitForTimeout(2500);
const state = () => p.evaluate(() => {
  const css = (sel, prop) => { const e = document.querySelector(sel); return e ? getComputedStyle(e)[prop] : 'missing'; };
  return `home=${css('[data-home-layer]', 'visibility')} lock=${css('[class*="LockScreen"], [class*="_lock_"]', 'display')} panel=${css('[class*="_panel_1k2oa"], [class*="QuickSettings"] [class*="panel"]', 'display')}`;
});
let fails = 0;
const expect = (label, got, want) => { const ok = got.includes(want); if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${got}`); };
expect('home at rest', await state(), 'home=visible');
expect('lock switched off', await state(), 'lock=none');
expect('panel switched off', await state(), 'panel=none');
await p.evaluate(() => window.vantageGo('app/customise')); await p.waitForTimeout(2500);
expect('app open: home hidden', await state(), 'home=hidden');
await p.evaluate(() => window.dispatchEvent(new Event('vantage:close-app'))); await p.waitForTimeout(150);
expect('closing: home visible at once', await state(), 'home=visible');
await p.waitForTimeout(1200);
await p.evaluate(() => window.vantageGo('app/customise')); await p.waitForTimeout(1500);
// swipe up from the bottom edge: home must show behind the shrinking app
await p.mouse.move(187, 660); await p.mouse.down(); await p.mouse.move(187, 560, { steps: 6 });
expect('swiping app away: home visible', await state(), 'home=visible');
await p.mouse.move(187, 300, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(1200);
expect('back home', await state(), 'home=visible');
await p.evaluate(() => window.vantageGo('controls')); await p.waitForTimeout(900);
expect('control panel opens', await state(), 'panel=flex');
await p.screenshot({ path: 'screenshots/perf-controls.png' });
await p.evaluate(() => window.vantageGo('lock')); await p.waitForTimeout(900);
expect('lock screen shows', await state(), 'lock=block');
await p.screenshot({ path: 'screenshots/perf-lock.png' });
console.log(fails ? `${fails} FAILED` : 'all ok');
await b.close();
