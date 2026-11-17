// Screenshots of the system shell at 375 x 667: lock screen (with a live
// timer and notifications), passcode, home (live pill), notification center,
// control center, app switcher and search. Then one sheet per theme.
//
//   1. start the app:        npm run dev
//   2. in a second terminal: npm run screenshots:shell
//      (or other themes:     npm run screenshots:shell -- ocean gameboy)
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = fileURLToPath(new globalThis.URL('../screenshots/shell/', import.meta.url));
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
const browser = await chromium.launch();
const problems = [];

for (const id of themes) {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
  await context.addInitScript((settings) => {
    if (sessionStorage.getItem('seeded')) return;
    localStorage.clear();
    localStorage.setItem('vantage.settings.v1', JSON.stringify(settings));
    // A 25 minute timer, started 7 minutes ago
    const now = Date.now();
    localStorage.setItem(
      'vantage.clock.v1',
      JSON.stringify({
        tab: 'timer',
        timer: { durationMs: 25 * 60_000, status: 'running', endsAt: now + 18 * 60_000, remainingMs: 18 * 60_000 },
        stopwatch: { running: false, startedAt: 0, elapsedMs: 0, laps: [] },
      }),
    );
    localStorage.setItem(
      'vantage.notifications.v1',
      JSON.stringify([
        { id: 'a', appId: 'clock', title: 'Timer', body: 'Your 5 min timer is done.', at: now - 4 * 60_000 },
        { id: 'b', appId: 'clock', title: 'Timer', body: 'Your 25 min timer is done.', at: now - 3 * 3600_000 },
      ]),
    );
    sessionStorage.setItem('seeded', '1');
  }, settingsFor(id));
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`${id}: ${error.message}`));
  page.on('console', (message) => message.type() === 'error' && problems.push(`${id}: ${message.text()}`));
  const wait = (ms) => page.waitForTimeout(ms);
  const run = (action, params = {}) => page.evaluate(([a, p]) => window.vantage.runAction(a, p), [action, params]);
  const shots = [];
  const shot = async (name) => {
    const path = `${OUT}${id}-${name}.png`;
    await page.screenshot({ path });
    shots.push(path);
  };

  await page.goto(URL);
  await wait(3600);
  await shot('1-lock');

  // Passcode: set one, then unlock asks for it
  await run('passcode.set', { code: '246810' });
  await run('shell.unlock');
  await wait(600);
  await page.keyboard.type('24');
  await wait(200);
  await shot('2-passcode');
  await page.keyboard.type('6810');
  await wait(1200);
  await run('passcode.remove');
  await shot('3-home');

  await run('shell.openNotifications');
  await wait(700);
  await shot('4-notifications');
  await run('shell.closeOverlays');
  await wait(500);

  await run('shell.openControlCenter');
  await wait(700);
  await shot('5-controls');
  await run('shell.closeOverlays');
  await wait(500);

  for (const app of ['weather', 'settings', 'clock']) {
    await run('app.open', { appId: app });
    await wait(700);
  }
  await run('shell.openAppSwitcher');
  await wait(1200);
  await shot('6-switcher');
  await run('shell.closeOverlays');
  await wait(500);

  await run('shell.openSearch');
  await wait(400);
  await page.keyboard.type('re');
  await wait(500);
  await shot('7-search');

  const sheet = await context.newPage();
  await sheet.setViewportSize({ width: 7 * 236 + 16, height: 600 });
  const images = shots.map((path) => `<img src="data:image/png;base64,${readFileSync(path).toString('base64')}">`).join('');
  await sheet.setContent(`<style>
      body { margin: 0; padding: 16px; display: flex; flex-wrap: wrap; gap: 16px; background: #20262d; }
      img { width: 220px; border-radius: 10px; }
    </style>${images}`);
  await sheet.screenshot({ path: `${OUT}sheet-${id}.png`, fullPage: true });
  console.log('saved', `screenshots/shell/sheet-${id}.png`);
  await context.close();
}

await browser.close();
if (problems.length) {
  console.log('\nErrors on the page:');
  for (const problem of problems) console.log(' -', problem);
}
