// Puts the screenshots side by side on a few "contact sheets", so all
// screens can be compared at a glance. Run after: npm run screenshots
//   node scripts/contact-sheet.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const DIR = fileURLToPath(new URL('../screenshots/', import.meta.url));
const PER_SHEET = 6;
const SHOT_WIDTH = 300; // each screen is shown this wide

const shots = readdirSync(DIR)
  .filter((name) => /^\d\d-.*\.png$/.test(name))
  .sort();

const browser = await chromium.launch();
const page = await browser.newPage();

for (let start = 0; start < shots.length; start += PER_SHEET) {
  const group = shots.slice(start, start + PER_SHEET);
  const figures = group
    .map((name) => {
      const data = readFileSync(DIR + name).toString('base64');
      return `<figure><img src="data:image/png;base64,${data}" width="${SHOT_WIDTH}"><figcaption>${name.replace('.png', '')}</figcaption></figure>`;
    })
    .join('');
  await page.setViewportSize({ width: group.length * (SHOT_WIDTH + 16) + 16, height: 600 });
  await page.setContent(`
    <style>
      body { margin: 0; padding: 16px; display: flex; gap: 16px; background: #20262d; font: 13px system-ui; color: #cfd6dd; }
      figure { margin: 0; }
      img { display: block; border-radius: 12px; }
      figcaption { margin-top: 8px; text-align: center; }
    </style>${figures}`);
  const sheet = `sheet-${start / PER_SHEET + 1}.png`;
  await page.screenshot({ path: DIR + sheet, fullPage: true });
  console.log('saved', `screenshots/${sheet}`);
}

await browser.close();
