// Screenshots of the component kit test page ("Kit" app) at 375 x 667, in
// Midnight, Paper and Nokia LCD: every tab scrolled top to bottom, both
// sheets and a long-press context menu. Then one sheet image per theme.
//
//   1. start the app:        npm run dev
//   2. in a second terminal: npm run screenshots:kit
//      (or other themes:     npm run screenshots:kit -- ocean gameboy)
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { browserType } from './_browser.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = fileURLToPath(new globalThis.URL('../screenshots/kit/', import.meta.url));
const LIGHT = ['paper', 'sand', 'sky', 'blossom', 'matcha'];
const RETRO = ['nokia', 'gameboy', 'amber', 'terminal', 'casio', 'desktop'];
const themes = process.argv.slice(2).length ? process.argv.slice(2) : ['midnight', 'paper', 'nokia'];

const settingsFor = (id) =>
  RETRO.includes(id)
    ? { retroTheme: id, mode: 'retro' }
    : LIGHT.includes(id)
      ? { lightTheme: id, appearance: 'light' }
      : { darkTheme: id, appearance: 'dark' };

mkdirSync(OUT, { recursive: true });
const browser = await browserType.launch();
const problems = [];

for (const id of themes) {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, hasTouch: false });
  await context.addInitScript((settings) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.clear();
      localStorage.setItem('vantage.settings.v1', JSON.stringify(settings));
      sessionStorage.setItem('seeded', '1');
    }
  }, settingsFor(id));
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`${id}: ${error.message}`));
  page.on('console', (message) => message.type() === 'error' && problems.push(`${id}: ${message.text()}`));
  const wait = (ms) => page.waitForTimeout(ms);
  const shots = [];
  const shot = async (name) => {
    const path = `${OUT}${id}-${name}.png`;
    await page.screenshot({ path });
    shots.push(path);
  };

  await page.goto(URL);
  await wait(3600);
  await page.evaluate(() => window.vantage.runAction('shell.unlock', {}));
  await wait(800);
  await page.evaluate(() => window.vantage.runAction('app.open', { appId: 'kit' }));
  await wait(900);

  for (const tab of ['Lists', 'Controls', 'Overlays', 'States']) {
    await page.getByRole('tab', { name: tab }).click();
    await wait(500);
    // Scroll through the tab one screen at a time
    for (let part = 1; part <= 5; part += 1) {
      await shot(`${tab.toLowerCase()}-${part}`);
      const more = await page.evaluate(() => {
        const body = document.querySelector('[data-app-body]');
        const before = body.scrollTop;
        body.scrollTop += body.clientHeight - 80;
        return body.scrollTop > before;
      });
      if (!more) break;
      await wait(400);
    }
    await page.evaluate(() => (document.querySelector('[data-app-body]').scrollTop = 0));
  }

  // Overlays: both sheets and a context menu
  await page.getByRole('tab', { name: 'Overlays' }).click();
  await wait(400);
  await page.getByRole('button', { name: 'Short sheet' }).click();
  await wait(900);
  await shot('sheet-short');
  await page.keyboard.press('Escape');
  await wait(700);
  await page.getByRole('button', { name: 'With a wheel' }).click();
  await wait(900);
  await shot('sheet-wheel');
  await page.keyboard.press('Escape');
  await wait(700);
  const tile = page.locator('[data-app-body]').getByText('Notes', { exact: true });
  const box = await tile.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await wait(700);
  await page.mouse.up();
  await wait(500);
  await shot('context-menu');

  // One sheet with every picture of this theme
  const sheet = await context.newPage();
  await sheet.setViewportSize({ width: 6 * 236 + 16, height: 600 });
  const images = shots.map((path) => `<img src="data:image/png;base64,${readFileSync(path).toString('base64')}">`).join('');
  await sheet.setContent(`<style>
      body { margin: 0; padding: 16px; display: flex; flex-wrap: wrap; gap: 16px; background: #20262d; }
      img { width: 220px; border-radius: 10px; }
    </style>${images}`);
  await sheet.screenshot({ path: `${OUT}sheet-${id}.png`, fullPage: true });
  console.log('saved', `screenshots/kit/sheet-${id}.png`, `(${shots.length} screens)`);
  await context.close();
}

await browser.close();
if (problems.length) {
  console.log('\nErrors on the page:');
  for (const problem of problems) console.log(' -', problem);
}
