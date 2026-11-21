/**
 * "Tinted" real app icons (REAL_OS_PROMPT 1.4): the real icon turned
 * monochrome and coloured with the theme's accent, like iOS 18's tinted
 * icons. Made once per app and accent with a canvas, then cached.
 */
import { useEffect, useState } from 'react';

const cache = new Map<string, string>();
const SIZE = 180;

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The current accent (from the theme engine's CSS variable). */
export function currentAccent(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#2dd4bf';
}

/** PNG data URL of the tinted icon. */
export function tintIcon(key: string, src: string, accent: string): Promise<string> {
  const cacheKey = `${key}|${accent}`;
  const hit = cache.get(cacheKey);
  if (hit) return Promise.resolve(hit);
  const rgb = hexToRgb(accent) ?? [45, 212, 191];
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas'));
      ctx.drawImage(image, 0, 0, SIZE, SIZE);
      const pixels = ctx.getImageData(0, 0, SIZE, SIZE);
      const d = pixels.data;
      for (let i = 0; i < d.length; i += 4) {
        // Brightness of the original pixel -> how much accent it gets, on a
        // near-black base (bright parts glow in the accent, the rest stays dark).
        const light = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        const k = 0.12 + 0.88 * light;
        d[i] = Math.round(rgb[0] * k);
        d[i + 1] = Math.round(rgb[1] * k);
        d[i + 2] = Math.round(rgb[2] * k);
      }
      ctx.putImageData(pixels, 0, 0);
      const url = canvas.toDataURL('image/png');
      cache.set(cacheKey, url);
      resolve(url);
    };
    image.onerror = () => reject(new Error('icon failed to load'));
    image.src = src;
  });
}

/** The tinted version of an icon (the original until it is ready). */
export function useTintedIcon(key: string, src: string, accent: string, enabled: boolean): string {
  const [url, setUrl] = useState(() => cache.get(`${key}|${accent}`) ?? src);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    tintIcon(key, src, accent)
      .then((tinted) => alive && setUrl(tinted))
      .catch(() => alive && setUrl(src));
    return () => {
      alive = false;
    };
  }, [key, src, accent, enabled]);
  return enabled ? url : src;
}
