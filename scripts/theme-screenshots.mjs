// Takes screenshots of every theme preset at 375 x 667: lock screen, home
// screen, the Clock app and the Settings app. Then puts each theme's four
// pictures side by side on one sheet.
//
//   1. start the app:        npm run dev
//   2. in a second terminal: npm run screenshots:themes
//      (or only some themes: npm run screenshots:themes -- midnight paper nokia)
//      (a mode too: npm run screenshots:themes -- midnight:focus midnight:winddown)
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { browserType } from './_browser.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = fileURLToPath(new globalThis.URL('../screenshots/themes/', import.meta.url));

const ALL = {
  dark: ['midnight', 'ocean', 'aurora', 'mono', 'sunset', 'ember', 'forest', 'nebula', 'arctic', 'volt'],
  light: ['paper', 'sand', 'sky', 'blossom', 'matcha'],
  retro: ['nokia', 'gameboy', 'amber', 'terminal', 'casio', 'desktop'],
};
const groupOf = (id) => Object.keys(ALL).find((group) => ALL[group].includes(id));
const wanted = process.argv.slice(2);
const themes = wanted.length ? wanted : Object.values(ALL).flat();

/** The saved settings that make a theme (and optionally a mode, after a colon) active. */
function settingsFor(name) {
  const [id, mode] = name.split(':');
  const group = groupOf(id);
  const base = group === 'light' ? { lightTheme: id, appearance: 'light' } : { darkTheme: id, appearance: 'dark' };
  if (mode === 'focus') return { ...base, mode: 'focus' };
  // Wind Down that started 11 minutes ago, so it is fully dimmed
  if (mode === 'winddown') return { ...base, mode: 'winddown', windDownSince: Date.now() - 11 * 60_000 };
  if (group === 'retro') return { retroTheme: id, mode: 'retro' };
  if (group === 'light') return { lightTheme: id, appearance: 'light' };
  return { darkTheme: id, appearance: 'dark' };
}

mkdirSync(OUT, { recursive: true });
const browser = await browserType.launch();
const problems = [];

for (const id of themes) {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
  await context.addInitScript((settings) => {
    // Only on the very first load of this context
    if (!sessionStorage.getItem('seeded')) {
      localStorage.clear();
      localStorage.setItem('vantage.settings.v1', JSON.stringify(settings));
      sessionStorage.setItem('seeded', '1');
    }
  }, settingsFor(id));
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`${id}: ${error.message}`));
  const wait = (ms) => page.waitForTimeout(ms);
  const shot = (name) => page.screenshot({ path: `${OUT}${id.replace(":", "-")}-${name}.png` });

  await page.goto(URL);
  await wait(3600); // boot animation
  await shot('1-lock');

  // Unlock: modern themes swipe up, retro themes press their "Unlock" / "OK" key
  if (groupOf(id.split(':')[0]) === 'retro') {
    await page.getByRole('button', { name: /^(\[UNLOCK\]|Unlock|OK)$/ }).click();
  } else {
    await page.mouse.move(187, 600);
    await page.mouse.down();
    for (let y = 600; y >= 150; y -= 30) {
      await page.mouse.move(187, y);
      await wait(10);
    }
    await page.mouse.up();
  }
  await wait(1800); // springs settle, weather loads
  await shot('2-home');

  await page.evaluate(() => window.vantage.runAction('app.open', { appId: 'clock' }));
  await wait(900);
  await shot('3-clock');
  await page.evaluate(() => window.vantage.runAction('app.close', {}));
  await wait(300);
  await page.evaluate(() => window.vantage.runAction('app.open', { appId: 'settings' }));
  await wait(900);
  await shot('4-settings');

  // Put the four side by side on one sheet
  const sheet = await context.newPage();
  await sheet.setViewportSize({ width: 4 * 316 + 16, height: 600 });
  const images = ['1-lock', '2-home', '3-clock', '4-settings']
    .map((name) => `<img src="data:image/png;base64,${readFileSync(`${OUT}${id.replace(":", "-")}-${name}.png`).toString('base64')}">`)
    .join('');
  await sheet.setContent(`<style>
      body { margin: 0; padding: 16px; display: flex; gap: 16px; background: #20262d; }
      img { width: 300px; border-radius: 12px; }
    </style>${images}`);
  await sheet.screenshot({ path: `${OUT}sheet-${id.replace(":", "-")}.png`, fullPage: true });
  console.log('saved', `screenshots/themes/sheet-${id.replace(":", "-")}.png`);
  await context.close();
}

await browser.close();
if (problems.length) {
  console.log('\nErrors on the page:');
  for (const problem of problems) console.log(' -', problem);
}
