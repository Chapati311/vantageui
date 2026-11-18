// Every app at 375 x 667, with a little sample data so the screens aren't
// empty (the empty states are checked separately by opening a fresh app).
//   npm run dev, then: npm run screenshots:apps [theme]
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const URL = process.env.APP_URL ?? 'http://localhost:5173';
const OUT = 'screenshots/apps/';
const theme = process.argv[2] ?? 'midnight';
const LIGHT = ['paper', 'sand', 'sky', 'blossom', 'matcha'];
const RETRO = ['nokia', 'gameboy', 'amber', 'terminal', 'casio', 'desktop'];
mkdirSync(OUT, { recursive: true });

const settings = RETRO.includes(theme) ? { retroTheme: theme, mode: 'retro' } : LIGHT.includes(theme) ? { lightTheme: theme, appearance: 'light' } : { darkTheme: theme, appearance: 'dark' };
const today = new Date();
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plus = (n) => key(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n));
const lockin = {
  setupDone: true, role: 'student', country: 'ch', gradingSystemId: 'ch', dailyGoal: 120,
  subjects: [
    { id: 's1', name: 'Maths', color: '#60A5FA', glyph: 'Ma' },
    { id: 's2', name: 'English', color: '#F472B6', glyph: 'En' },
    { id: 's3', name: 'Biology', color: '#34D399', glyph: 'Bi' },
  ],
  grades: [
    { id: 'g1', subjectId: 's1', value: 5, weight: 1, type: 'exam', date: plus(-30), note: '' },
    { id: 'g2', subjectId: 's1', value: 4.5, weight: 1, type: 'quiz', date: plus(-10), note: '' },
    { id: 'g3', subjectId: 's2', value: 5.5, weight: 2, type: 'exam', date: plus(-12), note: '' },
    { id: 'g4', subjectId: 's3', value: 3.75, weight: 1, type: 'exam', date: plus(-5), note: '' },
  ],
  lessons: [0, 1, 2, 3, 4].flatMap((day) => [
    { id: `l${day}a`, subjectId: 's1', day, start: '08:00', end: '08:45', room: 'A12' },
    { id: `l${day}b`, subjectId: day % 2 ? 's2' : 's3', day, start: '09:00', end: '09:45', room: 'B3' },
  ]),
  homework: [{ id: 'h1', subjectId: 's1', title: 'Exercises 4-9', due: plus(1), done: false }, { id: 'h2', subjectId: 's2', title: 'Essay draft', due: plus(-1), done: false }],
  exams: [{ id: 'e1', subjectId: 's3', title: 'Cells', date: plus(6), minutesPerDay: 45 }],
};
const sessions = [1, 2, 3].map((n) => ({ id: `x${n}`, startedAt: Date.now() - n * 86400000, minutes: 30 + n * 20, tag: 'Maths', type: 'pomodoro', completed: true }));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
await context.addInitScript(([s, l, sess]) => {
  if (sessionStorage.getItem('seeded')) return;
  localStorage.clear();
  localStorage.setItem('vantage.settings.v1', JSON.stringify(s));
  localStorage.setItem('vantage.lockin.v1', JSON.stringify(l));
  localStorage.setItem('vantage.lockin.sessions.v1', JSON.stringify(sess));
  sessionStorage.setItem('seeded', '1');
}, [settings, lockin, sessions]);
const page = await context.newPage();
const problems = [];
page.on('pageerror', (error) => problems.push(error.message));
page.on('console', (message) => message.type() === 'error' && !/tile|nominatim|404|Failed to load resource/.test(message.text()) && problems.push(message.text().slice(0, 200)));
const run = (action, params = {}) => page.evaluate(([a, p]) => window.vantage.runAction(a, p), [action, params]);
const wait = (ms) => page.waitForTimeout(ms);
const shots = [];

await page.goto(URL);
await wait(4000);
await run('shell.unlock');
await wait(600);
await run('calendar.save', { event: { id: 'ev1', title: 'Dentist', date: key(today), time: '16:30', duration: 60, note: '' } });
await run('reminders.save', { reminder: { id: 'r1', title: 'Buy milk', date: key(today), time: null, done: false, notified: false, createdAt: Date.now() } });

const apps = process.env.APPS ? process.env.APPS.split(',') : ['phone', 'messages', 'contacts', 'mail', 'notes', 'lockin', 'weather', 'calendar', 'reminders', 'music', 'recorder', 'camera', 'photos', 'maps', 'calculator', 'browser', 'files', 'compass', 'arcade', 'customise', 'settings'];
for (const app of apps) {
  await run('app.open', { appId: app });
  await wait(app === 'maps' ? 2500 : 1000);
  const path = `${OUT}${theme}-${app}.png`;
  await page.screenshot({ path });
  shots.push(path);
  await run('app.close');
  await wait(400);
}

const sheet = await context.newPage();
await sheet.setViewportSize({ width: 7 * 236 + 16, height: 600 });
await sheet.setContent(`<style>body{margin:0;padding:16px;display:flex;flex-wrap:wrap;gap:16px;background:#20262d}img{width:220px;border-radius:10px}</style>` + shots.map((p) => `<img src="data:image/png;base64,${readFileSync(p).toString('base64')}">`).join(''));
await sheet.screenshot({ path: `${OUT}sheet-${theme}.png`, fullPage: true });
await browser.close();
console.log('saved', `${OUT}sheet-${theme}.png`);
if (problems.length) console.log('Errors:\n - ' + [...new Set(problems)].join('\n - '));
