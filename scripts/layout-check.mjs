// Automatic layout check for the home screen. For a few screen heights it
// measures every page and fails if:
//   - any item sticks out below the grid (a page overflows),
//   - a page holds more than 7 items,
//   - the page dots are not in their own row between the grid and the dock,
//   - the dock is not fully on screen.
//
//   1. start the app:        npm run dev
//   2. in a second terminal: npm run check:layout
import { chromium } from 'playwright';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
/** iPhone SE, plus a shorter and a taller screen to prove it adapts */
const HEIGHTS = [667, 560, 812];
const WIDTH = 375;
const MAX_ITEMS = 7;

const browser = await chromium.launch();
let failures = 0;

for (const height of HEIGHTS) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height } });
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL);
  await page.waitForTimeout(3200); // boot animation

  const result = await page.evaluate(({ maxItems }) => {
    const box = (el) => el.getBoundingClientRect();
    const grid = box(document.querySelector('[class*="_grid_"]'));
    const dots = box(document.querySelector('[class*="_dots_"]'));
    const dock = box(document.querySelector('nav[aria-label="Dock"]'));
    const items = [...document.querySelectorAll('[data-item-id]')].map((el) => {
      const r = box(el);
      // Pages sit side by side, one screen width apart
      return { id: el.dataset.itemId, page: Math.floor((r.left - grid.left + 1) / window.innerWidth), top: r.top, bottom: r.bottom };
    });
    const problems = [];
    for (const item of items) {
      if (item.bottom > grid.bottom + 0.5) problems.push(`${item.id} on page ${item.page + 1} sticks out ${Math.round(item.bottom - grid.bottom)}px below the grid`);
      if (item.top < grid.top - 0.5) problems.push(`${item.id} starts above the grid`);
    }
    const perPage = {};
    for (const item of items) perPage[item.page] = (perPage[item.page] ?? 0) + 1;
    for (const [page, count] of Object.entries(perPage)) {
      if (count > maxItems) problems.push(`page ${Number(page) + 1} has ${count} items (max ${maxItems})`);
    }
    if (dots.top < grid.bottom - 0.5) problems.push('page dots overlap the grid');
    if (dots.bottom > dock.top + 0.5) problems.push('page dots overlap the dock');
    if (dock.bottom > window.innerHeight + 0.5) problems.push('dock is cut off at the bottom');
    return { pages: Object.keys(perPage).length, perPage, items: items.length, problems };
  }, { maxItems: MAX_ITEMS });

  const status = result.problems.length ? 'FAIL' : 'PASS';
  console.log(`${status}  ${WIDTH}x${height}: ${result.items} items on ${result.pages} pages ${JSON.stringify(result.perPage)}`);
  for (const problem of result.problems) console.log(`      - ${problem}`);
  failures += result.problems.length;
  await page.close();
}

await browser.close();
process.exit(failures ? 1 : 0);
