// Every widget in the widget gallery, category by category, at 375 x 667,
// plus a home page full of new widgets. Then one sheet.
//   npm run dev, then: npm run screenshots:widgets (optionally a theme id)
import { mkdirSync, readFileSync } from 'node:fs';
import { browserType } from './_browser.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = 'screenshots/widgets/';
const theme = process.argv[2] ?? 'midnight';
const LIGHT = ['paper', 'sand', 'sky', 'blossom', 'matcha'];
mkdirSync(OUT, { recursive: true });

const browser = await browser_launch();
async function browser_launch() { return browserType.launch(); }
const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
await context.addInitScript((settings) => {
  if (sessionStorage.getItem('seeded')) return;
  localStorage.clear();
  localStorage.setItem('vantage.settings.v1', JSON.stringify(settings));
  sessionStorage.setItem('seeded', '1');
}, LIGHT.includes(theme) ? { lightTheme: theme, appearance: 'light' } : { darkTheme: theme, appearance: 'dark' });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (error) => problems.push(error.message));
page.on('console', (message) => message.type() === 'error' && problems.push(message.text()));
const run = (action, params = {}) => page.evaluate(([a, p]) => window.vantage.runAction(a, p), [action, params]);
const wait = (ms) => page.waitForTimeout(ms);
const shots = [];
const shot = async (name) => {
  const path = `${OUT}${theme}-${name}.png`;
  await page.screenshot({ path });
  shots.push(path);
};

await page.goto(URL);
await wait(3600);
await run('shell.unlock');
await wait(700);

// Edit mode -> Add widget -> each category
const box = await page.locator('[data-item-id]').first().boundingBox();
await page.mouse.move(box.x + 20, box.y + 20);
await page.mouse.down();
await wait(900);
await page.mouse.up();
await wait(500);
await page.getByText('Edit home screen').click(); // holding an item opens its menu first
await wait(500);
await page.getByRole('button', { name: 'Add widget' }).click();
await wait(800);
for (const category of ['Time', 'Space', 'Music', 'Games', 'Productivity', 'Info', 'Fun', 'Devices']) {
  await page.getByRole('tab', { name: category }).click({ force: true }); // chips row keeps animating
  await wait(700);
  await shot(`gallery-${category.toLowerCase()}`);
}
await page.getByRole('dialog', { name: 'Add a widget' }).getByRole('button', { name: 'Done' }).click();
await wait(500);

// A page of new widgets
for (const [widgetId, size] of [['solar', '2x2'], ['moon', '2x1'], ['dice', '1x1'], ['coin', '1x1'], ['quote', '4x1'], ['dot-calendar', '2x2'], ['game-snake', '2x2']]) {
  await run('home.addWidget', { widgetId, size, page: 3 });
}
await wait(600);
await page.keyboard.press('Escape');
await page.reload();
await wait(3600);
await run('shell.unlock');
await wait(700);
for (let i = 0; i < 3; i += 1) {
  await page.mouse.move(330, 300);
  await page.mouse.down();
  await page.mouse.move(60, 300, { steps: 8 });
  await page.mouse.up();
  await wait(600);
}
await shot('home-new');

await run('arcade.open', { game: 'snake' });
await wait(900);
await page.mouse.click(187, 380);
await wait(1200);
await shot('arcade-snake');
await run('arcade.open', {});
await wait(700);
await shot('arcade');
await run('arcade.open', { game: 'pet' });
await wait(700);
await shot('arcade-pet');

const sheet = await context.newPage();
await sheet.setViewportSize({ width: 6 * 236 + 16, height: 600 });
await sheet.setContent(`<style>body{margin:0;padding:16px;display:flex;flex-wrap:wrap;gap:16px;background:#20262d}img{width:220px;border-radius:10px}</style>` + shots.map((p) => `<img src="data:image/png;base64,${readFileSync(p).toString('base64')}">`).join(''));
await sheet.screenshot({ path: `${OUT}sheet-${theme}.png`, fullPage: true });
await browser.close();
console.log('saved', `${OUT}sheet-${theme}.png`);
if (problems.length) console.log('Errors:\n - ' + [...new Set(problems)].join('\n - '));
