// Host mode with the phone's REAL apps, on the laptop: a stand-in
// window.vantageNative answers with scripts/fixtures/phone-apps.json (the 43
// apps read from the iPhone: names, icons, badges, sources). Saves every home
// page, the App Library and a search to screenshots/host-apps/<engine>/.
//   npm run dev, then: node scripts/host-apps-screenshots.mjs   (BROWSER=webkit too)
import { mkdirSync, readFileSync } from 'node:fs';
import { browserType, ENGINE } from './_browser.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
// ICONS=tinted or ICONS=glyph to check the icon packs with the real apps
const ICONS = process.env.ICONS ?? '';
const OUT = `screenshots/host-apps/${ENGINE}${ICONS ? `-${ICONS}` : ''}/`;
mkdirSync(OUT, { recursive: true });
const apps = JSON.parse(readFileSync(new globalThis.URL('./fixtures/phone-apps.json', import.meta.url), 'utf8'));

const browser = await browserType.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 667 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 VantageOSHost/0.3.0',
});
await context.addInitScript(({ list, icons }) => {
  if (!sessionStorage.getItem('seeded')) {
    localStorage.clear();
    localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false, ...(icons === 'tinted' ? { iconStyle: 'tinted' } : icons ? { iconPack: icons } : {}) }));
    sessionStorage.setItem('seeded', '1');
  }
  const opened = [];
  window.__opened = opened;
  window.vantageNative = {
    version: '0.3.0',
    iosVersion: '16.3',
    isHosted: () => Promise.resolve(true),
    getInfo: () => Promise.resolve({ hosted: true, version: '0.3.0', iosVersion: '16.3', model: 'iPhone12,8' }),
    listApps: () => Promise.resolve(list),
    getBadges: () => Promise.resolve(Object.fromEntries(list.filter((a) => a.badge).map((a) => [a.bundleId, a.badge]))),
    openApp: (id) => (opened.push(id), Promise.resolve()),
    getBattery: () => Promise.resolve({ level: 0.83, charging: false }),
    getBrightness: () => Promise.resolve(0.5),
    setBrightness: () => Promise.resolve(),
    setFlashlight: () => Promise.resolve(),
    onVolumeChord: () => Promise.resolve(() => {}),
  };
}, { list: apps, icons: ICONS });

const page = await context.newPage();
const problems = [];
page.on('pageerror', (error) => problems.push(error.message));
const wait = (ms) => page.waitForTimeout(ms);
const go = (route) => page.evaluate((r) => window.vantageGo(r), route);
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` });

await page.goto(URL);
await wait(3000);
// The real list arrives a moment after start: reload once so the first layout is built with it.
await page.reload();
await wait(3000);
for (let n = 1; n <= 5; n++) {
  await go(`home/${n}`);
  await wait(700);
  await shot(`home-${n}`);
}
// The App Library is the page after the last one
await go('home/9');
await wait(800);
await shot('library');
await page.locator('input[aria-label="Search all apps"]').fill('s');
await wait(400);
await shot('library-search');

// Tapping a real app opens it for real (through the bridge)
await page.locator('input[aria-label="Search all apps"]').fill('Safari');
await wait(300);
await page.getByRole('button', { name: 'Safari' }).first().click();
await wait(300);
const opened = await page.evaluate(() => window.__opened);
console.log('opened through the bridge:', opened.join(', ') || 'nothing');
if (!opened.includes('com.apple.mobilesafari')) problems.push('tapping Safari did not open the real app');

await browser.close();
console.log(`saved ${OUT}`);
if (problems.length) {
  console.log('Problems:\n - ' + problems.join('\n - '));
  process.exit(1);
}
