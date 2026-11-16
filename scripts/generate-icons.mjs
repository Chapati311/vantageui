// Draws the Vantage logo (a "V" made of dots) and saves the app icons into
// public/icons. Run it with: npm run icons
// No extra packages needed - it writes the PNG files by hand.
import { deflateSync, crc32 } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT_DIR = new URL('../public/icons/', import.meta.url);

// 1 = dot, 0 = empty
const V = [
  '1000001',
  '1000001',
  '0100010',
  '0100010',
  '0010100',
  '0010100',
  '0001000',
];
const GRID = V.length;
const LOGO_SIZE = 0.56; // how much of the icon the V fills
const DOT_RADIUS = 0.4; // relative to one grid cell
const FROM = [0x6e, 0xe7, 0xb7]; // accent gradient start
const TO = [0x14, 0xb8, 0xa6]; // accent gradient end
const BG = [0x06, 0x09, 0x0d]; // background (same as --color-bg)

/** All dots as { x, y, r } in 0..1 icon coordinates. */
function dots() {
  const cell = LOGO_SIZE / GRID;
  const start = (1 - LOGO_SIZE) / 2;
  const list = [];
  V.forEach((row, gy) => {
    [...row].forEach((ch, gx) => {
      if (ch === '1') {
        list.push({
          x: start + (gx + 0.5) * cell,
          y: start + (gy + 0.5) * cell,
          r: cell * DOT_RADIUS,
        });
      }
    });
  });
  return list;
}

function colorAt(x, y) {
  const t = Math.min(1, Math.max(0, (x + y) / 2));
  return FROM.map((c, i) => Math.round(c + (TO[i] - c) * t));
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function png(size) {
  const all = dots();
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let py = 0; py < size; py++) {
    const rowStart = py * (size * 3 + 1);
    raw[rowStart] = 0; // PNG filter: none
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5) / size;
      const y = (py + 0.5) / size;
      // coverage 0..1 with a 1px soft edge
      let coverage = 0;
      for (const d of all) {
        const dist = Math.hypot(x - d.x, y - d.y);
        coverage = Math.max(coverage, Math.min(1, Math.max(0, (d.r - dist) * size + 0.5)));
      }
      const [r, g, b] = colorAt(x, y);
      const i = rowStart + 1 + px * 3;
      raw[i] = Math.round(BG[0] + (r - BG[0]) * coverage);
      raw[i + 1] = Math.round(BG[1] + (g - BG[1]) * coverage);
      raw[i + 2] = Math.round(BG[2] + (b - BG[2]) * coverage);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function svg() {
  const circles = dots()
    .map((d) => `<circle cx="${(d.x * 100).toFixed(2)}" cy="${(d.y * 100).toFixed(2)}" r="${(d.r * 100).toFixed(2)}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6EE7B7"/><stop offset="1" stop-color="#14B8A6"/></linearGradient></defs><rect width="100" height="100" fill="#06090d"/><g fill="url(#g)">${circles}</g></svg>\n`;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(new URL('apple-touch-icon.png', OUT_DIR), png(180));
writeFileSync(new URL('icon-192.png', OUT_DIR), png(192));
writeFileSync(new URL('icon-512.png', OUT_DIR), png(512));
writeFileSync(new URL('icon.svg', OUT_DIR), svg());
console.log('Icons written to public/icons');
