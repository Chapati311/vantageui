/**
 * "Vantage glyph" look for apps without a hand-made glyph (DEVICE_QA P0-3):
 * a clean one-color silhouette made from the app's REAL icon. The icon's
 * background color is found from a ring just inside its edge; everything
 * that clearly differs from it is the artwork and becomes solid, the rest
 * transparent. Used as a CSS mask, so it takes the glyph color of the theme
 * (white on dark, black on light), never a blurry crop of the picture.
 * Made once per app at full resolution (180 px) and cached.
 */
import { useEffect, useState } from 'react';

const SIZE = 180;
const cache = new Map<string, string>();

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export function makeSilhouette(key: string, src: string): Promise<string> {
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return reject(new Error('no canvas'));
      ctx.drawImage(image, 0, 0, SIZE, SIZE);
      const pixels = ctx.getImageData(0, 0, SIZE, SIZE);
      const d = pixels.data;
      // Background: the median color of a ring 10% inside the edge (inside the rounded corners)
      const ring: [number[], number[], number[]] = [[], [], []];
      const inset = Math.round(SIZE * 0.1);
      for (let i = inset; i < SIZE - inset; i += 3) {
        for (const [x, y] of [[i, inset], [i, SIZE - inset - 1], [inset, i], [SIZE - inset - 1, i]]) {
          const p = (y * SIZE + x) * 4;
          ring[0].push(d[p]);
          ring[1].push(d[p + 1]);
          ring[2].push(d[p + 2]);
        }
      }
      const bg = ring.map(median);
      const alphaAt = new Float32Array(SIZE * SIZE);
      let covered = 0;
      for (let i = 0; i < SIZE * SIZE; i++) {
        const p = i * 4;
        const distance = Math.hypot(d[p] - bg[0], d[p + 1] - bg[1], d[p + 2] - bg[2]);
        // Soft but high-contrast edge: below 36 = background, above 96 = artwork
        const a = Math.min(1, Math.max(0, (distance - 36) / 60)) * (d[p + 3] / 255);
        alphaAt[i] = a;
        if (a > 0.5) covered++;
      }
      // Artwork that fills almost the whole icon (photo-like icons): keep its bright parts instead
      if (covered > SIZE * SIZE * 0.6) {
        for (let i = 0; i < SIZE * SIZE; i++) {
          const p = i * 4;
          const light = (0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]) / 255;
          alphaAt[i] = Math.min(1, Math.max(0, (light - 0.55) / 0.2)) * (d[p + 3] / 255);
        }
      }
      // The outer edge of the icon itself is never artwork
      const edge = Math.round(SIZE * 0.06);
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const i = y * SIZE + x;
          const p = i * 4;
          const outside = x < edge || y < edge || x >= SIZE - edge || y >= SIZE - edge;
          d[p] = d[p + 1] = d[p + 2] = 255;
          d[p + 3] = outside ? 0 : Math.round(alphaAt[i] * 255);
        }
      }
      ctx.putImageData(pixels, 0, 0);
      const url = canvas.toDataURL('image/png');
      cache.set(key, url);
      resolve(url);
    };
    image.onerror = () => reject(new Error('icon failed to load'));
    image.src = src;
  });
}

/** The silhouette's data URL ('' until it is ready). */
export function useSilhouette(key: string, src: string, enabled: boolean): string {
  const [url, setUrl] = useState(() => cache.get(key) ?? '');
  useEffect(() => {
    if (!enabled || !src) return;
    let alive = true;
    makeSilhouette(key, src)
      .then((made) => alive && setUrl(made))
      .catch(() => alive && setUrl(''));
    return () => {
      alive = false;
    };
  }, [key, src, enabled]);
  return enabled ? url : '';
}
