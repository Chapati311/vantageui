// The Vantage keyboard: opens on a field, types with its own keys, in every style.
import { mkdirSync } from 'node:fs';
import { browserType } from './_browser.mjs';
mkdirSync('screenshots/keyboard', { recursive: true });
const browser = await browserType.launch();
const results = [];
for (const style of ['theme', 'terminal', 'pixel', 'glass']) {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await context.addInitScript((s) => localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false, keyboardStyle: s, ...(s === 'terminal' ? { mode: 'hacker' } : {}) })), style);
  const page = await context.newPage();
  await page.goto(process.env.APP_URL ?? 'http://localhost:5173'); await page.waitForTimeout(2500);
  await page.evaluate(() => window.vantageGo('unlock')); await page.waitForTimeout(800);
  await page.evaluate(() => window.vantageGo('customise/keyboard')); await page.waitForTimeout(1200);
  await page.getByLabel('Try the keyboard').tap(); await page.waitForTimeout(600);
  for (const k of ['h', 'i', 'Space', 'v', 'a', 'n', 't', 'a', 'g', 'e']) {
    await page.getByRole('group', { name: 'Vantage keyboard' }).getByRole('button', { name: new RegExp(`^${k}$`, 'i') }).dispatchEvent('pointerdown');
    await page.waitForTimeout(40);
  }
  const value = await page.getByLabel('Try the keyboard').inputValue();
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  await page.screenshot({ path: `screenshots/keyboard/${style}.png` });
  results.push({ style, value, focused });
  await context.close();
}
console.log(JSON.stringify(results));
await browser.close();
