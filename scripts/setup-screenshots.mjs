// The first-boot setup, every step, as a fresh phone sees it (no other script
// shows it: they all start with setup done).
//   npm run dev, then: node scripts/setup-screenshots.mjs   (BROWSER=webkit for Safari's engine)
import { mkdirSync, readFileSync } from 'node:fs';
import { browserType, ENGINE } from './_browser.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = `screenshots/setup/${ENGINE}/`;
mkdirSync(OUT, { recursive: true });

const browser = await browserType.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
await context.addInitScript(() => {
  if (sessionStorage.getItem('seeded')) return;
  localStorage.clear();
  localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: false, bootAnimation: false }));
  sessionStorage.setItem('seeded', '1');
});
const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const shots = [];
const shot = async (name) => {
  const path = `${OUT}${String(shots.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path });
  shots.push(path);
};

await page.goto(URL);
await wait(2500);
for (let step = 0; step < 7; step++) {
  await shot(`step${step + 1}`);
  const next = page.getByRole('button', { name: /^(Get started|Next|Skip)$/ }).last();
  if (!(await next.count())) break;
  await next.click({ force: true });
  await wait(700);
}

const sheet = await browser.newPage({ viewport: { width: 4 * 200 + 16, height: Math.ceil(shots.length / 4) * 370 + 16 } });
await sheet.setContent(
  `<style>body{margin:0;padding:8px;display:flex;flex-wrap:wrap;gap:8px;background:#20262d}img{width:192px;border-radius:8px}</style>` +
    shots.map((f) => `<img src="data:image/png;base64,${readFileSync(f).toString('base64')}">`).join(''),
);
await sheet.screenshot({ path: `${OUT}sheet.png`, fullPage: true });
console.log('saved', `${OUT}sheet.png`, `(${shots.length} steps)`);
await browser.close();
