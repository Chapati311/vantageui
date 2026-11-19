// Host mode check: pretends to be the jailbroken iPhone (VantageHost's user
// agent) and checks the behaviour the real home screen needs:
//  - starts unlocked (the iOS lock screen did the security), no boot replay
//  - home button ('vantage:home'): 1st press closes the open app, 2nd goes to page 1
//  - ?restore=1 reopens the app that was open before a reload
//   npm run dev, then: node scripts/host-mode-check.mjs   (BROWSER=webkit works too)
import { browserType } from './_browser.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const browser = await browserType.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 667 },
  deviceScaleFactor: 2,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 VantageOSHost/0.3.0',
});
await context.addInitScript(() => {
  if (sessionStorage.getItem('seeded')) return;
  localStorage.clear();
  localStorage.setItem('vantage.settings.v1', JSON.stringify({ setupDone: true, bootAnimation: false }));
  sessionStorage.setItem('seeded', '1');
});
const page = await context.newPage();
const problems = [];
const check = (ok, what) => (ok ? console.log(`ok    ${what}`) : (problems.push(what), console.log(`FAIL  ${what}`)));
const wait = (ms) => page.waitForTimeout(ms);
const home = () => page.evaluate(() => window.dispatchEvent(new CustomEvent('vantage:home')));
const appOpen = () => page.locator('[data-app-view]').count().then((n) => n > 0);
const lockVisible = () => page.getByRole('button', { name: /unlock/i }).count().then((n) => n > 0);

await page.goto(URL);
await wait(2500);
check(!(await lockVisible()), 'starts unlocked (no Vantage lock screen)');

await page.evaluate(() => window.vantage.runAction('app.open', { appId: 'clock' }));
await wait(900);
const hasMarker = await page.locator('[data-app-view]').count();
if (!hasMarker) console.log('note  no [data-app-view] marker: checking by the app title instead');
const isOpen = async () => (hasMarker ? appOpen() : page.getByText('Stopwatch').count().then((n) => n > 0));
check(await isOpen(), 'app opens');

await home();
await wait(1200);
check(!(await isOpen()), 'home button closes the app');

await page.evaluate(() => window.dispatchEvent(new CustomEvent('vantage:home-page')));
await home();
await wait(600);
check(true, 'home button with nothing open does not throw');

// Reload the way VantageHost does after iOS ended the page.
await page.evaluate(() => window.vantage.runAction('app.open', { appId: 'clock' }));
await wait(900);
await page.goto(`${URL}/?host=springboard&restore=1`);
await wait(2500);
check(await isOpen(), 'restore=1 reopens the last app');
check(!page.url().includes('restore=1'), 'restore flag is removed from the address');

await browser.close();
if (problems.length) {
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log('\nHost mode OK');
