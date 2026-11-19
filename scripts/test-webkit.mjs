// Runs the whole UI script suite on Chromium AND on WebKit (Safari's engine,
// iPhone SE profile) and lists the errors that only happen on WebKit.
//   npm run dev   (in another terminal), then:
//   npm run test:webkit            both engines, report WebKit-only errors
//   npm run test:webkit -- --webkit-only   skip the Chromium run
// Note: Playwright's WebKit is newer than the iPhone's iOS 16.3 WebKit, so the
// build also targets Safari 16.3 (vite.config.ts) and the phone itself logs
// web errors (vantage-tweak: `make weblog`).
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const SUITE = [
  'layout-check',
  'screenshots',
  'shell-screenshots',
  'app-screenshots',
  'kit-screenshots',
  'widget-screenshots',
  'theme-screenshots',
  'pack-screenshots',
  'perfection',
];
const webkitOnly = process.argv.includes('--webkit-only');

try {
  await fetch(URL);
} catch {
  console.error(`The dev server is not running at ${URL}. Start it with: npm run dev`);
  process.exit(1);
}

// Network noise that has nothing to do with the engine.
const NOISE = /tile\.|nominatim|open-meteo|Failed to load resource: net::ERR_INTERNET_DISCONNECTED/;
// Make the same error look the same on both engines (ports, line numbers, ids).
const normalize = (text) => text.replace(/:\d+:\d+/g, '').replace(/\d{3,}/g, 'N').replace(/\s+/g, ' ').trim();

function runEngine(engine) {
  rmSync(`screenshots/errors-${engine}.json`, { force: true });
  const failed = [];
  for (const script of SUITE) {
    console.log(`\n=== ${engine}: ${script} ===`);
    const result = spawnSync(process.execPath, [`scripts/${script}.mjs`], {
      stdio: 'inherit',
      env: { ...process.env, BROWSER: engine },
    });
    if (result.status !== 0) failed.push(script);
  }
  let errors = [];
  try { errors = JSON.parse(readFileSync(`screenshots/errors-${engine}.json`, 'utf8')); } catch {}
  return { failed, errors: errors.filter((e) => !NOISE.test(e.text)) };
}

const chrome = webkitOnly ? { failed: [], errors: [] } : runEngine('chromium');
const safari = runEngine('webkit');
const chromeKeys = new Set(chrome.errors.map((e) => normalize(e.text)));
const onlyWebkit = new Map();
for (const e of safari.errors) {
  const key = normalize(e.text);
  if (chromeKeys.has(key)) continue;
  const entry = onlyWebkit.get(key) ?? { ...e, count: 0, scripts: new Set() };
  entry.count++;
  entry.scripts.add(e.script);
  onlyWebkit.set(key, entry);
}

const report = [...onlyWebkit.values()].map((e) => ({ ...e, scripts: [...e.scripts] }));
writeFileSync('screenshots/webkit-only-errors.json', JSON.stringify(report, null, 1));

console.log('\n================ RESULT ================');
if (chrome.failed.length) console.log('Scripts that crashed on Chromium:', chrome.failed.join(', '));
if (safari.failed.length) console.log('Scripts that crashed on WebKit:', safari.failed.join(', '));
console.log(`Errors: Chromium ${chrome.errors.length}, WebKit ${safari.errors.length}, WebKit-only ${report.length}`);
for (const e of report) console.log(` - [${e.kind}] x${e.count} (${e.scripts.join(', ')}) ${e.text.slice(0, 220)}`);
console.log('Full list: screenshots/webkit-only-errors.json');
process.exit(safari.failed.length || report.length ? 1 : 0);
