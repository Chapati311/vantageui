// The "press every button" crawler. A random walk through Vantage OS: at each
// step it taps a visible button/tab/switch/link, long-presses, types, scrolls,
// swipes or jumps to a random screen - thousands of times - and records every
// page error, console error, blank screen and dead end, with the last actions
// that led to it.
//
//   npm run dev, then:
//   node scripts/crawl.mjs                 2000 steps, Chromium, normal mode
//   STEPS=5000 BROWSER=webkit HOST=1 SEED=7 node scripts/crawl.mjs
//     HOST=1: pretend to be the iPhone (VantageHost + the phone's real apps)
//
// Never presses anything destructive (delete, erase, reset, remove, sign out,
// uninstall), never leaves the app for other websites.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { browserType, ENGINE } from './_browser.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const STEPS = Number(process.env.STEPS ?? 2000);
const HOST = process.env.HOST === '1';
let seed = Number(process.env.SEED ?? Date.now() % 100000);
const SEED = seed;
const OUT = `screenshots/crawl/${ENGINE}${HOST ? '-host' : ''}-${SEED}/`;
mkdirSync(OUT, { recursive: true });

// Small seeded random generator, so a run can be repeated exactly.
const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (list) => list[Math.floor(random() * list.length)];

const DANGER = /delete|erase|reset|remove|clear all|sign out|log out|uninstall|forget|wipe|factory/i;
const ROUTES = [
  'home/1', 'home/2', 'home/3', 'today', 'controls', 'notifications', 'search', 'switcher', 'lock',
  'app/clock/alarm', 'app/clock/world', 'app/clock/timer', 'app/clock/stopwatch', 'app/customise',
  'customise/themes', 'customise/colors', 'customise/wallpapers', 'customise/lock', 'customise/home',
  'customise/icons', 'customise/statusbar', 'customise/controls', 'customise/fonts', 'customise/widgets',
  'customise/widgetlab', 'customise/sounds', 'customise/modes', 'customise/access', 'customise/motion',
  'app/vantage', 'app/weather', 'app/calculator', 'app/compass', 'app/recorder', 'app/notes', 'app/arcade',
  ...(HOST ? ['home/9'] : ['app/phone', 'app/messages', 'app/music', 'app/files', 'app/calendar', 'app/reminders', 'app/maps', 'app/settings', 'app/lockin', 'app/photos', 'app/contacts', 'app/mail']),
];

const apps = HOST ? JSON.parse(readFileSync(new globalThis.URL('./fixtures/phone-apps.json', import.meta.url), 'utf8')) : [];
const browser = await browserType.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 667 },
  deviceScaleFactor: 1,
  ...(HOST ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 VantageOSHost/0.3.0' } : {}),
});
// Stay inside the app: other websites (Spotify sign-in, maps tiles...) are blocked.
await context.route('**/*', (route) => {
  const url = route.request().url();
  if (url.startsWith(URL) || url.startsWith('data:') || url.startsWith('blob:') || /open-meteo|fonts\.g/.test(url)) return route.continue();
  return route.abort();
});
await context.addInitScript(({ host, list }) => {
  if (!sessionStorage.getItem('seeded')) {
    localStorage.clear();
    localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false }));
    sessionStorage.setItem('seeded', '1');
  }
  window.open = () => null;
  if (!host) return;
  window.vantageNative = {
    version: '0.3.0', iosVersion: '16.3',
    isHosted: () => Promise.resolve(true),
    getInfo: () => Promise.resolve({ hosted: true, version: '0.3.0', iosVersion: '16.3', model: 'iPhone12,8' }),
    listApps: () => Promise.resolve(list),
    getBadges: () => Promise.resolve({}),
    openApp: () => Promise.resolve(),
    getShortcuts: () => Promise.resolve([{ type: 'a', title: 'New Note' }]),
    runShortcut: () => Promise.resolve(),
    getAppInfo: (id) => Promise.resolve({ name: 'App', bundleId: id, source: 'appstore', version: '1.0', shortcuts: 1 }),
    uninstallApp: () => Promise.reject(new Error('crawler never removes apps')),
    getBattery: () => Promise.resolve({ level: 0.7, charging: false }),
    getBrightness: () => Promise.resolve(0.5),
    setBrightness: () => Promise.resolve(),
    setFlashlight: () => Promise.resolve(),
    onVolumeChord: () => Promise.resolve(() => {}),
  };
}, { host: HOST, list: apps });

