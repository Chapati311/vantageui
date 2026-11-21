// A contact sheet of a folder of real-device screenshots:
//   DIR=../vantage-tweak/shots/tour-... node scripts/sheet.mjs   -> <DIR>/sheet.png
import { readdirSync, readFileSync } from 'node:fs';
import { browserType } from './_browser.mjs';
const DIR = process.env.DIR;
const files = readdirSync(DIR).filter((f) => f.endsWith('.png') && f !== 'sheet.png').sort();
const COLS = Number(process.env.COLS ?? 5);
const browser = await browserType.launch();
const page = await browser.newPage({ viewport: { width: COLS * 200 + 16, height: 400 } });
await page.setContent(`<style>body{margin:0;padding:8px;display:flex;flex-wrap:wrap;gap:8px;background:#20262d;font:11px sans-serif;color:#ccc}figure{margin:0;width:192px}img{width:192px;border-radius:8px;display:block}</style>` +
  files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(`${DIR}/${f}`).toString('base64')}"><figcaption>${f.replace('.png', '')}</figcaption></figure>`).join(''));
await page.screenshot({ path: `${DIR}/sheet.png`, fullPage: true });
console.log(`${DIR}/sheet.png`);
await browser.close();
