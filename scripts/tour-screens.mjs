// Screenshots of a list of routes (host mode, the phone's real apps) for
// reviewing screens side by side. ROUTES="app/clock/alarm customise/themes" node scripts/tour-screens.mjs
import { mkdirSync, readFileSync } from 'node:fs';
import { browserType, ENGINE } from './_browser.mjs';
const URL = process.env.APP_URL ?? 'http://localhost:5173';
const ROUTES = (process.env.ROUTES ?? 'home/1 home/2 home/3 app/clock/alarm app/clock/timer app/clock/world customise customise/themes customise/colors customise/wallpapers').split(/\s+/).filter(Boolean);
const OUT = `screenshots/tour/${ENGINE}/`;
mkdirSync(OUT, { recursive: true });
const apps = JSON.parse(readFileSync(new globalThis.URL('./fixtures/phone-apps.json', import.meta.url), 'utf8'));
const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 VantageOSHost/0.3.0' });
await context.addInitScript(({ list, settings }) => {
  if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false, ...settings })); sessionStorage.setItem('seeded', '1'); }
  window.vantageNative = { listApps: () => Promise.resolve(list), getBadges: () => Promise.resolve({}), getBattery: () => Promise.resolve({ level: 0.8, charging: false }), onVolumeChord: () => Promise.resolve(() => {}), getControls: () => Promise.resolve({ brightness: 0.5, volume: 0.5, wifi: { on: true, network: 'Home' } }), getNotifications: () => Promise.resolve([]) };
}, { list: apps, settings: JSON.parse(process.env.SETTINGS ?? '{}') });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL); await page.waitForTimeout(2500); await page.reload(); await page.waitForTimeout(2500);
const shots = [];
for (const r of ROUTES) {
  await page.evaluate((x) => window.vantageGo(x), r); await page.waitForTimeout(1100);
  const f = `${OUT}${r.replace(/\//g, '-')}.png`; await page.screenshot({ path: f }); shots.push([r, f]);
}
const sheet = await browser.newPage({ viewport: { width: 4 * 200 + 16, height: Math.ceil(shots.length / 4) * 385 + 16 } });
await sheet.setContent(`<style>body{margin:0;padding:8px;display:flex;flex-wrap:wrap;gap:8px;background:#20262d;font:11px sans-serif;color:#ccc}figure{margin:0;width:192px}img{width:192px;border-radius:8px}</style>` + shots.map(([r, f]) => `<figure><img src="data:image/png;base64,${readFileSync(f).toString('base64')}"><figcaption>${r}</figcaption></figure>`).join(''));
await sheet.screenshot({ path: `${OUT}sheet.png`, fullPage: true });
console.log('saved', `${OUT}sheet.png`, errors.length ? `errors: ${errors.join(' | ')}` : '');
await browser.close();
