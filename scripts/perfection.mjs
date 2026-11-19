// The perfection loop's phone user (FINAL_PROMPT.md Part 5): at 375 x 667 it
// boots, unlocks, visits Today and every home page, opens the control
// center, notifications, search, the app switcher, every app, Customise and
// Vantage, and saves a screenshot of each. Then one contact sheet per theme.
//
//   1. start the app:        npm run dev
//   2. in a second terminal: npm run perfection            (all 8 themes)
//                            npm run perfection -- midnight signal   (some)
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { browserType } from './_browser.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = fileURLToPath(new globalThis.URL('../screenshots/perfection/', import.meta.url));
const THEMES = ['midnight', 'paper', 'nokia', 'signal', 'porcelain', 'lacquer', 'reedglass', 'popink'];
const PACKS = new Set(['signal', 'porcelain', 'lacquer', 'reedglass', 'popink']);
const APPS = ['vantage', 'phone', 'messages', 'contacts', 'mail', 'notes', 'clock', 'lockin', 'weather', 'calendar', 'reminders', 'music', 'camera', 'photos', 'maps', 'calculator', 'recorder', 'browser', 'files', 'compass', 'arcade', 'customise', 'settings'];
const themes = process.argv.slice(2).length ? process.argv.slice(2) : THEMES;

mkdirSync(OUT, { recursive: true });
const browser = await browserType.launch();
const problems = [];

for (const theme of themes) {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 1 });
  const base = { bootAnimation: false, setupDone: true, userName: 'Aaryan' };
  const settings =
    theme === 'paper' ? { ...base, lightTheme: 'paper', appearance: 'light' } : theme === 'nokia' ? { ...base, retroTheme: 'nokia', mode: 'retro' } : { ...base, darkTheme: 'midnight', appearance: 'dark' };
  await context.addInitScript((saved) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.clear();
      localStorage.setItem('vantage.settings.v1', JSON.stringify(saved));
      sessionStorage.setItem('seeded', '1');
    }
  }, settings);
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`${theme}: ${error.message}`));
  const wait = (ms) => page.waitForTimeout(ms);
  const shots = [];
  const shot = async (name) => {
    const file = `${OUT}${theme}-${String(shots.length + 1).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: file });
    shots.push({ name, file });
  };
  const act = (id, params = {}) => page.evaluate(([a, p]) => window.vantage.runAction(a, p), [id, params]);
  const swipe = async (fromX, toX, y = 400) => {
    await page.mouse.move(fromX, y);
    await page.mouse.down();
    for (let x = fromX; fromX < toX ? x <= toX : x >= toX; x += fromX < toX ? 30 : -30) {
      await page.mouse.move(x, y);
      await wait(10);
    }
    await page.mouse.up();
    await wait(700);
  };

  await page.goto(URL);
  await wait(1500);
  if (PACKS.has(theme)) {
    await act('theme.applyPack', { id: theme });
    await wait(1200);
  }
  // Something to show: a running timer, two notifications
  await act('notifications.push', { appId: 'clock', title: 'Timer done', body: 'Your 5 minute timer finished.' });
  await act('notifications.push', { appId: 'weather', title: 'Rain at 16:00', body: 'Take an umbrella.' });
  await shot('lock');

  await act('shell.unlock');
  await wait(1500);
  await shot('home-1');
  await swipe(60, 330);
  await shot('today');
  await swipe(330, 40);
  await swipe(330, 40);
  await shot('home-2');
  await swipe(330, 40);
  await shot('home-3');
  await swipe(40, 330);
  await swipe(40, 330);

  for (const [name, open] of [
    ['controls', 'shell.openControlCenter'],
    ['notifications', 'shell.openNotifications'],
    ['search', 'shell.openSearch'],
  ]) {
    await act(open);
    await wait(900);
    if (name === 'search') {
      await page.keyboard.type('12*7');
      await wait(600);
    }
    await shot(name);
    await act('shell.closeOverlays');
    await wait(500);
  }

  for (const app of APPS) {
    await act('app.open', { appId: app });
    await wait(app === 'maps' ? 2500 : 1300);
    await shot(app);
    await act('app.close');
    await wait(450);
  }

  await act('shell.openAppSwitcher');
  await wait(800);
  await shot('switcher');
  await act('shell.closeOverlays');
  await wait(400);
  await act('vantage.summon', {});
  await wait(1400);
  await shot('vantage-summon');
  await context.close();

  // One sheet for this theme: 7 per row
  const sheet = await browser.newPage({ viewport: { width: 7 * 160 + 16, height: Math.ceil(shots.length / 7) * 300 + 16 } });
  const img = (file) => `data:image/png;base64,${readFileSync(file).toString('base64')}`;
  await sheet.setContent(
    `<body style="margin:0;padding:8px;background:#222;font:600 11px system-ui;color:#ccc;display:flex;flex-wrap:wrap;gap:0">${shots
      .map((s) => `<div style="width:160px;height:300px"><img src="${img(s.file)}" style="width:150px;height:267px;border-radius:6px"><div>${s.name}</div></div>`)
      .join('')}</body>`,
  );
  await sheet.screenshot({ path: `${OUT}sheet-${theme}.png`, fullPage: true });
  await sheet.close();
  console.log(`${theme}: ${shots.length} screens`);
}

await browser.close();
console.log(problems.length ? `Page errors:\n${problems.join('\n')}` : 'No page errors.');
