// Which browser engine the UI scripts use.
//   BROWSER=chromium (default) or BROWSER=webkit (Safari's engine, like the iPhone)
// With webkit, phone-sized pages (375 wide) get Playwright's iPhone SE profile:
// "iPhone SE (3rd gen)" has the same 375 x 667 @2x screen as the 2nd-gen SE,
// plus the iPhone Safari user agent, touch and mobile viewport rules.
// Every page error and console error is also recorded to
// screenshots/errors-<engine>.json, so `npm run test:webkit` can compare engines.
import { chromium, webkit, devices } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

export const ENGINE = (process.env.BROWSER ?? 'chromium').toLowerCase() === 'webkit' ? 'webkit' : 'chromium';
const type = ENGINE === 'webkit' ? webkit : chromium;
const ERRORS_FILE = `screenshots/errors-${ENGINE}.json`;
const SCRIPT = basename(process.argv[1] ?? 'script');
const errors = [];

function phoneOptions(options = {}) {
  if (ENGINE !== 'webkit' || options.viewport?.width !== 375) return options;
  const { defaultBrowserType, ...iphone } = devices['iPhone SE (3rd gen)'];
  return { ...iphone, ...options }; // the script's own viewport/scale/touch settings win
}

function watch(page) {
  const record = (kind, text) => errors.push({ script: SCRIPT, kind, text: String(text).slice(0, 500), url: page.url() });
  page.on('pageerror', (error) => record('pageerror', `${error.name}: ${error.message}`));
  page.on('console', (message) => (message.type() === 'error' || message.type() === 'warning') && record(`console.${message.type()}`, message.text()));
  page.on('requestfailed', (request) => record('requestfailed', `${request.url()} ${request.failure()?.errorText ?? ''}`));
  return page;
}

function wrapContext(context) {
  const newPage = context.newPage.bind(context);
  context.newPage = async () => watch(await newPage());
  return context;
}

process.on('exit', () => {
  try {
    mkdirSync('screenshots', { recursive: true });
    let previous = [];
    try { previous = JSON.parse(readFileSync(ERRORS_FILE, 'utf8')).filter((e) => e.script !== SCRIPT); } catch {}
    writeFileSync(ERRORS_FILE, JSON.stringify([...previous, ...errors], null, 1));
  } catch {}
});

/** Use instead of `chromium` in the UI scripts: browserType.launch(). */
export const browserType = {
  async launch(options) {
    const browser = await type.launch(options);
    const newContext = browser.newContext.bind(browser);
    const newPage = browser.newPage.bind(browser);
    browser.newContext = async (o = {}) => wrapContext(await newContext(phoneOptions(o)));
    browser.newPage = async (o = {}) => watch(await newPage(phoneOptions(o)));
    return browser;
  },
};