const page = await context.newPage();
page.on('dialog', (dialog) => void dialog.dismiss());
const problems = new Map(); // text -> { kind, count, trail, shot }
const trail = [];
const note = (action) => {
  trail.push(action);
  if (trail.length > 12) trail.shift();
};
let step = 0;
const record = async (kind, text) => {
  const key = `${kind}: ${String(text).slice(0, 300)}`;
  const known = problems.get(key);
  if (known) return void known.count++;
  const shot = `${OUT}problem-${problems.size + 1}.png`;
  problems.set(key, { kind, text: String(text).slice(0, 1000), count: 1, step, trail: [...trail], shot });
  await page.screenshot({ path: shot }).catch(() => {});
};
const NOISE = /Failed to load resource|ERR_FAILED|net::|blocked|open-meteo|tile|nominatim|File chooser|AbortError|The operation was aborted|NotAllowedError|play\(\)|webkitAudioContext|AudioContext/i;
page.on('pageerror', (error) => void record('pageerror', `${error.name}: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error' && !NOISE.test(message.text())) void record('console.error', message.text());
});

const wait = (ms) => page.waitForTimeout(ms);
const goHome = async () => {
  await page.goto(URL).catch(() => {});
  await wait(1500);
  await page.evaluate(() => window.vantageGo?.('unlock')).catch(() => {});
  await wait(500);
};

/** Everything a finger could touch right now, inside the screen. */
async function targets() {
  return page.evaluate((danger) => {
    const re = new RegExp(danger, 'i');
    const list = [];
    const nodes = document.querySelectorAll('button, [role=button], [role=tab], [role=switch], [role=slider], [role=menuitem], a[href], input:not([type=file]), textarea, select, [data-item-id], [data-app-icon]');
    nodes.forEach((el, index) => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.right < 0 || r.bottom < 0 || r.left > 375 || r.top > 667) return;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.pointerEvents === 'none' || el.disabled) return;
      const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.tagName).trim().slice(0, 40);
      if (re.test(label)) return;
      const x = Math.min(374, Math.max(1, r.left + r.width / 2));
      const y = Math.min(666, Math.max(1, r.top + r.height / 2));
      // Only what is really on top at that point (not hidden behind a sheet)
      const top = document.elementFromPoint(x, y);
      if (!top || !(el === top || el.contains(top) || top.contains(el))) return;
      list.push({ index, x, y, label, tag: el.tagName, type: el.getAttribute('type') || '', input: el.matches('input, textarea') });
    });
    return list;
  }, DANGER.source);
}

async function swipe(x1, y1, x2, y2) {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(x1 + ((x2 - x1) * i) / 6, y1 + ((y2 - y1) * i) / 6);
  await page.mouse.up();
}

await goHome();
const started = Date.now();
for (step = 1; step <= STEPS; step++) {
  try {
    // Left the app (a link): come back
    if (!page.url().startsWith(URL)) {
      note(`left the app (${page.url().slice(0, 60)}), back`);
      await goHome();
      continue;
    }
    const roll = random();
    if (roll < 0.06) {
      const route = pick(ROUTES);
      note(`route ${route}`);
      await page.evaluate((r) => window.vantageGo?.(r), route);
      await wait(500);
    } else if (roll < 0.12) {
      const [name, args] = pick([
        ['swipe left', [320, 400, 40, 400]],
        ['swipe right', [40, 400, 320, 400]],
        ['swipe down', [187, 200, 187, 520]],
        ['swipe up from bottom', [187, 660, 187, 300]],
        ['swipe down from top', [100, 4, 100, 400]],
      ]);
      note(name);
      await swipe(...args);
      await wait(350);
    } else if (roll < 0.17) {
      note('scroll');
      await page.mouse.move(187, 380);
      await page.mouse.wheel(0, random() < 0.7 ? 400 : -400);
      await wait(200);
    } else if (roll < 0.19) {
      note('Escape');
      await page.keyboard.press('Escape');
      await wait(250);
    } else {
      let list = await targets();
      // A panel may still be sliding in: look again before calling it a dead end.
      if (list.length === 0) {
        await wait(700);
        list = await targets();
      }
      if (list.length === 0) {
        note('nothing to press: route home/1');
        await record('dead end', `no buttons on screen after: ${trail.slice(-3).join(' > ')}`);
        await page.evaluate(() => window.vantageGo?.('unlock').then(() => window.vantageGo?.('home/1')));
        await wait(600);
        continue;
      }
      const target = pick(list);
      if (target.input && target.type !== 'range' && target.type !== 'checkbox' && random() < 0.7) {
        const text = pick(['hello', '12', 'Zürich', 'a'.repeat(60), '😀 ok', '']);
        note(`type "${text.slice(0, 12)}" into ${target.label}`);
        await page.mouse.click(target.x, target.y);
        await page.keyboard.type(text, { delay: 0 });
        if (random() < 0.5) await page.keyboard.press('Enter');
      } else if (random() < 0.1) {
        note(`long-press ${target.label}`);
        await page.mouse.move(target.x, target.y);
        await page.mouse.down();
        await wait(850);
        await page.mouse.up();
      } else {
        note(`tap ${target.label}`);
        await page.mouse.click(target.x, target.y);
      }
      await wait(220);
    }
    // Health: the app must still be drawn
    if (step % 25 === 0) {
      const blank = await page.evaluate(() => (document.getElementById('root')?.childElementCount ?? 0) === 0);
      if (blank) {
        await record('blank screen', `the app disappeared after: ${trail.slice(-4).join(' > ')}`);
        await goHome();
      }
    }
    if (step % 500 === 0) console.log(`${step}/${STEPS} steps, ${problems.size} problems, ${Math.round((Date.now() - started) / 1000)} s`);
  } catch (error) {
    note(`(step failed: ${String(error.message).split('\n')[0].slice(0, 80)})`);
    if (/Target closed|crashed/i.test(error.message)) {
      await record('crash', error.message);
      break;
    }
  }
}

const report = [...problems.values()].sort((a, b) => b.count - a.count);
writeFileSync(`${OUT}report.json`, JSON.stringify({ engine: ENGINE, host: HOST, seed: SEED, steps: STEPS, problems: report }, null, 1));
console.log(`\n${ENGINE}${HOST ? ' host' : ''} seed ${SEED}: ${STEPS} steps in ${Math.round((Date.now() - started) / 1000)} s, ${report.length} problem(s)`);
for (const p of report) console.log(` - [${p.kind}] x${p.count} ${p.text.slice(0, 160)}\n     after: ${p.trail.slice(-4).join(' > ')}`);
await browser.close();
process.exit(report.length ? 1 : 0);
