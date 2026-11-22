// Drag an app onto a folder (it goes in) and onto another app (a new folder).
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
await page.goto(process.env.APP_URL ?? 'http://localhost:5173'); await page.waitForTimeout(2500); await page.reload(); await page.waitForTimeout(2500);
await page.evaluate(() => window.vantageGo('home/2')); await page.waitForTimeout(1200);
const center = (sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
const folderSel = '[data-item-id^="folder"]';
const appSel = '[data-item-id^="app:ios:"]';
const folderCount = () => page.evaluate((s) => document.querySelector(s)?.querySelectorAll('[class*="mini"]').length, folderSel);
const before = await folderCount();
const a = await center(appSel);
const appId = await page.evaluate((s) => document.querySelector(s).getAttribute('data-item-id'), appSel);
const f = await center(folderSel);
// Hold -> menu -> Edit home screen, then hold the app again and drag it
await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up();
await page.getByText('Edit home screen').click(); await page.waitForTimeout(800);
await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.waitForTimeout(450);
await page.mouse.move(a.x + 10, a.y + 10, { steps: 4 });
await page.mouse.move(f.x, f.y, { steps: 20 }); await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/folder-hover.png' });
await page.mouse.up(); await page.waitForTimeout(900);
const layout = await page.evaluate(() => Object.entries(localStorage).filter(([k]) => /layout|home/i.test(k)).map(([, v]) => v).join(''));
const inFolder = layout.includes(appId.replace('app:', '')) && !layout.includes(`"id":"${appId}"`);
console.log(JSON.stringify({ appId, folderMinisBefore: before, appStillOnGrid: layout.includes(`"id":"${appId}"`), inFolderJson: inFolder }));
await page.screenshot({ path: 'screenshots/folder-after.png' });
await browser.close();
