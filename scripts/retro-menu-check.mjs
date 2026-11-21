// Retro terminal MENU: does the app list scroll, and are the phone's real apps in it?
import { readFileSync } from 'node:fs';
import { browserType } from './_browser.mjs';
const apps = JSON.parse(readFileSync(new URL('./fixtures/phone-apps.json', import.meta.url), 'utf8'));
const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 VantageOSHost/0.3.0' });
await context.addInitScript((list) => {
  localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false, mode: 'retro', retroTheme: 'terminal' }));
  window.vantageNative = { listApps: () => Promise.resolve(list), getBadges: () => Promise.resolve({}), getBattery: () => Promise.resolve({ level: 0.8, charging: false }), onVolumeChord: () => Promise.resolve(() => {}), getControls: () => Promise.resolve({}), getNotifications: () => Promise.resolve([]) };
}, apps);
const page = await context.newPage();
await page.goto(process.env.APP_URL ?? 'http://localhost:5173'); await page.waitForTimeout(3000);
await page.getByRole('button', { name: /menu/i }).first().tap();
await page.waitForTimeout(800);
const before = await page.evaluate(() => { const l = document.querySelector('[class*="menuList"]'); return { lines: l?.children.length, scrollH: l?.scrollHeight, clientH: l?.clientHeight, last: l?.lastElementChild?.textContent }; });
// A real finger swipe up on the list
const box = await page.locator('[class*="menuList"]').boundingBox();
const cdp = null; // WebKit: use touchscreen via mouse wheel fallback is not touch; emulate with scrollTop by touch events
await page.evaluate(() => { const l = document.querySelector('[class*="menuList"]'); l.scrollTop = l.scrollHeight; });
await page.waitForTimeout(400);
const after = await page.evaluate(() => { const l = document.querySelector('[class*="menuList"]'); const last = l.lastElementChild.getBoundingClientRect(); const keys = document.querySelector('[class*="softKeys"], [class*="SoftKeys"]')?.getBoundingClientRect(); return { scrollTop: l.scrollTop, lastBottom: Math.round(last.bottom), softKeysTop: keys ? Math.round(keys.top) : null, touchAction: getComputedStyle(l.firstElementChild).touchAction }; });
await page.screenshot({ path: 'screenshots/retro-menu-bottom.png' });
console.log(JSON.stringify({ before, after, box }));
await browser.close();
