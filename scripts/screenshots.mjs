// Takes a screenshot of every main screen at exactly 375 x 667 (iPhone SE)
// and saves them in the "screenshots" folder. This is the "quality check"
// from CLAUDE.md.
//
//   1. start the app:        npm run dev
//   2. in a second terminal: npm run screenshots
//
// It drives a real (invisible) Chrome with Playwright, using the mouse as a finger.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = fileURLToPath(new globalThis.URL('../screenshots/', import.meta.url));
const WIDTH = 375;
const HEIGHT = 667;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2, // sharp, like the phone's screen
});
const page = await context.newPage();
page.on('pageerror', (error) => console.error('Page error:', error.message));

const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => {
  await page.screenshot({ path: `${OUT}${name}.png` });
  console.log('saved', `screenshots/${name}.png`);
};

/** Drags like a finger, in small steps so the app sees real movement. */
const swipe = async (x1, y1, x2, y2, { steps = 12, hold = 0 } = {}) => {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  if (hold) await wait(hold);
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps);
    await wait(12);
  }
  await page.mouse.up();
  await wait(700); // let the spring settle
};

const dock = page.getByRole('navigation', { name: 'Dock' });

/** Opens an app by typing its name into search and pressing Enter. */
const openFromSearch = async (name) => {
  await swipe(187, 250, 187, 400);
  await page.keyboard.type(name);
  await wait(300);
  await page.keyboard.press('Enter');
  await wait(1100);
};

const closeApp = async () => {
  await page.keyboard.press('Escape');
  await wait(900);
};

// Start from a clean slate so the pictures always show the default layout.
await page.goto(URL);
await page.evaluate(() => {
  localStorage.clear();
  indexedDB.deleteDatabase('vantage');
});
await page.goto(URL);

await wait(1200);
await shot('01-boot');
await wait(1800); // boot animation ends

await shot('02-lock');

// Half-way through the unlock swipe (shows the rings spreading)
await page.mouse.move(187, 600);
await page.mouse.down();
for (let y = 600; y >= 380; y -= 20) {
  await page.mouse.move(187, y);
  await wait(12);
}
await shot('03-lock-swiping');
for (let y = 380; y >= 150; y -= 20) {
  await page.mouse.move(187, y);
  await wait(12);
}
await page.mouse.up();
await wait(900);

await wait(1500); // weather has loaded
await shot('04-home-page-1');

await swipe(300, 480, 60, 480);
await shot('05-home-page-2');

await swipe(300, 480, 60, 480);
await shot('06-home-page-3');

await swipe(60, 480, 300, 480);
await swipe(60, 480, 300, 480);

// Edit mode: long-press on empty space
await page.mouse.move(187, 530);
await page.mouse.down();
await wait(700);
await page.mouse.up();
await wait(400);
await shot('07-home-edit-mode');
await page.getByRole('button', { name: 'Done' }).click();
await wait(400);

// Quick settings: swipe down from the top edge
await swipe(187, 14, 187, 220);
await shot('08-quick-settings');
await swipe(60, 330, 60, 120); // drag the panel back up (by its edge, not by the dial)

// Search: swipe down in the middle, then type
await swipe(187, 250, 187, 400);
await page.keyboard.type('c');
await wait(400);
await shot('09-search');
await page.keyboard.press('Escape');
await wait(600);

// An app, opened from the dock
await dock.getByRole('button', { name: 'Clock' }).click();
await wait(900);
await shot('10-clock-timer');
await page.getByRole('tab', { name: 'Stopwatch' }).click();
await page.getByRole('button', { name: 'Start' }).click();
await wait(1300);
await page.getByRole('button', { name: 'Lap' }).click();
await wait(500);
await page.getByRole('button', { name: 'Stop' }).click();
await wait(300);
await shot('11-clock-stopwatch');
await page.getByRole('tab', { name: 'World' }).click();
await wait(300);
await shot('12-clock-world');
await closeApp();

await openFromSearch('weather');
await shot('13-weather');
await closeApp();

await dock.getByRole('button', { name: 'Notes' }).click();
await wait(900);
await shot('14-notes-empty');
await page.getByRole('button', { name: 'New checklist' }).click();
for (const item of ['Milk', 'Bread', 'Coffee']) {
  await page.getByLabel('Add item').fill(item);
  await page.getByLabel('Add item').press('Enter');
}
await page.getByRole('checkbox', { name: 'Milk' }).click();
await wait(300);
await shot('15-notes-checklist');
await page.getByRole('button', { name: 'Back to all notes' }).click();
await wait(300);
await shot('16-notes-list');
await closeApp();

await openFromSearch('settings');
await shot('17-settings');
await closeApp();

await dock.getByRole('button', { name: 'Phone' }).click();
await wait(900);
await shot('18-placeholder-app');

await browser.close();
console.log('Done.');
