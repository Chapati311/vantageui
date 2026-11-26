// Where does Vantage spend time? Runs the built app at phone-like speed
// (CPU slowed down THROTTLE times) and reports, per scenario: frames per second,
// slow frames, long tasks, React commits and script / style / layout time.
//   APP_URL=http://localhost:4173 THROTTLE=4 SETTINGS=file.json node scripts/perf-profile.mjs
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const apps = JSON.parse(readFileSync(new URL('./fixtures/phone-apps.json', import.meta.url), 'utf8'));
const settings = process.env.SETTINGS ? JSON.parse(readFileSync(process.env.SETTINGS, 'utf8')) : { setupDone: true, bootAnimation: false };
const THROTTLE = Number(process.env.THROTTLE ?? 4);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 VantageOSHost/0.3.0' });
await context.addInitScript(([list, s]) => {
  if (!sessionStorage.getItem('s')) { localStorage.clear(); localStorage.setItem('vantage.settings.v1', JSON.stringify({ ...s, bootAnimation: false })); sessionStorage.setItem('s', '1'); }
  window.vantageNative = { listApps: () => Promise.resolve(list), getBadges: () => Promise.resolve({}), getBattery: () => Promise.resolve({ level: 0.8, charging: false }), onVolumeChord: () => Promise.resolve(() => {}), getControls: () => Promise.resolve({}), getNotifications: () => Promise.resolve([]) };
  // Count React commits (React reports to the devtools hook when it exists)
  window.__commits = 0;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: () => window.__commits++, onCommitFiberUnmount: () => {}, onPostCommitFiberRoot: () => {}, checkDCE: () => {} };
  window.__long = [];
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch {}
}, [apps, settings]);
const page = await context.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');
await page.goto(process.env.APP_URL ?? 'http://localhost:4173');
await page.waitForTimeout(3000);
await page.reload();
await page.waitForTimeout(3000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });

const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));

async function measure(name, action, ms = 3000) {
  const before = await metrics();
  await page.evaluate(() => {
    window.__long.length = 0;
    window.__commits = 0;
    window.__frames = [];
    let last = performance.now();
    const f = (t) => { window.__frames.push(t - last); last = t; window.__raf = requestAnimationFrame(f); };
    window.__raf = requestAnimationFrame(f);
  });
  const t0 = Date.now();
  await action();
  const rest = ms - (Date.now() - t0);
  if (rest > 0) await page.waitForTimeout(rest);
  const r = await page.evaluate(() => {
    cancelAnimationFrame(window.__raf);
    const fr = window.__frames.slice(1);
    const total = fr.reduce((a, b) => a + b, 0);
    return { fps: Math.round((fr.length / total) * 1000), slow: fr.filter((d) => d > 34).length, worst: Math.round(Math.max(0, ...fr)), commits: window.__commits, long: window.__long.slice(0, 8), anims: document.getAnimations().filter((a) => a.playState === 'running').length, nodes: document.querySelectorAll('*').length };
  });
  const after = await metrics();
  const d = (k) => Math.round((after[k] - before[k]) * 1000);
  const secs = (Date.now() - t0) / 1000;
  console.log(`${name.padEnd(26)} fps ${String(r.fps).padStart(3)}  slow ${String(r.slow).padStart(3)}  worst ${String(r.worst).padStart(4)}ms  commits/s ${(r.commits / secs).toFixed(1).padStart(5)}  script ${d('ScriptDuration')}ms style ${d('RecalcStyleDuration')}ms layout ${d('LayoutDuration')}ms  anims ${r.anims} nodes ${r.nodes}  long ${r.long.join(',')}`);
}

const swipe = async (x1, y1, x2, y2, steps = 12) => {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps });
  await page.mouse.up();
};

if (process.env.DIAG) {
  // What's on the page: blurred elements, running animations, element counts per part
  console.log(await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(e).visibility !== 'hidden'; };
    const name = (e) => (e.className?.baseVal ?? e.className ?? '').toString().split(' ')[0] || e.tagName;
    const bf = all.filter((e) => (getComputedStyle(e).backdropFilter || getComputedStyle(e).webkitBackdropFilter || 'none') !== 'none');
    const tree = (el, depth) => depth === 0 ? [] : [...el.children].flatMap((k) => [`${'  '.repeat(6 - depth)}${name(k)} ${k.querySelectorAll('*').length}${vis(k) ? '' : ' (hidden)'}`, ...(k.querySelectorAll('*').length > 120 ? tree(k, depth - 1) : [])]);
    const anims = document.getAnimations().filter((a) => a.playState === 'running').map((a) => `${a.animationName || 'js'} -> ${name(a.effect?.target ?? document.body)}${vis(a.effect?.target ?? document.body) ? '' : ' (hidden)'}`);
    return JSON.stringify({ blur: bf.map((e) => `${name(e)}${vis(e) ? '' : ' (hidden)'} opacity=${getComputedStyle(e).opacity}`), anims, hiddenNodes: all.filter((e) => !vis(e)).length, total: all.length, tree: tree(document.body, 6) }, null, 1);
  }));
}

await measure('home idle', async () => {});
if (process.env.CPUPROF) {
  // Which functions run while the home screen sits idle?
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.start');
  await page.waitForTimeout(3000);
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map();
  const dt = profile.timeDeltas;
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  profile.samples.forEach((id, i) => {
    const n = byId.get(id);
    const key = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber}`;
    self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0) / 1000);
  });
  console.log([...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${v.toFixed(0).padStart(6)}ms ${k}`).join('\n'));
}
if (process.env.EXP) {
  // Experiments: what does idle cost without the animations / the wallpaper?
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
  await measure('home idle, anims paused', async () => {});
  await page.evaluate(() => document.querySelectorAll('[class*="wallpaper"]').forEach((e) => (e.style.display = 'none')));
  await measure('  + wallpaper hidden', async () => {});
  await page.evaluate(() => { const t = document.querySelector('[class*="_track_"]'); if (t) t.style.display = 'none'; });
  await measure('  + home pages hidden', async () => {});
}
await measure('home swipe pages', async () => { await swipe(320, 400, 60, 400); await page.waitForTimeout(700); await swipe(60, 400, 320, 400); });
await measure('today view', async () => { await swipe(60, 400, 340, 400); await page.waitForTimeout(500); }, 2500);
await page.evaluate(() => window.vantageGo?.('home/0'));
await page.waitForTimeout(800);
for (const app of (process.env.APPS ?? 'settings,customise,netrunner').split(',')) {
  await measure(`open ${app}`, async () => { await page.evaluate((a) => window.vantageGo?.(`app/${a}`), app); }, 1500);
  await measure(`${app} idle`, async () => {}, 2000);
  await measure(`${app} scroll`, async () => { await swipe(187, 550, 187, 150, 20); await page.waitForTimeout(400); await swipe(187, 150, 187, 550, 20); });
  await page.evaluate(() => window.vantageGo?.('home/0'));
  await page.waitForTimeout(800);
}
await browser.close();
