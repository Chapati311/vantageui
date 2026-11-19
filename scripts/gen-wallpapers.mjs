// Draws the signature wallpapers (procedural, no photos) and saves them as
// WebP files in public/wallpapers/, 750 x 1334 (the iPhone SE at 2x).
// The same seed always gives the same picture, so running it again changes
// nothing unless the drawing code changes.
//
//   npm run gen:wallpapers
//
// It uses the Chromium that Playwright already installed for the screenshots:
// each wallpaper is drawn on a <canvas> and exported as WebP.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const W = 750;
const H = 1334;
const MAX_BYTES = 250 * 1024;
const OUT = new URL('../public/wallpapers/', import.meta.url);

// Every drawing gets: ctx, W, H and rand() (a seeded random 0-1).
const DRAWINGS = {
  /** Lacquer: glossy red 3D folds, deep #5E0B12 to #E0313E with soft highlights */
  lacquer: `
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#2a0508'); g.addColorStop(0.5, '#5E0B12'); g.addColorStop(1, '#3a070c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Folds: wide ribbons on a slant, each with a dark crease and a bright ridge
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.42); ctx.scale(1.5, 1.5); ctx.translate(-W / 2, -H / 2);
    ctx.filter = 'blur(10px)';
    for (let i = 0; i < 7; i++) {
      const y0 = -200 + i * 240 + rand() * 80;
      const bend = 200 + rand() * 260;
      const band = ctx.createLinearGradient(0, y0, 0, y0 + 260);
      band.addColorStop(0, 'rgba(20,0,2,0)');
      band.addColorStop(0.35, 'rgba(94,11,18,0.9)');
      band.addColorStop(0.55, 'rgba(224,49,62,0.95)');
      band.addColorStop(0.62, 'rgba(255,170,170,0.55)');
      band.addColorStop(0.7, 'rgba(224,49,62,0.85)');
      band.addColorStop(1, 'rgba(40,2,6,0)');
      ctx.fillStyle = band;
      ctx.beginPath();
      ctx.moveTo(-50, y0);
      ctx.bezierCurveTo(W * 0.3, y0 - bend, W * 0.7, y0 + bend, W + 50, y0 - 40);
      ctx.lineTo(W + 50, y0 + 220);
      ctx.bezierCurveTo(W * 0.7, y0 + 260 + bend, W * 0.3, y0 + 260 - bend, -50, y0 + 260);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore(); ctx.filter = 'none';
    // Soft gloss on top
    const gloss = ctx.createRadialGradient(W * 0.3, H * 0.25, 10, W * 0.3, H * 0.25, W);
    gloss.addColorStop(0, 'rgba(255,200,200,0.18)'); gloss.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gloss; ctx.fillRect(0, 0, W, H);
  `,

  /** Obsidian Leaf: a dark grey macro leaf, veins branching from a midrib */
  obsidian: `
    ctx.fillStyle = '#0e0f10'; ctx.fillRect(0, 0, W, H);
    const leaf = ctx.createRadialGradient(W * 0.55, H * 0.45, 40, W * 0.55, H * 0.45, H * 0.7);
    leaf.addColorStop(0, '#3a3c3f'); leaf.addColorStop(0.6, '#1c1d1f'); leaf.addColorStop(1, '#0b0b0c');
    ctx.fillStyle = leaf; ctx.fillRect(0, 0, W, H);
    // Midrib: a gentle curve from bottom-left to top-right
    const rib = (t) => [W * 0.18 + t * W * 0.7 + Math.sin(t * 3) * 30, H * 1.05 - t * H * 1.1];
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(190,195,200,0.55)'; ctx.lineWidth = 5;
    ctx.beginPath(); for (let t = 0; t <= 1; t += 0.01) { const [x, y] = rib(t); t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    // Side veins with smaller branches
    const vein = (x, y, angle, length, width, depth) => {
      if (depth > 3 || length < 12) return;
      const steps = 12;
      let a = angle, px = x, py = y;
      for (let s = 1; s <= steps; s++) {
        a += (rand() - 0.5) * 0.12;
        const nx = px + Math.cos(a) * length / steps, ny = py + Math.sin(a) * length / steps;
        // Each step is its own short line, getting thinner toward the tip
        ctx.lineWidth = width * (1 - s / (steps + 4));
        ctx.strokeStyle = 'rgba(170,175,180,' + (0.42 - depth * 0.09) + ')';
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
        px = nx; py = ny;
        if (s % 4 === 0) vein(px, py, a + (rand() < 0.5 ? 0.9 : -0.9), length * 0.45, width * 0.55, depth + 1);
      }
    };
    for (let t = 0.04; t < 0.98; t += 0.055) {
      const [x, y] = rib(t);
      vein(x, y, -Math.PI * 0.22 - rand() * 0.2, 260 + rand() * 120, 2.6, 0);
      vein(x, y, Math.PI * 0.78 + rand() * 0.2, 260 + rand() * 120, 2.6, 0);
    }
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  `,

  /** Reed Glass: vertical ribbed glass over a blurred sage-green scene */
  reed: `
    const scene = document.createElement('canvas'); scene.width = W; scene.height = H;
    const s = scene.getContext('2d');
    s.fillStyle = '#c9d3c4'; s.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      const x = rand() * W, y = rand() * H, r = 80 + rand() * 260;
      const g = s.createRadialGradient(x, y, 0, x, y, r);
      const c = rand() < 0.5 ? '94,128,92' : rand() < 0.5 ? '235,240,230' : '60,82,62';
      g.addColorStop(0, 'rgba(' + c + ',0.85)'); g.addColorStop(1, 'rgba(' + c + ',0)');
      s.fillStyle = g; s.fillRect(0, 0, W, H);
    }
    // Ribs: each 30px strip shows the scene squeezed and shifted, with a bright edge
    const rib = 30;
    for (let x = 0; x < W; x += rib) {
      ctx.drawImage(scene, x - rib * 0.6, 0, rib * 2.2, H, x, 0, rib, H);
      const shade = ctx.createLinearGradient(x, 0, x + rib, 0);
      shade.addColorStop(0, 'rgba(255,255,255,0.35)'); shade.addColorStop(0.25, 'rgba(255,255,255,0)');
      shade.addColorStop(0.8, 'rgba(0,0,0,0.05)'); shade.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = shade; ctx.fillRect(x, 0, rib, H);
    }
  `,

  /** Night Reed: the same ribbed glass over a deep green-black scene */
  nightreed: `
    const scene = document.createElement('canvas'); scene.width = W; scene.height = H;
    const s = scene.getContext('2d');
    s.fillStyle = '#050a07'; s.fillRect(0, 0, W, H);
    for (let i = 0; i < 20; i++) {
      const x = rand() * W, y = rand() * H, r = 90 + rand() * 260;
      const g = s.createRadialGradient(x, y, 0, x, y, r);
      const c = rand() < 0.6 ? '28,62,40' : '70,110,76';
      g.addColorStop(0, 'rgba(' + c + ',0.8)'); g.addColorStop(1, 'rgba(' + c + ',0)');
      s.fillStyle = g; s.fillRect(0, 0, W, H);
    }
    const rib = 30;
    for (let x = 0; x < W; x += rib) {
      ctx.drawImage(scene, x - rib * 0.6, 0, rib * 2.2, H, x, 0, rib, H);
      const shade = ctx.createLinearGradient(x, 0, x + rib, 0);
      shade.addColorStop(0, 'rgba(255,255,255,0.12)'); shade.addColorStop(0.25, 'rgba(255,255,255,0)');
      shade.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = shade; ctx.fillRect(x, 0, rib, H);
    }
  `,

  /** Porcelain: #EFEFEC with a 2% grain */
  porcelain: `
    ctx.fillStyle = '#EFEFEC'; ctx.fillRect(0, 0, W, H);
    const img = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) { const n = (rand() - 0.5) * 12; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
  `,

  /** Notebook: cream paper #F5EDD3 with a 3% paper grain and faint fibres */
  notebook: `
    ctx.fillStyle = '#F5EDD3'; ctx.fillRect(0, 0, W, H);
    const img = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) { const n = (rand() - 0.5) * 16; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n * 0.8; }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = 'rgba(120,100,60,0.06)'; ctx.lineWidth = 1;
    for (let i = 0; i < 300; i++) { const x = rand() * W, y = rand() * H, a = rand() * Math.PI; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); ctx.stroke(); }
  `,

  /** Frost: a desaturated macro flower, soft and pale */
  frost: `
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#d9dcdf'); bg.addColorStop(1, '#b9bec3');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const cx = W * 0.7, cy = H * 0.6;
    // Petals: long soft ellipses around the center, light on one side
    for (let ring = 0; ring < 3; ring++) {
      const count = 14 + ring * 4;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + ring * 0.2 + rand() * 0.1;
        const len = 620 - ring * 150 + rand() * 60;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        const g = ctx.createLinearGradient(0, -40, 0, 40);
        g.addColorStop(0, 'rgba(250,250,252,0.85)'); g.addColorStop(0.6, 'rgba(205,208,214,0.85)'); g.addColorStop(1, 'rgba(150,156,164,0.8)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(len / 2, 0, len / 2, 62 - ring * 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    // The flower's heart: a dense cluster of tiny dots
    for (let i = 0; i < 900; i++) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 120;
      ctx.fillStyle = 'rgba(' + (90 + rand() * 60) + ',' + (95 + rand() * 60) + ',' + (100 + rand() * 60) + ',0.8)';
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2 + rand() * 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // Shallow depth of field: everything a little soft
    ctx.filter = 'blur(6px)'; ctx.drawImage(ctx.canvas, 0, 0); ctx.filter = 'none';
  `,
};

const browser = await chromium.launch();
const page = await browser.newPage();
mkdirSync(OUT, { recursive: true });

for (const [name, code] of Object.entries(DRAWINGS)) {
  let quality = 0.86;
  let bytes;
  // Lower the quality step by step until it fits the size limit
  for (;;) {
    const dataUrl = await page.evaluate(
      ({ code, W, H, quality, seed }) => {
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        // mulberry32: a tiny seeded random number generator
        let a = seed;
        const rand = () => {
          a |= 0;
          a = (a + 0x6d2b79f5) | 0;
          let t = Math.imul(a ^ (a >>> 15), 1 | a);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        new Function('ctx', 'W', 'H', 'rand', code)(ctx, W, H, rand);
        return canvas.toDataURL('image/webp', quality);
      },
      { code, W, H, quality, seed: [...name].reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7) },
    );
    bytes = Buffer.from(dataUrl.split(',')[1], 'base64');
    if (bytes.length <= MAX_BYTES || quality < 0.4) break;
    quality -= 0.08;
  }
  writeFileSync(new URL(`${name}.webp`, OUT), bytes);
  console.log(`${name}.webp  ${(bytes.length / 1024).toFixed(0)} KB  (quality ${quality.toFixed(2)})`);
}

await browser.close();
